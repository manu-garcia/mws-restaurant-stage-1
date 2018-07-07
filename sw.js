// Polyfilling startsWith
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

// SW_CACHE_VERSION will be replaced while copying this file to the build directory with InterpolateSWPlugin
const appCacheVersion = 'mws-restaurant-v' + '"%SW_CACHE_VERSION%"';

// SW_ASSET_FILES will be fed with all the generated assets for pre-cache purposes
//  while copying this file to the build directory with InterpolateSWPlugin
const bundledAssets = ["%SW_ASSET_FILES%"];
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

  const url = new URL(event.request.url);
  
  // Do not cache the JSON restaurants or reviews, because they are cached in IndexedDB
  let ignoreSearch = url.pathname.startsWith('/restaurant.html') ||
                      url.pathname.startsWith('/restaurants') ||
                      url.pathname.startsWith('/reviews');

  if (event.request.method == 'POST' || ignoreSearch) {
    
    event.respondWith(
      fetch(event.request)
    );

  } else {

    event.respondWith(

      // Request in cache?
      caches.match(event.request, { ignoreSearch: ignoreSearch }).then((cacheResponse) => {
        
        return cacheResponse || fetch(event.request).then((fetchedResponse) => {

          if (!ignoreSearch) {

            // Better off cloning the response here. If done inside caches.open reponse could
            // be already read by returning the original response.
            var clonedFetchedResponse = fetchedResponse.clone();

            // Request was not in the cache. We fetched it and now we save it in the cache.
            caches.open(appCacheVersion).then((cache) => {

              // Reponse stream can be read only once so that it must be cloned.
              cache.put(event.request, clonedFetchedResponse);

            });

          }

          // Make sure reposnse is already cloned before returning here.
          return fetchedResponse;
        });

      })
      .catch(() => {

        // Fallback answer if there is no connectivity and request is not in cache.
        return new Response('Fallback answer if there is no connectivity and request is not in cache.');

      })
    );
  }

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

/**
 * Message to the application thread
 */
function postMessageToClients(message) {
  return clients.matchAll().then(allClients => {
    for (const client of allClients) {
      client.postMessage(message);
    }
  })
};

/**
 * 'sync' will be invoked when having connectivity only (Done by the browser). Then we invoke the application to
 * perform the desired action.
 */
self.addEventListener('sync', function (event) {
  if (event.tag.startsWith('submit-new-review')) {
    event.waitUntil(
      postMessageToClients({
        command: event.tag
      })
    );
  }
});
