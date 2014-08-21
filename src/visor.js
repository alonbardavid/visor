

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