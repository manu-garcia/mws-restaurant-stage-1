import idb from 'idb';

// Offline DB configuration
const DB_NAME = 'mws-restaurants';
const DB_VERSION = 1;
const DB_STORE_NAME = 'restaurants';

/**
 * Common database helper functions.
 */
class DBHelper {

  constructor () {
    this.db = null;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  getRestaurantURL (id) {

    let url = "http://localhost:1337/restaurants";
    if (id) {
      url += "/" + id;
    }

    return url;
  }

  /**
   * Opens offline databse connection and creates the data store.
   * 
   */
  openDatabase() {
    
    // If there is no support for service workers, we wont use DB for offline first techniques
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    // Open a connection and initialise store
    this.db = idb.open(DB_NAME, DB_VERSION, upgradeDb => {

      // Initialise store.
      upgradeDb.createObjectStore(DB_STORE_NAME);

    });

    return this.db;
  }

  /**
   * Gets restaurant(s) from offline db only
   * 
   * @param {number} id: optional. restaurant id to get or null for all.
   * 
   */
  getOfflineRestaurants (id) {
    
    return this.db.then(db => {
  
      if (!db) return;
  
      let objectStore = db.transaction(DB_STORE_NAME).objectStore(DB_STORE_NAME);

      if (id) {
        return objectStore.get(id);
      }

      return objectStore.getAll();
  
    });
  }

  /**
   * Saves restaurant(s) in the offline DB
   * 
   * @param {string/number} id: restaurant id for specific one or null for all
   * @param {any} data: restaurant object to save or array of objects for a group of restaurants
   * 
   */
  setOfflineRestaurants (id, data) {
    
    return this.db.then(db => {
  
      if (!db) return;
  
      let tx = db.transaction(DB_STORE_NAME, 'readwrite');

      if (!id) {
        // All resaturants
        tx.objectStore(DB_STORE_NAME).clear();

        data.forEach(restaurant => {
          tx.objectStore(DB_STORE_NAME).put(restaurant, restaurant.id);
        });

      } else {
        // Specific restaurant
        tx.objectStore(DB_STORE_NAME).put(data, data.id);        
      }
    
      return tx.complete;
    });
  
  }

  /**
   * Fetches all restaurants from network only
   */
  fetchRestaurantsFromNetwork(id, callback) {

    fetch(this.getRestaurantURL(id))
      .then(response => response.json())
      .catch(error => {
        callback(`Request failed with error: ${error.message}`, null);
      })
      .then(response => {
        const restaurants = response;

        this.setOfflineRestaurants(id, restaurants).then( () => {
          callback(null, restaurants);
        });

      });
  
  }

  /**
   * Fetches all restaurants with offline first technique
   */
  fetchRestaurants(id, callback) {

    // Get first the offline data if any
    this.getOfflineRestaurants(id)
      .then(data => {

        if (data && data.length) {

          // Send the restaurants in the offline db, while we try to get a new list from
          // the network if getting all
          callback(null, data);

          if (!id) {
            // We may have some but not all restaurants in the offline db,
            // We have just shown the existing ones to the user, but now
            // get all the restaurants from the network
            this.fetchRestaurantsFromNetwork(id, callback);
          }

        } else {

          // No data whatsoever in the offline DB, get from the network
          this.fetchRestaurantsFromNetwork(id, callback);

        }

      })
      .catch((error) => {
        console.log('Error catching offline restaurants: ', error);
      });

  }

  /**
   * Fetches a restaurant by its ID with first offline technique.
   */
  fetchRestaurantById(id, callback) {
    // fetch the restaurant with proper error handling.
    this.fetchRestaurants(id, (error, restaurant) => {
      if (error) {
        callback(error, null);
      } else {
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant(restaurant) {
    let sizes = this.getImageSizes();
    let size = sizes[0] ? sizes[0] : '5';
    
    return `/img/${restaurant.photograph}-${size}.jpg`;

  }

  /**
   * Restaurant srcset for multiple sizes based on the photograph name and the expected sizes
   * 
   * It would produce something like:
   * 
   *    srcset="img/photograph-name_320.jpg 320w, img/photograph-name_640.jpg 640w"
   * 
   * @param {obj} restaurant 
   */
  imageSrcsetForRestaurant(restaurant) {

    let sizes = this.getImageSizes();

    let srcset = '';

    srcset = sizes
      .map( size => {
        return `/img/${restaurant.photograph}-${size}.jpg ${size}w`;
      })
      .join(', ');

    return srcset;
  }

  /**
   * Defines the expexted sizes for responsive images
   */
  getImageSizes () {
    return ['5', '320', '640', '800'];
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

export default DBHelper;