(function () {
    "use strict";

    /**
     * @ngdoc overview
     * @name delayLocationChange
     * @description
     *
     * # delayLocationChange
     *
     * `delayLocationChange` module contains the {@link delayLocationChange.delayLocationChange `delayLocationChange`} service.
     *
     */
    angular.module("delayLocationChange", [])

        .service("delayLocationChange", ["$rootScope", "$q", "$timeout", "$location", "$injector",
            function ($rootScope, $q, $timeout, $location, $injector) {

                /**
                 * @ngdoc service
                 * @name delayLocationChange.delayLocationChange
                 * @description
                 *
                 * # delayLocationChange
                 *
                 * `delayLocationChange` allows multiple services to stop the first location change (I.E. the rendering of the first page) until a promise is complete.
                 *
                 *
                 * @param {promise|function()} waitFor - if a promise, will delay until promise is resolved
                 * , if a function, will delay until the result of running the function, which must return a promise, will be resolved.
                 *
                 * @example
                 *
                 * <pre>
                 *   angular.module("myModule",["delayLocationChange"])
                 *   .run(function(delayLocationChange){
      *     delayLocationChange(function($http){
      *       return $http.get("/something/that/is/needed")
      *       .then(function(result){
      *         //do something with result that you need before rendering the first time
      *       })
      *     });
      *   };
                 * </pre>
                 */
                var service = function (arg) {
                    if (arg.then) {
                        //handles a promise
                        addPromise(arg);
                    } else {
                        //assume it's a function
                        if (changeStarted) {
                            addPromise($injector.invoke(fn));
                        } else {
                            //need to wait until angular started the locationChange, otherwise
                            //something might start running before it's should
                            waitingFunctions.push(arg);
                        }
                    }
                };

                // we make sure that all promises finish by counting the number of promises
                //we recieved
                var unfinishedPromises = 0;
                var waitingFunctions = [];
                var changeStarted = false, _toUrl, _fromUrl, nextUrl;

                //checkPromises both determines if all promises were resolved and initiates
                //the delayed location change if no more promises remain
                function checkPromises() {
                    unfinishedPromises--;
                    if (changeStarted && unfinishedPromises <= 0) {
                        reloadChange();
                    }
                }

                function reloadChange() {
                    if ($location.absUrl() === _toUrl) {
                        //we are running on the assumption (that might prove false at some point)
                        //that nothing happens between canceling $locationChangeStart and emitting
                        //$locationChangeSuccess
                        $rootScope.$broadcast("$locationChangeSuccess", _toUrl, _fromUrl);
                    } else {
                        $location.url(nextUrl);
                    }
                }

                function addPromise(promise) {
                    unfinishedPromises++;
                    //to access using array notation because finally is a reserved word
                    promise['finally'](checkPromises);
                }

                var unlisten = $rootScope.$on("$locationChangeStart", function (e, toUrl, fromUrl) {
                    changeStarted = true;
                    nextUrl = $location.url();
                    unlisten();
                    //We are relying on the fact that since the url never actually changed,
                    //the fact that angular will return to the previous ulr when doing preventDefault, will not
                    // have any effect
                    e.preventDefault();
                    waitingFunctions.forEach(function (fn) {
                        addPromise($injector.invoke(fn))
                    });

                    if (unfinishedPromises === 0 && !_toUrl) { //firstCall and no promises
                        //we need to let at least one run through to verify
                        //no promises will be added
                        unfinishedPromises++;
                        $timeout(checkPromises, 1);
                    }
                    _toUrl = toUrl;
                    _fromUrl = fromUrl;
                });

                return service;
            }]);
})();