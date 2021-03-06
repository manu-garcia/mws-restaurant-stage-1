import 'intersection-observer';
import DBHelper from './dbhelper.js';
import './init_sw.js';
import '../css/styles.scss';

export class Main {

  constructor () {
      this.restaurants = [];
      this.neighborhoods = [];
      this.cuisines = [];
      this.map = null;
      this.markers = [];
      this.imageObserver = null;
      this.db = null;
  }


  /**
   * Initialize the data and maps
   */
  initApp () {

    this.initDB().then(() => {

      this.initImageLazyLoader();
      this.initMap();
  
      this.fetchNeighborhoods();
      this.fetchCuisines();
  
    });

  }

  /**
   * Initilizes the offline DB and gets the restaurants from the network with offline first technique.
   */
  initDB () {
    this.db = new DBHelper();
    let idOpenedPromise = this.db.openDatabase();

    return new Promise((resolve, reject) => {
      this.db.fetchRestaurants(null, (error, restaurants) => {
        if (error) return reject (error);

        resolve(restaurants);

      });      
    });

  }  

  /**
   * Sets up the image lazy loader. Larger images will be loaded once visible. 
   */
  initImageLazyLoader () {

    var options = {
      // As soon as any pixel is visible, image will be loaded
      threshold: 0.5
    }
    
    // InersectionObserver has been pollyfilled by "intersection-observer" npm package
    this.imageObserver = new IntersectionObserver(this.imageLazyLoader.bind(this), options);

  }

  /**
   * Callback called whenever an observed intersection ocurrs.
   * 
   * @param {*} intersections : List of intersections happened
   * @param {*} observer : The observer watching the intersections
   * 
   */
  imageLazyLoader (intersections, observer) {

    intersections.forEach((intersection) => {
      // Load the image as soon as any part of the image is visible
      if (intersection.intersectionRatio >= 0.5) {
        this.lazyLoadImage(intersection.target);
      }
    });
  }

  /**
   * Lazy loads a responsive image
   * 
   * @param {*} image : image element to be lazy loaded
   * 
   *  data-sizes and data-srcset image attributes are expected to be used instead
   *  sizes and srcset repectively.
   * 
   */
  lazyLoadImage (image) {
    
    const sizes = image.dataset.sizes;
    const srcset = image.dataset.srcset;

    this.fetchResponsiveImage(sizes, srcset).then(() => {
      image.sizes = sizes;
      image.srcset = srcset;
    })

  }

  /**
   * fetches the responsive image
   * 
   * @param {*} sizes : image sizes attribute
   * @param {*} srcset : image srcset attribute
   */
  fetchResponsiveImage (sizes, srcset) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.sizes = sizes;
      image.srcset = srcset;
      image.onload = resolve;
      image.onerror = reject;
    });
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods () {
    this.db.fetchNeighborhoods((error, neighborhoods) => {
      if (error) { // Got an error
        console.error('Main.fetchNeighborhoods: ', error);
      } else {
        this.neighborhoods = neighborhoods;
        this.fillNeighborhoodsHTML();
      }
    });
  }

  /**
   * Set neighborhoods HTML.
   */
  fillNeighborhoodsHTML () {
    const select = document.getElementById('neighborhoods-select');
    
    if (this.neighborhoods) {
      this.neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
      });
    }
  
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  fetchCuisines () {
    this.db.fetchCuisines((error, cuisines) => {
      if (error) { // Got an error!
        console.error('Main.fetchCuisines: ', error);
      } else {
        this.cuisines = cuisines;
        this.fillCuisinesHTML();
      }
    });
  }

  /**
   * Set cuisines HTML.
   */
  fillCuisinesHTML () {
    const select = document.getElementById('cuisines-select');

    if (this.cuisines) {
      this.cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
      });
    }
  
  }

  /**
   * Initialize Google map, called from HTML.
   */
  initMap () {

    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };

    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });

    this.updateRestaurants();
  }

  /**
   * Update page and map for current restaurants.
   */
  updateRestaurants () {
    
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    this.db.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
      if (error) { // Got an error!
        console.error('Main.updateRestaurants: ', error);
      } else {

        this.resetRestaurants(restaurants);
        this.fillRestaurantsHTML();
      }
    })
  };

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  resetRestaurants (restaurants) {
    // Remove all restaurants
    this.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (this.markers) {
      this.markers.forEach(m => m.setMap(null));
    }

    this.markers = [];
    this.restaurants = restaurants;
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  fillRestaurantsHTML () {
    const ul = document.getElementById('restaurants-list');

    if (this.restaurants) {
  
      this.restaurants.forEach(restaurant => {
        ul.append(this.createRestaurantHTML(restaurant));
      });
  
      this.addMarkersToMap();
    }
  }

  /**
   * Create restaurant HTML.
   */
  createRestaurantHTML (restaurant) {
    const li = document.createElement('li');

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    li.append(name);

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = "Restaurant " + restaurant.name;
    image.src = this.db.imageUrlForRestaurant(restaurant);

    // Restaurant image will be displayed at a 80% of the horizontal view port 
    // while in a single column layout
    // Once breakpoint at 750px is hit, layout would change to two columns, so image
    // display size would be at 40% of the horizontal view port
    // As we'd like to lazy load images, we use data-sizes in here to avoid direct loading of images
    image.setAttribute('data-sizes', "(min-width: 750px) 40vw, 80vw");

    // img srcset based on photograph name and expected sizes.
    // TODO: Polifill srcset with http://scottjehl.github.io/picturefill/
    // As we'd like to lazy load images, we use data-srcset in here to avoid direct loading of images    
    image.setAttribute('data-srcset', this.db.imageSrcsetForRestaurant(restaurant));
    
    // Observe the position/visibility of the image element in the viewport, to 
    // lazy load images only if they are visible
    this.imageObserver.observe(image);
    
    li.append(image);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = this.db.urlForRestaurant(restaurant);
    more.alt = 'Restaurant ' + restaurant.name;
    li.append(more);

    return li;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  addMarkersToMap () {

    if (this.restaurants) {
      this.restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = this.db.mapMarkerForRestaurant(restaurant, this.map);
        google.maps.event.addListener(marker, 'click', () => {
          window.location.href = marker.url
        });
        this.markers.push(marker);
      });
    }
  
  }

}
