import idb from 'idb';

// Offline DB configuration
const DB_NAME = 'mws-restaurants';
const DB_VERSION = 3;
const DB_STORE_NAME_RESTAURANTS = 'restaurants';
const DB_STORE_NAME_REVIEWS = 'reviews';
const DB_STORE_NAME_PENDING_REVIEWS = 'pendingreviews';

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
  getServerURL () {

    return "http://localhost:1337";

  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  getRestaurantURL (id) {

    let url = this.getServerURL() + "/restaurants";
    if (id) {
      url += "/" + id;
    }

    return url;
  }

  /**
   * All reviews for a restaurant 
   */
  getRestaurantReviewsURL (id) {

    let url = this.getServerURL() + "/reviews?restaurant_id=" + id;

    return url;
  }

  /**
   * Reviews endpoint url
   */
  getReviewsURL () {

    return this.getServerURL() + "/reviews/";

  }

  getFavoriteRestaurantURL (restaurant) {
    return this.getServerURL() + `/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
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
      upgradeDb.createObjectStore(DB_STORE_NAME_RESTAURANTS);
      upgradeDb.createObjectStore(DB_STORE_NAME_REVIEWS);
      
      const pendingReviewsStore = upgradeDb.createObjectStore(DB_STORE_NAME_PENDING_REVIEWS);
      pendingReviewsStore.createIndex("restaurant_id", "restaurant_id", { unique: false, multiEntry: true });
      pendingReviewsStore.createIndex("_id", "_id", { unique: true, multiEntry: false });

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
  
      let objectStore = db.transaction(DB_STORE_NAME_RESTAURANTS).objectStore(DB_STORE_NAME_RESTAURANTS);

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
  
      let tx = db.transaction(DB_STORE_NAME_RESTAURANTS, 'readwrite');

      if (!id) {
        // All resaturants
        tx.objectStore(DB_STORE_NAME_RESTAURANTS).clear();

        data.forEach(restaurant => {
          tx.objectStore(DB_STORE_NAME_RESTAURANTS).put(restaurant, restaurant.id);
        });

      } else {
        // Specific restaurant
        tx.objectStore(DB_STORE_NAME_RESTAURANTS).put(data, data.id);        
      }
    
      return tx.complete;
    });
  
  }

  /**
   * Saves review in the offline DB
   * 
   * @param {any} data: review payload object to save
   * 
   */
  setOfflinePendingReview (data) {
    
    return this.db.then(db => {
  
      if (!data || !data._id) return;
  
      let tx = db.transaction(DB_STORE_NAME_PENDING_REVIEWS, 'readwrite');

      tx.objectStore(DB_STORE_NAME_PENDING_REVIEWS).put(data, data._id);        
    
      return tx.complete;
    });
  
  }

  /**
   * Saves reviews in the offline DB
   * 
   * @param {any} reviews: review payload object to save
   * 
   */
  setOfflineReviews (reviews, restaurantId) {
    
    return this.db.then(db => {
  
      if (!reviews || !restaurantId) return;
  
      let tx = db.transaction(DB_STORE_NAME_REVIEWS, 'readwrite');

      tx.objectStore(DB_STORE_NAME_REVIEWS).put(reviews, restaurantId);        
    
      return tx.complete;
    });
  
  }

  /**
   * Submit one review existing in the offline db
   */
  submitPendingReviewSW (_id) {

    return this.getOfflinePendingReviewById(_id).then((review) => {
    
      return fetch(this.getRestaurantReviewsURL(review.restaurant_id), {
          method: 'POST',
          body: JSON.stringify(review)
        })
        .catch(error => {
          reject(`Request failed with error: ${error.message}`);
        })
        .then(response => {
          this.deleteOfflinePendingReview(review._id);
        });
  
    });
  }

  /**
   * Removes a specific review from the offline DB
   * @param {*} _id 
   */
  deleteOfflinePendingReview (_id) {
    
    return this.db.then(db => {
  
      if (!db) reject();

      let tx = db.transaction(DB_STORE_NAME_PENDING_REVIEWS, "readwrite");
      
      tx.objectStore(DB_STORE_NAME_PENDING_REVIEWS).delete(_id);
        
      return tx.complete;
    });
  
  }

  /**
   * Gets reviews from the offline db only
   * 
   * @param {number} id: review pseudo id (_id)
   * 
   */
  getOfflineReviews (restaurantId) {
    
    return this.db.then(db => {
  
      if (!db) return;
  
      let objectStore = db.transaction(DB_STORE_NAME_REVIEWS).objectStore(DB_STORE_NAME_REVIEWS);

      return objectStore.get(restaurantId);
  
    });
  }

  /**
   * Gets pending review from the offline db only
   * 
   * @param {number} id: review pseudo id (_id)
   * 
   */
  getOfflinePendingReviewById (_id) {
    
    return this.db.then(db => {
  
      if (!db) return;
  
      let objectStore = db.transaction(DB_STORE_NAME_PENDING_REVIEWS).objectStore(DB_STORE_NAME_PENDING_REVIEWS);

      return objectStore.get(_id);
  
    });
  }

  /**
   * Gets pending reviews from the offline db only
   * 
   * @param {number} restaurantId
   * 
   */
  getOfflinePendingReviews (restaurantId) {
    
    return this.db.then(db => {
  
      if (!db) return;
  
      let objectStore = db.transaction(DB_STORE_NAME_PENDING_REVIEWS).objectStore(DB_STORE_NAME_PENDING_REVIEWS);
      let myIndex = objectStore.index('restaurant_id'); 

      return myIndex.getAll(restaurantId);
  
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

  fetchRestaurantReviews(restaurantId, callback) {

    // Get first the offline data if any
    this.getOfflineReviews(restaurantId)
      .then(data => {

        if (data && data.length) {

          this.getOfflinePendingReviews(restaurantId)
            .then(pendingReviews => {

              // Send the reviews in the offline db, while we try to get a new list from
              // the network if getting all
              callback(null, data.concat(pendingReviews));

              // We may have some but not all reviews in the offline db,
              // We have just shown the existing ones to the user, but now
              // get all the reviews from the network

            });

        } 

        // Get from the network
        this.fetchReviewsFromNetwork(restaurantId)
          .then( (reviews) => {

            this.setOfflineReviews(reviews, restaurantId)
              .then(() => {

                this.getOfflinePendingReviews(restaurantId)
                  .then(pendingReviews => {
    
                    callback(null, reviews.concat(pendingReviews));

                  });
              })
              .catch((error) => {
                callback(error, null);                
              });

          })
          .catch((error) => {
            callback(error, null);
          });


      })
      .catch((error) => {
        console.log('Error catching offline reviews: ', error);
      });

  }

  fetchOfflineOnlyRestaurantReviews(restaurantId, callback) {

    // Get first the offline data if any
    this.getOfflineReviews(restaurantId)
      .then(data => {

        if (data && data.length) {

          this.getOfflinePendingReviews(restaurantId)
            .then(pendingReviews => {

              // Send the reviews in the offline db, while we try to get a new list from
              // the network if getting all
              callback(null, data.concat(pendingReviews));

              // We may have some but not all reviews in the offline db,
              // We have just shown the existing ones to the user, but now
              // get all the reviews from the network

            });

        }

      })
      .catch((error) => {
        console.log('Error catching offline reviews: ', error);
        callback(error, null);
      });

  }

  fetchReviewsFromNetwork (restaurantId) {

    return fetch(this.getRestaurantReviewsURL(restaurantId))
      .then(response => response.json())
      .catch(error => {
        return `Request failed with error: ${error.message}`;
      })
      .then(reviewsResponse => {
        return reviewsResponse;
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

  setRestaurantFavorite(restaurant) {
    
    return fetch(this.getFavoriteRestaurantURL(restaurant), {
      method: 'PUT'
    })
    .catch(error => {
      reject(`Request failed with error: ${error.message}`);
    })
    .then(response => {
      return response;
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