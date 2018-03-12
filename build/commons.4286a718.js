!function(n){function e(t){if(r[t])return r[t].exports;var u=r[t]={i:t,l:!1,exports:{}};return n[t].call(u.exports,u,u.exports,e),u.l=!0,u.exports}var t=window.webpackJsonp_name_;window.webpackJsonp_name_=function(r,o,a){for(var i,l,f,s=0,c=[];s<r.length;s++)l=r[s],u[l]&&c.push(u[l][0]),u[l]=0;for(i in o)Object.prototype.hasOwnProperty.call(o,i)&&(n[i]=o[i]);for(t&&t(r,o,a);c.length;)c.shift()();if(a)for(s=0;s<a.length;s++)f=e(e.s=a[s]);return f};var r={},u={2:0};e.m=n,e.c=r,e.d=function(n,t,r){e.o(n,t)||Object.defineProperty(n,t,{configurable:!1,enumerable:!0,get:r})},e.n=function(n){var t=n&&n.__esModule?function(){return n.default}:function(){return n};return e.d(t,"a",t),t},e.o=function(n,e){return Object.prototype.hasOwnProperty.call(n,e)},e.p="",e.oe=function(n){throw console.error(n),n}}([function(n,e,t){"use strict";function r(n,e){if(!(n instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var u=function(){function n(n,e){var t=[],r=!0,u=!1,o=void 0;try{for(var a,i=n[Symbol.iterator]();!(r=(a=i.next()).done)&&(t.push(a.value),!e||t.length!==e);r=!0);}catch(n){u=!0,o=n}finally{try{!r&&i.return&&i.return()}finally{if(u)throw o}}return t}return function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return n(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),o=function(){function n(n,e){for(var t=0;t<e.length;t++){var r=e[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(n,r.key,r)}}return function(e,t,r){return t&&n(e.prototype,t),r&&n(e,r),e}}(),a=function(){function n(){r(this,n)}return o(n,null,[{key:"fetchRestaurants",value:function(e){var t=new XMLHttpRequest;t.open("GET",n.DATABASE_URL),t.onload=function(){if(200===t.status){var n=JSON.parse(t.responseText),r=n.restaurants;e(null,r)}else{var u="Request failed. Returned status of "+t.status;e(u,null)}},t.send()}},{key:"fetchRestaurantById",value:function(e,t){n.fetchRestaurants(function(n,r){if(n)t(n,null);else{var u=r.find(function(n){return n.id==e});u?t(null,u):t("Restaurant does not exist",null)}})}},{key:"fetchRestaurantByCuisine",value:function(e,t){n.fetchRestaurants(function(n,r){if(n)t(n,null);else{var u=r.filter(function(n){return n.cuisine_type==e});t(null,u)}})}},{key:"fetchRestaurantByNeighborhood",value:function(e,t){n.fetchRestaurants(function(n,r){if(n)t(n,null);else{var u=r.filter(function(n){return n.neighborhood==e});t(null,u)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(e,t,r){n.fetchRestaurants(function(n,u){if(n)r(n,null);else{var o=u;"all"!=e&&(o=o.filter(function(n){return n.cuisine_type==e})),"all"!=t&&(o=o.filter(function(n){return n.neighborhood==t})),r(null,o)}})}},{key:"fetchNeighborhoods",value:function(e){n.fetchRestaurants(function(n,t){if(n)e(n,null);else{var r=t.map(function(n,e){return t[e].neighborhood}),u=r.filter(function(n,e){return r.indexOf(n)==e});e(null,u)}})}},{key:"fetchCuisines",value:function(e){n.fetchRestaurants(function(n,t){if(n)e(n,null);else{var r=t.map(function(n,e){return t[e].cuisine_type}),u=r.filter(function(n,e){return r.indexOf(n)==e});e(null,u)}})}},{key:"urlForRestaurant",value:function(n){return"./restaurant.html?id="+n.id}},{key:"imageUrlForRestaurant",value:function(n){var e=n.photograph.split("."),t=u(e,2),r=t[0],o=t[1],a=this.getImageSizes();return"/img/"+r+"-"+(a[0]?a[0]:"320")+"."+o}},{key:"imageSrcsetForRestaurant",value:function(n){var e=n.photograph.split("."),t=u(e,2),r=t[0],o=t[1],a=this.getImageSizes();return a.map(function(n){return"/img/"+r+"-"+n+"."+o+" "+n+"w"}).join(", ")}},{key:"getImageSizes",value:function(){return["320","640","800"]}},{key:"mapMarkerForRestaurant",value:function(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:n.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}},{key:"DATABASE_URL",get:function(){return"/data/restaurants.json"}}]),n}();e.default=a},function(n,e){}]);