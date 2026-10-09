/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "d6cc2b092c5e15496126224607eaf831"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7b5d27af1c85ad01f06e8218560d89b"
  }, {
    "url": "pwa-192x192.png",
    "revision": "fd424b9dcb68ed3066d125d2d2afb83d"
  }, {
    "url": "index.html",
    "revision": "1c1e0c0a3469177eca05e1bc45e3d2d4"
  }, {
    "url": "icon.svg",
    "revision": "8492e761fb216d071926d2b9f0a95648"
  }, {
    "url": "icon-maskable.svg",
    "revision": "1ddfce5e0c0e886ec54cbfe27083e374"
  }, {
    "url": "favicon.ico",
    "revision": "9252c24cad914023a8ea74c0821ad152"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "2e069e591221d0cff826f38a7e5d9163"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-DKhtON6R.js",
    "revision": null
  }, {
    "url": "assets/purify.es-Dn3VvdGh.js",
    "revision": null
  }, {
    "url": "assets/index.es-C_6ddMb4.js",
    "revision": null
  }, {
    "url": "assets/index-BPwB49GC.css",
    "revision": null
  }, {
    "url": "assets/index-B2ATQ1Gc.js",
    "revision": null
  }, {
    "url": "assets/html2canvas-X-LoFX0t.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "2e069e591221d0cff826f38a7e5d9163"
  }, {
    "url": "favicon.ico",
    "revision": "9252c24cad914023a8ea74c0821ad152"
  }, {
    "url": "icon-maskable.svg",
    "revision": "1ddfce5e0c0e886ec54cbfe27083e374"
  }, {
    "url": "icon.svg",
    "revision": "8492e761fb216d071926d2b9f0a95648"
  }, {
    "url": "pwa-192x192.png",
    "revision": "fd424b9dcb68ed3066d125d2d2afb83d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7b5d27af1c85ad01f06e8218560d89b"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d6cc2b092c5e15496126224607eaf831"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f68494af23428138c1a8f911b98da7e7"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/, /script\.google\.com/]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
