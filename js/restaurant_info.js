import DBHelper from './dbhelper.js';
import '../css/styles.scss';

export class RestaurantInfo {

  constructor() {

    this.restaurant = null;
    this.map = null;

  }

  /**
   * Get current restaurant from page URL.
   */
  fetchRestaurantFromURL (callback) {
    if (this.restaurant) { // restaurant already fetched!
      callback(null, this.restaurant)
      return;
    }
    const id = this.getParameterByName('id');
    if (!id) { // no id found in URL
      error = 'No restaurant id in URL'
      callback(error, null);
    } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        this.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }
        this.fillRestaurantHTML(restaurant);
        callback(null, restaurant)
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
    image.className = 'restaurant-img'
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

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
  }

  /**
  * Create restaurant operating hours HTML table and add it to the webpage.
  */
  fillRestaurantHoursHTML (operatingHours) {
    const hours = document.getElementById('restaurant-hours');
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
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }

    const ul = document.getElementById('reviews-list');
    // Controls when a review is even or odd, for styling purposes
    let evenOddIndex = 1;
    reviews.forEach(review => {
      ul.appendChild(this.createReviewHTML(review, evenOddIndex));
      evenOddIndex++;
    });

    container.appendChild(ul);
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
    date.innerHTML = review.date;
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
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
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
  * Initialize Google map, called from HTML.
  */
  initMap () {
    this.fetchRestaurantFromURL((error, restaurant) => {

      if (error) { // Got an error!

        console.error(error);

      } else {

        this.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });

        this.fillBreadcrumb(restaurant);
        DBHelper.mapMarkerForRestaurant(this.restaurant, this.map);
      }

    });
  }

}
