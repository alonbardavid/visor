

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


      this.$get = ["$injector","$q","$rootScope","$location","visorPermissions",function($injector,$q,$rootScope,$location,visorPermissions){
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
							},
              config:config
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
            Visor.doOnNotAllowed(restrictedUrl);
        }]
  }])
})();