import DBHelper from './dbhelper.js';
import './init_sw.js';
import '../css/styles.scss';

export class RestaurantInfo {

  constructor() {

    this.restaurant = null;
    this.map = null;
    this.db = new DBHelper();

  }

  /**
   * Get current restaurant from local storage.
   */
  fetchRestaurant (callback) {
    if (this.restaurant) { // restaurant already fetched!
      callback(null, this.restaurant)
      return;
    }
    const id = parseInt(this.getParameterByName('id'));

    if (!id) {
      error = 'No restaurant id in url'
      callback(error, null);
    } else {
      this.db.fetchRestaurantById(id, (error, restaurant) => {
        this.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }

        this.db.fetchRestaurantReviews(id, (error, reviews) => {

          restaurant.reviews = reviews;

          this.fillRestaurantHTML(restaurant);
          callback(null, restaurant)

        });

      });
    }
  }

  /**
   * Create restaurant HTML and add it to the webpage
   */
  fillRestaurantHTML (restaurant) {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.alt = "Restaurant " + restaurant.name;    
    image.src = this.db.imageUrlForRestaurant(restaurant);

    // Restaurant image will be displayed using almos 100% of the viewport width
    image.sizes="calc(100vw - 40px)"
    
    // img srcset based on photograph name and expected sizes.
    image.srcset = this.db.imageSrcsetForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      this.fillRestaurantHoursHTML(restaurant.operating_hours);
    }

    if (restaurant.reviews) {
      // fill reviews
      this.fillReviewsHTML(restaurant.reviews);
    }

    if (!this.addReviewButton) {

      this.addReviewButton = document.getElementById("add-new-review-button");
      if (this.addReviewButton) {
      
        if (navigator.serviceWorker) {

          navigator.serviceWorker.ready
            .then(reg => {

              navigator.serviceWorker.addEventListener('message', message => {

                if (message.data.command.startsWith('submit-new-review')) {
  
                  const _id = message.data.command.split('-')[3];
                  this.db.submitPendingReviewSW(_id);

                }
              });

              this.addReviewButton.addEventListener('click', (event) => {

                event.preventDefault();
                this.setOfflineReview().then((review) => {
        
                  const id = parseInt(this.getParameterByName('id'));
                  
                  this.db.fetchOfflineOnlyRestaurantReviews(id, (error, reviews) => {

                    restaurant.reviews = reviews;
          
                    this.fillRestaurantHTML(restaurant);

                    reg.sync.register(`submit-new-review-${review._id}`)
                    .then(() => {

                    });

                  });

                });
              });
            });

        } else {
          // Send normal XHR
        }
      }
    }

  }

  /**
  * Create restaurant operating hours HTML table and add it to the webpage.
  */
  fillRestaurantHoursHTML (operatingHours) {
    const hours = document.getElementById('restaurant-hours');
    hours.innerHTML = '';

    for (let key in operatingHours) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  }

  /**
  * Create all reviews HTML and add them to the webpage.
  */
  fillReviewsHTML (reviews) {
    const container = document.getElementById('reviews-container');
    container.innerHTML = "";

    const ul = document.createElement('ul');
    ul.id = "reviews-list"; 
    container.appendChild(ul);
    
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }

    // Controls when a review is even or odd, for styling purposes
    let evenOddIndex = 1;
    reviews.forEach(review => {
      ul.appendChild(this.createReviewHTML(review, evenOddIndex));
      evenOddIndex++;
    });

    container.appendChild(ul);
  }

  formatDate (date) {

    if (!date) return '';

    var dt = new Date(date);

    var day = dt.getDate();
    var monthIndex = dt.getMonth();
    var year = dt.getFullYear();

    var minutes = dt.getMinutes();
    var hours = dt.getHours();

    return `${year}-${monthIndex+1}-${day} ${hours}:${minutes}`;

  }

  /**
  * Create review HTML and add it to the webpage.
  */
  createReviewHTML (review, evenOddIndex) {
    const li = document.createElement('li');
    li.className = evenOddIndex % 2 ? 'odd' : 'even';

    // Header will contain the name and date
    const header = document.createElement('div');
    header.className = 'review-header';
    li.appendChild(header);

    const name = document.createElement('span');
    name.innerHTML = review.name;
    header.appendChild(name);

    const date = document.createElement('span');
    date.innerHTML = this.formatDate(review.updatedAt);
    header.appendChild(date);

    // Boddy will contain the rating and review paragraph
    const body = document.createElement('div');
    body.className = 'review-body';
    li.appendChild(body);

    const rating = document.createElement('span');
    rating.innerHTML = `Rating: ${review.rating}`;
    body.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    body.appendChild(comments);

    return li;
  }

  /**
  * Add restaurant name to the breadcrumb navigation menu
  */
  fillBreadcrumb (restaurant) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = "";
    
    const home = document.createElement('li');
    home.innerHTML = '<a href="/">Home</a>';
    home.setAttribute('aria-current', "page");
    breadcrumb.appendChild(home);

    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    li.setAttribute('aria-current', "page");
    breadcrumb.appendChild(li);
  }

  /**
  * Get a parameter by name from page URL.
  */
  getParameterByName (name, url) {

    if (!url) {
      url = window.location.href;
    }

    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);

    if (!results) {
      return null;
    }

    if (!results[2]) {
      return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  /**
   * 
   */
  setOfflineReview () {

    const form = document.getElementById('add-new-review-form');
    const FD = new FormData(form);
    const id = parseInt(this.getParameterByName('id'));
    const payload = {
      _id:  Math.random().toString(36).substr(2, 9),
      restaurant_id: id,
      name: FD.get("name"),
      rating: parseInt(FD.get("rating")),
      comments: FD.get("comments")
    };

    // Save the payload before we send it
    return this.db.setOfflinePendingReview(payload).then(() => {
      form.reset();
      return payload;
    });

  }

  /**
   * Initialize the db and maps
   */
  initApp () {

    this.initDB().then(() => {

      this.initMap();

    });

  }

  /**
  * Initialize Google map, called from HTML.
  */
  initMap () {
    this.fetchRestaurant((error, restaurant) => {

      if (error) { // Got an error!

        console.error(error);

      } else {

        this.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });

        this.fillBreadcrumb(restaurant);
        this.db.mapMarkerForRestaurant(this.restaurant, this.map);
      }

    });
  }

  initDB () {
    this.db = new DBHelper();
    return this.db.openDatabase();
  }  

}
