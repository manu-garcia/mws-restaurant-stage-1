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
  }


  /**
   * Initialize the data and maps
   */
  initApp () {

    this.initMap();

    this.fetchNeighborhoods();
    this.fetchCuisines();

  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods () {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
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
    DBHelper.fetchCuisines((error, cuisines) => {
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

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
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

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    name.tabIndex = 0;
    li.append(name);

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = "Restaurant " + restaurant.name;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    // Restaurant image will be displayed at a 80% of the horizontal view port 
    // while in a single column layout
    // Once breakpoint at 750px is hit, layout would change to two columns, so image
    // display size would be at 40% of the horizontal view port
    image.sizes="(min-width: 750px) 40vw, 80vw"
    
    // img srcset based on photograph name and expected sizes.
    // TODO: Polifill srcset with http://scottjehl.github.io/picturefill/
    image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
    
    li.append(image);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    // more.href = DBHelper.urlForRestaurant(restaurant);
    more.href = "./restaurant.html";
    more.alt = 'Restaurant ' + restaurant.name;
    more.addEventListener('click', () => {
      localStorage.setItem('restaurant_id', restaurant.id);
    }, false);
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
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.map);
        google.maps.event.addListener(marker, 'click', () => {
          window.location.href = marker.url
        });
        this.markers.push(marker);
      });
    }
  
  }

}
