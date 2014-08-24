/**visor
* Angular authentication and authorization library
* @version v0.0.3
* @link  https://github.com/illniyar/visor
* @license MIT License, http://www.opensource.org/licenses/MIT
*/
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
 module.exports = 'visor';
}

(function (window, angular, undefined) {
(function(){
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
	angular.module("delayLocationChange",[])

		.service("delayLocationChange",["$rootScope","$q","$timeout","$location","$injector",
			function($rootScope,$q,$timeout,$location,$injector){

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
      var service = function(arg){
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
      var changeStarted = false,_toUrl,_fromUrl,nextUrl;

      //checkPromises both determines if all promises were resolved and initiates
      //the delayed location change if no more promises remain
      function checkPromises(){
				unfinishedPromises--;
				if (changeStarted && unfinishedPromises <= 0){
					reloadChange();
				}
			}

			function reloadChange(){
				if ($location.absUrl() === _toUrl) {
          //we are running on the assumption (that might prove false at some point)
          //that nothing happens between canceling $locationChangeStart and emitting
          //$locationChangeSuccess
					$rootScope.$broadcast("$locationChangeSuccess",_toUrl,_fromUrl);
				} else {
					$location.url(nextUrl);
				}
			}

			function addPromise(promise){
				unfinishedPromises++;
        //to access using array notation because finally is a reserved word
				promise['finally'](checkPromises);
			}
			var unlisten = $rootScope.$on("$locationChangeStart",function(e,toUrl,fromUrl){
				changeStarted = true;
				nextUrl = $location.url();
				unlisten();
        //We are relying on the fact that since the url never actually changed,
        //the fact that angular will return to the previous ulr when doing preventDefault, will not
        // have any effect
				e.preventDefault();
				waitingFunctions.forEach(function(fn){addPromise($injector.invoke(fn))});

        if(unfinishedPromises === 0 && !_toUrl){ //firstCall and no promises
          //we need to let at least one run through to verify
          //no promises will be added
					unfinishedPromises++;
					$timeout(checkPromises,1);
				}
				_toUrl = toUrl;
				_fromUrl = fromUrl;
			});

			return service;
		}]);
})();


(function(){
  "use strict";

  /**
   * @ngdoc overview
   * @name visor
   * @description
   *
   * # Visor
   *
   * `Visor` is an authentication and authorization module.
   *
   * <div doc-module-components="visor"></div>
   *
   * See {@link visor.visor `visor`} for usage.
   */
  angular.module("visor",["visor.permissions","visor.ui-router","visor.ngRoute","delayLocationChange"])

  /**
   * @ngdoc service
   * @name visor.authenticatedOnly
   * @description
   *
   * # authenticatedOnly
   *
   * `authenticatedOnly` is a restrict function that only allows authenticated users access to a route.
   *
   * @example
   *
   * <pre>
   *   angular.moudle("myModule",["visor"])
   *   .config(function($stateProvider,authenticatedOnly){
   *     $stateProvider.state("private",{
   *       restrict: authenticatedOnly
   *     })
   *   }
   * </pre>
   */
  .constant("authenticatedOnly",function(authData){
      return !!authData;
  })

  /**
   * @ngdoc service
   * @name visor.notForAuthenticated
   * @description
   *
   * # notForAuthenticated
   *
   * `notForAuthenticated` is a restrict function that does not allow authenticated users access to a route.
   *
   * @example
   *
   * <pre>
   *   angular.moudle("myModule",["visor"])
   *   .config(function($stateProvider,notForAuthenticated){
   *     $stateProvider.state("private",{
   *       restrict: notForAuthenticated
   *     })
   *   }
   * </pre>
   */
  .constant("notForAuthenticated",function(authData){
      return authData === undefined;
  })

  /**
   * @ngdoc service
   * @name visor.visorProvider
   * @description
   *
   * @requires visor.visorPermissions
   * @requires visor.delayLocationChange
   *
   * @description
   *
   * `visorProvider` provides configuration options to define how authentication and authorization works.
   *
   * The only required configuration is {@link visor.visorProvider#authenticate `visorProvider.authenticate`}.
   *
   * @example
   *
   * <pre>
   *   angular.moudle("myModule",["visor"])
   *   .config(function(visorProvider){
   *     visorProvider.authenticate = function($http){
   *      return $http.get("/api/user/me").then(function(res){
   *        return res.data;
   *      })
   *     };
   *   }
   * </pre>
   */
  .provider("visor",[function(){
      function addNextToUrl(url,$location,restrictedUrl){
          if (config.shouldAddNext){
              if (url.indexOf("?") >=0) {
                  return url.replace(/\?/,"?next=" + encodeURIComponent(restrictedUrl) + "&");
              }
              return url + "?next=" + encodeURIComponent(restrictedUrl);
          } else {
              return url;
          }
      }
      var config = this;
      /**
       * @ngdoc property
       * @name visor.visorProvider#authenticateOnStartup
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * If `true` visor will try to authenticate before any route is accessed (it will stop the routing until the authentication promise is resolved).
       * If `false` will only authenticate when a user tries to access a route with restriction.
       *
       * Defaults to `true`
       */
      config.authenticateOnStartup = true;
      /**
       * @ngdoc property
       * @name visor.visorProvider#loginRoute
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The route to go to after an unauthenticated user tries to access a restricted url.
       * Only meaningful when using the default {@link visor.visorProvider#doOnNotAuthenticated `visorProvider.doOnNotAuthenticated`} function.
       *
       * Defaults to `/login`
       */
      config.loginRoute = "/login";
      /**
       * @ngdoc property
       * @name visor.visorProvider#homeRoute
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The route to go to after manual authentication.
       * Only meaningful when using the default {@link visor.visorProvider#doAfterManualAuthentication `visorProvider.doAfterManualAuthentication`} function.
       *
       * Defaults to `/`
       */
      config.homeRoute = "/";
      /**
       * @ngdoc property
       * @name visor.visorProvider#notAuthorizedRoute
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The route to go to after an authenticated user tries to access a restricted url.
       * Only meaningful when using the default {@link visor.visorProvider#doOnNotAuthorized `visorProvider.doOnNotAuthorized`} function.
       *
       * Defaults to `/access_denied`
       */
      config.notAuthorizedRoute = "/access_denied";
      /**
       * @ngdoc property
       * @name visor.visorProvider#shouldAddNext
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * When using the default {@link visor.visorProvider#doOnNotAuthenticated `visorProvider.doOnNotAuthenticated`} function, visor adds a `next` parameter to the login url provided in {@link visor.visorProvider#loginRoute `loginRoute`}.
       * Once  a user manually authenticates, that route is used to redirect back to the original requested url.
       *
       * If `false` will not add the next url in {@link visor.visorProvider#doOnNotAuthenticated `visorProvider.doOnNotAuthenticated`}.
       *
       * Defaults to `true`
       */
      config.shouldAddNext = true;

      /**
       * @ngdoc function
       * @name visor.visorProvider#authenticate
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * This function needs to be configured in order to use visor.
       *
       * `visorProvider.authentication` defines the authentication function that will be called to provide
       * the authentication info at startup.
       * It must return a promise that will resolve to an object if the user is authenticated or rejected if
       * the user isn't authenticated.
       *
       * @example
       *
       * <pre>
       *   angular.moudle("myModule",["visor"])
       *   .config(function(visorProvider,$stateProvider){
       *     visorProvider.authenticate = function($http){
       *      return $http.get("/api/user/me").then(function(res){
       *        return res.data;
       *      });
       *     };
       *   });
       * </pre>
       */
      config.authenticate = function(){
          throw new Error("visorProvider.authenticate must be defined to use visor");
      };
      /**
       * @ngdoc function
       * @name visor.visorProvider#doOnNotAuthenticated
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The action to take when a user tries to access a restricted route but is not authenticated.
       * By default it redirect to {@link visor.visorProvider#loginRoute `loginRoute`}.
       * If {@link visor.visorProvider#shouldAddNext `shouldAddNext`} is enabled, a `next` parameter with the restricted url is added to the login url.
       *
       * The url that was restricted is provided by an injected argument named `restrictedUrl`
       *
       * @example
       *
       * <pre>
       *   angular.moudle("myModule",["visor"])
       *   .config(function(visorProvider,$stateProvider){
       *    //redirect to an error page instead of login
       *     visorProvider.doOnNotAuthenticated = function(restrictedUrl,$state){
       *      $state.go("error",{
       *        message: "you need to be logged in to access " + restrictedUrl
       *      })
       *     };
       *   });
       * </pre>  
       */
      config.doOnNotAuthenticated = ["$location","restrictedUrl",function($location,restrictedUrl){
          $location.url(addNextToUrl(config.loginRoute,$location,restrictedUrl))
      }];
      /**
       * @ngdoc function
       * @name visor.visorProvider#doAfterManualAuthentication
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The action to take after a user is authenticated using {@link visor.visor#setAuthenticated `visor.setAuthenticated`}.
       * By default it redirect to next parameter if exists or to {@link visor.visorProvider#homeRoute `homeRoute`}.
       *
       * @example
       *
       * <pre>
       *   angular.moudle("myModule",["visor"])
       *   .config(function(visorProvider,$stateProvider){
       *     //redirect to a new user welcome page
       *     visorProvider.doAfterManualAuthentication = function($state){
       *      $state.go("new_user.welcome")
       *     };
       *   });
       * </pre>
       */
      config.doAfterManualAuthentication = ["$location",function($location){
          $location.url($location.search().next || config.homeRoute);
      }];
      /**
       * @ngdoc function
       * @name visor.visorProvider#doOnNotAuthorized
       * @propertyOf visor.visorProvider
       *
       * @description
       *
       * The action taken when an already authenticated user tries to access a route he is not allowed to view.
       * By default it redirect to {@link visor.visorProvider#notAuthorizedRoute `notAuthorizedRoute`}.
       *
       * The url that was restricted is provided by an injected argument named `restrictedUrl`
       *
       * @example
       *
       * <pre>
       *   angular.moudle("myModule",["visor"])
       *   .config(function(visorProvider,$stateProvider){
       *    //redirect to an error page with the restricted url message
       *     visorProvider.doOnNotAuthorized = function(restrictedUrl,$state){
       *      $state.go("error",{
       *        message: "you are not allowed to access " + restrictedUrl
       *      })
       *     };
       *   });
       * </pre>
       */
      config.doOnNotAuthorized =["$location",function($location){
          $location.url(config.notAuthorizedRoute)
      }];


      /**
       * @ngdoc service
       * @name visor.visor
       * @description
       *
       * @requires visor.visorPermissions
       * @requires visor.delayLocationChange
       *
       * @description
       *
       * `visor` is an authentication and authorization service to be used alongside ngRoute or ui-router.
       *
       * It handles authentication while {@link visor.permissions.visorPermissions `visorPermissions`} handles routing and
       * restrciting access.
       *
       * To use first define how visor is to authenticate by setting `visor.authenticate`, and then add
       * restriction functions to routes/states.
       *
       * @example
       *
       * <pre>
       *   angular.moudle("myModule",["visor"])
       *   .config(function(visorProvider,$stateProvider){
       *     visorProvider.authenticate = function($http){
       *      return $http.get("/api/user/me").then(function(res){
       *        return res.data;
       *      })
       *     };
       *     $stateProvider.state("private",{
       *       restrict: function(user){ return user && user.can_see_private;}
       *     })
       *   }
       * </pre>
       */

      this.$get = ["$injector","$q","$rootScope","$location","visorPermissions",function($injector,$q,$rootScope,$location,visorPermissions){
        // keeps the original auth promise so we won't call authenticate twice.
        var _authenticationPromise = false;
        function onAuthenticationSuccess(authData) {
            Visor.authData =authData;
            visorPermissions.invokeParameters = [Visor.authData];
        }
        function onAuthenticationFailed(){
            Visor.authData = undefined;
            visorPermissions.invokeParameters = [];
        }
        var Visor = {
          /**
           *
           * Authenticate with visor.
           *
           * **Note**: This function was intended for internal use.
           *
           *
           * @param {boolean} retry If true, will force reauthentication. Otherwise, the second call to authenticate will
           *    return the result of the previous authentication call.
           *
           * @returns {promise} Promise that will always resolve as true, with the value returned from {@link visor.visorProvider#authenticate `visorProvider.authenticate`}.
           *    If {@link visor.visorProvider#authenticate `visorProvider.authenticate`} failed, the promise will resolve with `undefined`.
           */
            authenticate:function(retry){
                if (_authenticationPromise && !retry) {
                    return  _authenticationPromise;
                }
                var deferred = $q.defer();
                _authenticationPromise = deferred.promise;
                $injector.invoke(config.authenticate)
                    .then(onAuthenticationSuccess,onAuthenticationFailed)
                    ['finally'](function(){
                        deferred.resolve(Visor.authData)
                    });
                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name visor.visor#setAuthenticated
             * @methodOf visor.visor
             *
             * @description
             *
             *
             * Notify `visor` that an authentication was successful.
             *
             * Typical use is to call this function after a use logs in to the system.
             *
             * <div class="alert alert-info">
             * **Note**: `authData` should be the identical to the result of the promise returned from {@link visor.visorProvider#authenticate `visorProvider.authenticate`}.
             * </div>
             *
             *
             * @param {Any} authData The authentication data to be used in future restrict functions.
             */
            setAuthenticated: function(authData){
                onAuthenticationSuccess(authData);
                _authenticationPromise = $q.when(authData);
                $injector.invoke(config.doAfterManualAuthentication,null,{authData:authData});
            },
            /**
             * @ngdoc function
             * @name visor.visor#isAuthenticated
             * @methodOf visor.visor
             *
             * @description
             *
             * Determine if user was successfuly authenticated.
             *
             *
             * @returns {boolean} True if the user was authenticated. False otherwise.
             */
            isAuthenticated: function(){
                return !!Visor.authData;
            },
            /**
             *
             * Notify visor that a use tried to access a url that is restricted to it.
             *
             * **Note**: This function was intended for internal use.
             *
             *
             * @param {string} restrictedUrl The url that the user was restricted access to.
             *
             */
            onNotAllowed: function(restrictedUrl){
                if (Visor.isAuthenticated()) {
                    $injector.invoke(config.doOnNotAuthorized,null,{restrictedUrl:restrictedUrl});
                } else {
                    $injector.invoke(config.doOnNotAuthenticated,null,{restrictedUrl:restrictedUrl});
                }
            },
            /**
             * @ngdoc function
             * @name visor.visor#setUnauthenticated
             * @methodOf visor.visor
             *
             * @description
             *
             *
             * Notify `visor` that a user is no longer authenticated.
             *
             * Typical use is to call this function after a user logs out of the system.
             */
            setUnauthenticated: function(){
              onAuthenticationFailed()
            },
            config: config
        };
        return Visor;
      }]
  }])
  .run(["visor","delayLocationChange",function(visor,delayLocationChange){
    if (visor.config.authenticateOnStartup) {
      delayLocationChange(visor.authenticate())
    }
  }])
  .config(["visorPermissionsProvider",function(visorPermissionsProvider){
        visorPermissionsProvider.doBeforeFirstCheck.push(["visor",function(Visor){
            return Visor.authenticate();
        }]);
        visorPermissionsProvider.onNotAllowed = ["visor","restrictedUrl",function(Visor,restrictedUrl){
            Visor.onNotAllowed(restrictedUrl);
        }]
  }])
})();
(function(){

  /**
   * @ngdoc overview
   * @name visor.ngRoute
   * @description
   *
   * # Visor.ngRoute
   *
   * `Visor.ngRoute` automatically add supports for permissions in ngRoute, if ngRoute exists.
   *
   */
	angular.module('visor.ngRoute',['visor.permissions'])
		.run(['$rootScope', 'visorPermissions','$injector',function($rootScope, visorPermissions,$injector){
			var ngRouteModuleExists = false;
			try {
				$injector.get("$route");
        ngRouteModuleExists = true;
			}catch (e){}
			if (ngRouteModuleExists) {
				$rootScope.$on('$routeChangeStart', function(e,next){
          next.resolve = next.resolve || {};
					visorPermissions.onRouteChange(next,function delayChange(promise){
            next.resolve._visorDelay = function(){return promise;};
					});
				});
			}
		}])
})();
(function(){
  /**
   * @ngdoc overview
   * @name visor.permissions
   * @description
   *
   * # Visor.Permissions
   *
   * `Visor.Permissions` provides support for handling permissions and restricting access to routes based
   * on those restrictions.
   *
   *
   * See {@link visor.permissions.visorPermissions `visorPermissions service`} for usage.
   */

    angular.module("visor.permissions",[])

    /**
     * @ngdoc service
     * @name visor.permissions.visorPermissionsProvider
     *
     * @description
     *
     * `visorPermissionsProvider` provides a pluggable configuration to adjust how `visor.permissions`
     *  will handle route changes.
     *
     * Some of the api in the configuration is for use in plugins to allow support for multiple routing modules.\
     * Others are for use with clients ( such as {@link visor.visor `visor`} ).
     *
     * For examples of using the various plugin methods see the {@link visor.ngRoute visor.ngRoute}
     * and {@link visor.ui-router visor.ui-router} source codes.
     *
     */
    .provider("visorPermissions",[function(){
        var config = this;
        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#getPermissionsFromNext
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * <div class="alert alert-info">
         *  NOTE: should only be changed by routing module plugins
         * </div>
         *
         * A function that determines how permissions should be resolved from a route object.
         * It receives the `next` route object as the only parameter and must return a `permission function`,
         * or an Array of `permission functions`.
         *
         * A route object is an object that is sent to
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange }.
         * This configuration should be set by the same plugin that calls
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange } to guarantee compatibility.
         *
         * A `permission function` is a function that receives {@link visor.permissions.VisorPermissions.invokeParameters}
         * and returns a boolean indicating whether a route change should occur (I.E. the user has permission to access
         * the route)
         *
         * Default: a function that returns the permission function that is in the `next` route object's `restrict`
         * attribute (if any).
         *
         * Can also be changed at runtime by changing {@link visor.permissions.visorPermissions#getPermissionsFromNext}
         * @example
         *
         * <pre>
         *   // a plugin module that will allow all paths to go through
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      visorPermissionsProvider.getPermissionsFromNext = function(next){
         *        return function(){
         *          return true;
         *        }
         *      }
         *   });
         * </pre>
         */
        config.getPermissionsFromNext = function(next){
            return next.restrict? [next.restrict] : [];
        };

        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#doBeforeFirstCheck
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         *
         * A list of functions to run before the first permission check is performed (I.E. the first time a route that
         * requires permissions is navigated to).
         * These functions must return a promise.
         *
         *
         * @example
         *
         * <pre>
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      visorPermissionsProvider.doBeforeFirstCheck.push(["$http",function($http){
         *        return $http.get("/do/something");
         *      }]);
         *   });
         * </pre>
         */
        config.doBeforeFirstCheck = [];
        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#onNotAllowed
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * <div class="alert alert-info">
         *  NOTE: should only be changed by routing module plugins
         * </div>
         *
         * function to call when a permission failed to validate.
         *
         * The function is injected, with local `restrictedUrl` containing the url navigated to.
         *
         */
        config.onNotAllowed = function(){};

        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#invokeParameters
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * a list of values to send to each `permission function` to be used to determine if a route is allowed.
         *
         * Can also be changed at runtime by changing {@link visor.permissions.visorPermissions#invokeParameters}
         *
         * @example
         *
         * <pre>
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      var userInfo = {username:"theUser",isAdmin:false};
         *      visorPermissionsProvider.invokeParameters.push(userInfo);
         *   });
         * </pre>
         */
        config.invokeParameters = [];
        var finishedBeforeCheck = false;


        /**
         * @ngdoc service
         * @name visor.permissions.visorPermissions
         *
         * @description
         *
         * `visorPermissions` checks for permissions and notifies when a routes that isn't allowed is requested.
         *
         * In order to work, routing module plugins (such as the provided {@link visor.ngRoute visor.ngRoute} and
         * {@link visor.ui-router visor.ui-router} must configure `visorPermissions` and call
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange} when a route has changed.
         *
         */
        this.$get = ["$q","$injector","$location",function($q,$injector,$location){

            function handlePermission(next,permissions){
                if (!angular.isArray(permissions)) {
                  permissions = [permissions];
                }
                var isAllowed = true;
                permissions.forEach(function(permission){
                    isAllowed = isAllowed && permission.apply(null,VisorPermissions.invokeParameters);
                });
                if (isAllowed) {
									return true;
                } else {
									VisorPermissions.invokeNotAllowed(config.onNotAllowed);
									return false;
                }
            }
            var VisorPermissions = {

                /**
                 * @ngdoc function
                 * @name visor.permissions.visorPermissions#onRouteChange
                 * @methodOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * <div class="alert alert-info">
                 *  NOTE: should only be called by routing module plugins
                 * </div>
                 *
                 * A function to be called when a route changes, triggers the route permission checks.
                 *
                 * @param {*} next route object to be sent to `permission functions`.
                 *
                 * @param {function} delayChange a function to be called if visorPermissions requires that the route
                 *  change be delayed. in such case the delayChange function will be called with a promise that will be
                 *  resolved or rejected depending on whether the route is allowed.
                 *
                 * @returns {Any} true if next is allowed, false if not allowed. a string containing "delayed" if
                 *  the check is delayed.
                 */
                onRouteChange: function(next,delayChange){
                    var permissions = VisorPermissions.getPermissionsFromNext(next);
                    if (!permissions || permissions.length == 0) {
                        return true; // don't do beforeChecks without permissions
                    }
                    if (!finishedBeforeCheck) {
                        var waitForMe = $q.defer();
                        delayChange(waitForMe.promise);
                        $q.all(config.doBeforeFirstCheck.map(function(cb){
                            return $injector.invoke(cb)
                        }))
                        ['finally'](function(){
                            finishedBeforeCheck = true;
                            if (handlePermission(next,permissions)) {
                                waitForMe.resolve(true);
                            } else {
                                waitForMe.reject(false);
                            }
                        });
                        return "delayed";
                    } else {
                        return handlePermission(next,permissions)
                    }
                },
                /**
                 * @ngdoc property
                 * @name visor.permissions.visorPermissions#getPermissionsFromNext
                 * @propertyOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * runtime configuration for {@link visor.permissions.visorPermissionsProvider#getPermissionsFromNext getPermissionsFromNext}.
                 */
                getPermissionsFromNext: config.getPermissionsFromNext,
                /**
                 * @ngdoc property
                 * @name visor.permissions.visorPermissions#invokeParameters
                 * @propertyOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * runtime configuration for {@link visor.permissions.invokeParameters#getPermissionsFromNext getPermissionsFromNext}.
                 */
                invokeParameters:config.invokeParameters,
								invokeNotAllowed: function(notAllowedFn){$injector.invoke(notAllowedFn,null,{restrictedUrl:$location.url()})}
            };
            return VisorPermissions;
        }]
    }])
})();
(function(){
  /**
   * @ngdoc overview
   * @name visor.ui-router
   * @description
   *
   * # Visor.ui-router
   *
   * `Visor.ui-router` automatically add supports for permissions in ui-router, if ui-router exists.
   *
   */
  angular.module('visor.ui-router',['visor.permissions'])
		.run(['$rootScope', 'visorPermissions','$injector','$timeout','$location',function($rootScope, visorPermissions,$injector,$timeout,$location){
			var uiModuleExists = false;
			try {
				$injector.get("$state");
				uiModuleExists = true;
			}catch (e){}
			if (uiModuleExists) {
				$injector.invoke(["$state",function($state){
          // we need to check parent states for permissions as well
					visorPermissions.getPermissionsFromNext = function(next){
						var perms = [];
						while(next) {
							if (next.restrict) perms.unshift(next.restrict);
							if (next.parent) {
								next = $state.get(next.parent)
							} else if(next.name.indexOf(".") >0) {
								next = $state.get(next.name.replace(/(.*\.)?([^.]+)\.[^.]*$/,"$2"))
							} else {
								next = null;
							}
						}
						return perms;
					}
				}]);
				var $urlRouter = $injector.get("$urlRouter");
				$rootScope.$on('$stateChangeStart', function(e,next){
					var shouldContinue = visorPermissions.onRouteChange(next,function delayChange(promise){
						e.preventDefault();
						var toUrl = $location.url();
						promise.then(function(){
							if ($location.url() === toUrl) {
								$urlRouter.sync();
							} else {
								$location.url(toUrl);
								$urlRouter.sync();
							}
						})
					});
					if (!shouldContinue) {
						e.preventDefault();
					}
				});
				visorPermissions.invokeNotAllowed = function(notAllowed){
					var currentUrl = $location.url();
					//timeout is required because when using preventDefault on $stateChangeStart, the url is
					//reverted to it's original location, and no change at this time will override this.
					$timeout(function(){
						$injector.invoke(notAllowed,null,{restrictedUrl:currentUrl})
					},0);
				}
			}
		}])
})();})(window, window.angular);