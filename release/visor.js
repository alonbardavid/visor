/**visor
* Angular authentication and authorization library
* @version v0.0.1
* @link  https://github.com/illniyar/visor
* @license MIT License, http://www.opensource.org/licenses/MIT
*/
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
 module.exports = 'visor';
}

(function (window, angular, undefined) {
(function(){
	"use strict";

	angular.module("delayLocationChange",[])
		.service("delayLocationChange",["$rootScope","$q","$timeout","$location","$injector",
			function($rootScope,$q,$timeout,$location,$injector){
			var unfinishedPromises = 0;
			var waitingFunctions = [];
			var changeStarted = false,_toUrl,_fromUrl,nextUrl;
			function checkPromises(){
				unfinishedPromises--;
				if (unfinishedPromises <= 0){
					reloadChange();
				}
			}
			function reloadChange(){
				if ($location.absUrl() === _toUrl) {
					$rootScope.$broadcast("$locationChangeSuccess",_toUrl,_fromUrl);
				} else {
					$location.url(nextUrl);
				}
			}
			var service = function(arg){
				if (arg.then) {
					addPromise(arg);
				} else {
					if (changeStarted) {
						addPromise($injector.invoke(fn));
					} else {
						waitingFunctions.push(arg);
					}
				}
			};
			function addPromise(promise){
				unfinishedPromises++;
				promise.finally(checkPromises);
			}
			var unlisten = $rootScope.$on("$locationChangeStart",function(e,toUrl,fromUrl){
				changeStarted = true;
				nextUrl = $location.url();
				unlisten();
				e.preventDefault();
				waitingFunctions.forEach(function(fn){addPromise($injector.invoke(fn))});
				if(unfinishedPromises === 0 && !_toUrl){ //firstCall and no promises
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
   * @ngdoc module
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
  .constant("authenticatedOnly",function(authData){
      return !!authData;
  })
  .constant("notForAuthenticated",function(authData){
      return authData === undefined;
  })

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
      config.authenticateOnStartup = true;
      config.loginRoute = "/login";
      config.homeRoute = "/";
      config.notAuthorizedRoute = "/access_denied";
      config.shouldAddNext = true;

      //authentication methods
      config.authenticate = function(){
          throw new Error("visorProvider.authenticate must be defined to use visor");
      };
      config.doOnNotAuthenticated = ["$location","restrictedUrl",function($location,restrictedUrl){
          $location.url(addNextToUrl(config.loginRoute,$location,restrictedUrl))
      }];
      config.doAfterManualAuthentication = ["$location",function($location){
          $location.url($location.search().next || config.homeRoute);
      }];
      config.doOnNotAuthorized =["$location",function($location){
          $location.url(config.notAuthorizedRoute)
      }];


      this.$get = ["$injector","$q","$rootScope","$location","visorPermissions","delayLocationChange",function($injector,$q,$rootScope,$location,visorPermissions,delayLocationChange){
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
              authenticate:function(retry){
                  if (_authenticationPromise && !retry) {
                      return  _authenticationPromise;
                  }
                  var deferred = $q.defer();
                  _authenticationPromise = deferred.promise;
                  $injector.invoke(config.authenticate)
                      .then(onAuthenticationSuccess,onAuthenticationFailed)
                      .finally(function(){
                          deferred.resolve(Visor.authData)
                      });
                  return deferred.promise;
              },
              setAuthenticated: function(authData){
                  onAuthenticationSuccess(authData);
                  _authenticationPromise = $q.when(authData);
                  $injector.invoke(config.doAfterManualAuthentication,null,{authData:authData});
              },
              isAuthenticated: function(){
                  return !!Visor.authData;
              },
              doOnNotAllowed: function(restrictedUrl){
                  if (Visor.isAuthenticated()) {
                      $injector.invoke(config.doOnNotAuthorized,null,{restrictedUrl:restrictedUrl});
                  } else {
                      $injector.invoke(config.doOnNotAuthenticated,null,{restrictedUrl:restrictedUrl});
                  }
							},
							setUnauthenticated: function(){
								onAuthenticationFailed()
							}
          };
          if (config.authenticateOnStartup) {
            delayLocationChange(function(){ return Visor.authenticate()});
          }
          return Visor;
      }]
  }])
  .config(["visorPermissionsProvider",function(visorPermissionsProvider){
        visorPermissionsProvider.doBeforeFirstCheck.push(["visor",function(Visor){
            return Visor.authenticate();
        }]);
        visorPermissionsProvider.onNotAllowed = ["visor","restrictedUrl",function(Visor,restrictedUrl){
            Visor.doOnNotAllowed(restrictedUrl);
        }]
  }])
})();
(function(){
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
    angular.module("visor.permissions",[])
    .provider("visorPermissions",[function(){
        var config = this;
        config.getPermissionsFromNext = function(next){
            return next.restrict? [next.restrict] : [];
        };
        config.doBeforeFirstCheck = [];
        config.onNotAllowed = function(){};
        config.invokeParameters = [];
        var finishedBeforeCheck = false;
        this.$get = ["$q","$injector","$location",function($q,$injector,$location){

            function handlePermission(next,permissions){
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
                onRouteChange:function(next,delayChange){
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
                        .finally(function(){
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
                getPermissionsFromNext: config.getPermissionsFromNext,
                invokeParameters:config.invokeParameters,
								invokeNotAllowed: function(notAllowedFn){$injector.invoke(notAllowedFn,null,{restrictedUrl:$location.url()})}
            };
            return VisorPermissions;
        }]
    }])
})();
(function(){
	angular.module('visor.ui-router',['visor.permissions'])
		.run(['$rootScope', 'visorPermissions','$injector','$timeout','$location',function($rootScope, visorPermissions,$injector,$timeout,$location){
			var uiModuleExists = false;
			try {
				$injector.get("$state");
				uiModuleExists = true;
			}catch (e){}
			if (uiModuleExists) {
				$injector.invoke(["$state",function($state){
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