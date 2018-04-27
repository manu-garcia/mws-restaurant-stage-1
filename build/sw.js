// SW_CACHE_VERSION will be replaced while copying this file to the build directory with InterpolateSWPlugin
const appCacheVersion = 'mws-restaurant-v' + '1524857334198';

// SW_ASSET_FILES will be fed with all the generated assets for pre-cache purposes
//  while copying this file to the build directory with InterpolateSWPlugin
const bundledAssets = ["main.fe8a6919.js",
"restaurant_info.d225d50a.js",
"commons.78d97fc2.js",
"styles.78d97fc2.css"];
const staticAssets = [
  "index.html",
  "restaurant.html",
  
  "img/1-5.jpg",
  "img/1-320.jpg",
  "img/1-640.jpg",
  "img/1-800.jpg",

  "img/2-5.jpg",
  "img/2-320.jpg",
  "img/2-640.jpg",
  "img/2-800.jpg",

  "img/3-5.jpg",
  "img/3-320.jpg",
  "img/3-640.jpg",
  "img/3-800.jpg",

  "img/4-5.jpg",
  "img/4-320.jpg",
  "img/4-640.jpg",
  "img/4-800.jpg",

  "img/5-5.jpg",
  "img/5-320.jpg",
  "img/5-640.jpg",
  "img/5-800.jpg",

  "img/6-5.jpg",
  "img/6-320.jpg",
  "img/6-640.jpg",
  "img/6-800.jpg",

  "img/7-5.jpg",
  "img/7-320.jpg",
  "img/7-640.jpg",
  "img/7-800.jpg",

  "img/8-5.jpg",
  "img/8-320.jpg",
  "img/8-640.jpg",
  "img/8-800.jpg",

  "img/9-5.jpg",
  "img/9-320.jpg",
  "img/9-640.jpg",
  "img/9-800.jpg",

  "img/10-5.jpg",
  "img/10-320.jpg",
  "img/10-640.jpg",
  "img/10-800.jpg",

];
const cacheAll = bundledAssets.concat(staticAssets);

/**
 * Pre-cache assets when service worker is registered
 */
self.addEventListener('install', (event) => {
   event.waitUntil(
    caches.open(appCacheVersion).then((cache) => {
      return cache.addAll(cacheAll);
    })
  );
});

/**
 * Activate gets executed after install in the sw life cycle. So current cache is already created.
 */
self.addEventListener('activate', (event) => {
  
    // Promises passed here will block other events, we can safely remove old caches or content here
    event.waitUntil(
      // Loop through all created caches
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          // For now that would do it. Delete all previously created caches but the current one.
          if (appCacheVersion != key) {
            return caches.delete(key);
          }
        }));
      })
    );
  
  });
  
/**
 * Intercepts application's requests and serves them first from cache.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(

    // Request in cache?
    caches.match(event.request).then((cacheResponse) => {
      
      return cacheResponse || fetch(event.request).then((fetchedResponse) => {

        // Better off cloning the response here. If done inside caches.open reponse could
        // be already read by returning the original response.
        var clonedFetchedResponse = fetchedResponse.clone();

        // Request was not in the cache. We fetched it and now we save it in the cache.
        caches.open(appCacheVersion).then((cache) => {

          // Reponse stream can be read only once so that it must be cloned.
          cache.put(event.request, clonedFetchedResponse);

        });

        // Make sure reposnse is already cloned before returning here.
        return fetchedResponse;
      });

    })
    .catch(() => {

      // Fallback answer if there is no connectivity and request is not in cache.
      return new Response('Fallback answer if there is no connectivity and request is not in cache.');

    })
  );
});

/**
 * Custom messages from the application thread
 */
self.addEventListener('message', function(event) {
  // Activate the new service worker
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});