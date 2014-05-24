'use strict';

describe('visor', function() {

	describe("authentication",function(){
    var defer,authCallCounter;

    beforeEach(function(){
      defer = null;
      authCallCounter = 0;
      angular.module("test.visor.authentication",['visor'])
        .config(function(visorProvider){
          visorProvider.authenticate = function($q){
            defer = defer || $q.defer();
            authCallCounter++;
            return defer.promise;
          };
        });
      module("test.visor.authentication");
    });

		it("should send authInfo to permission checks",inject(function($rootScope,visorPermissions){
      var argumentsInNext = null;
      visorPermissions.onRouteChange({restrict:function(){argumentsInNext=arguments;}},function(){});
      defer.resolve("authValue");
      $rootScope.$apply();
      expect(Array.prototype.slice.call(argumentsInNext,0)).toEqual(["authValue"]);
		}));

		it("should call authenticate on startup by default",inject(function($rootScope,visor){
      $rootScope.$apply();
      expect(authCallCounter).toEqual(1);
    }));

		it("should not call authenticate twice if route starts before authentication done",inject(function($rootScope,visorPermissions,visor){
      $rootScope.$apply();
      expect(authCallCounter).toEqual(1);
      visorPermissions.onRouteChange({restrict:function(){return true;}},function(){});
      $rootScope.$apply();
      expect(authCallCounter).toEqual(1);
    }));

		it("should not change route until autentication on startup finishes",inject(function($rootScope,$location,visor){
      $location.url("/thingy");
      $rootScope.$apply();
      expect($location.url()).toEqual("");
      defer.resolve(null);
      $rootScope.$apply();
      expect($location.url()).toEqual("/thingy");
    }));

		it("should not call authenticate on startup if flag disabled, and call it only on first permission check",function(){
      angular.module("test.visor.authentication.nostartup",["test.visor.authentication"]).config(function(visorProvider){
        visorProvider.authenticateOnStartup = false;
        module("test.visor.authentication.nostartup");
        inject(function($rootScope,$location,visorPermissions){
          $location.url("/thingy");
          $rootScope.$apply();
          expect($location.url()).toEqual("/thingy");
          expect(authCallCounter).toEqual(0);
          visorPermissions.onRouteChange({},function(){});
          $rootScope.$apply();
          expect(authCallCounter).toEqual(0);
          visorPermissions.onRouteChange({restrict:function(){}},function(){});
          $rootScope.$apply();
          expect(authCallCounter).toEqual(1);
        });
      })
    });
	});

	describe("ngRoute",function(){

    var authenticate = null;

    beforeEach(function(){
      authenticate = null;
      angular.module("test.config.ngRoute",['ngRoute','visor'])
        .config(function($routeProvider,visorProvider,authenticatedOnly,notForAuthenticated){

          $routeProvider.when("/private_url",{
            restrict:authenticatedOnly
          })
          .when("/public",{})
          .when("/hidden",{
            restrict:notForAuthenticated
          })
          .when("/login",{})
          .when("/access_denied",{});
          visorProvider.authenticate = function($q){
            return authenticate($q);
          };
        });
    });

    it('should allow already loggedin user into authenticatedOnly route', function(){
      authenticate = function($q){
        return $q.when({username:"myName"});
      };
      module("test.config.ngRoute");
      inject(function($rootScope,$location,$route,visor) {
        $location.url("/private_url");
        $rootScope.$apply();
        expect($location.url()).toEqual("/private_url")
      });
    });

    it('should redirect anonymous users to login if accessing private route', function(){
      authenticate = function($q){
        return $q.reject("not authenticated");
      };
      module("test.config.ngRoute");
      inject(function($rootScope,$q,$location,$route,visor) {
        $location.url("/private_url");
        $rootScope.$apply();
        expect($route.current.originalPath).toEqual("/login");
        expect($location.search().next).toEqual("/private_url");
      });
    });

    it('should not redirect anonymous users to login if accessing public route', function(){
      authenticate = function($q){
        return $q.reject("not authenticated");
      };
      module("test.config.ngRoute");
      inject(function($rootScope,$location,$route,$q,visor) {
        $location.url("/public");
        $rootScope.$apply();
        expect($location.url()).toEqual("/public");
      });
    });
    it('should allow access to private states after authentication', function(){
      authenticate = function($q){
        return $q.reject("not authenticated");
      };
      module("test.config.ngRoute");
      inject(function($rootScope,$route,$q,visor,$location) {
        $location.url("/private_url");
        $rootScope.$apply();
        expect($route.current.originalPath).toEqual("/login");
        visor.setAuthenticated({username:"some_name"});
        $rootScope.$apply();
        //should redirect back to original route automatically
        expect($location.url()).toEqual("/private_url");
      });
    });

    it('should not allow access if user is not authorized',function(){
      authenticate = function($q){
        return $q.when(true);
      };
      module("test.config.ngRoute");
      inject(function($rootScope,$route,$q,visor,$location) {
        $location.url("/hidden");
        $rootScope.$apply();
        expect($route.current.originalPath).toEqual("/access_denied");
        expect($location.url()).toEqual("/access_denied");
      });
    });
	});

	describe('ui-router',function(){

		var authenticate = null;

		beforeEach(function(){
			authenticate = null;
			angular.module("test.config",['ui.router','visor'])
				.config(function($stateProvider,visorProvider,authenticatedOnly,notForAuthenticated){

					$stateProvider.state("private",{
						url:"/private_url",
						restrict:authenticatedOnly
					})
						.state("public",{
							url:"/public"
						})
						.state("hidden",{
							url:"/hidden",
							restrict:notForAuthenticated
						})
						.state("private.nestedpublic",{
							url:"/public"
						})
						.state("public.nestedprivate",{
							url:"/public/private",
							restrict:authenticatedOnly
						})
						.state("login",{
							url:"/login"
						})
						.state("access_denied",{
							url:"/access_denied"
						});
					visorProvider.authenticate = function($q){
						return authenticate($q);
					};
				});
		});

		it('should allow already loggedin user into authenticatedOnly route', function(){
			authenticate = function($q){
				return $q.when({username:"myName"});
			};
			module("test.config");
			inject(function($rootScope,$location,$state,$q,visor) {
				$location.url("/private_url");
				$rootScope.$apply();
				expect($location.url()).toEqual("/private_url")
			});
		});

		it('should redirect anonymous users to login if accessing private route', function(){
			authenticate = function($q){
				return $q.reject("not authenticated");
			};
			module("test.config");
			inject(function($rootScope,$state,$q,$location,visor,$timeout) {
				$location.url("/private_url");
				$rootScope.$apply();
				$timeout.flush();
				expect($state.current.name).toEqual("login");
				expect($location.search().next).toEqual("/private_url");
			});
		});

		it('should not redirect anonymous users to login if accessing public route', function(){
			authenticate = function($q){
				return $q.reject("not authenticated");
			};
			module("test.config");
			inject(function($rootScope,$location,$state,$q,visor) {
				$location.url("/public");
				$rootScope.$apply();
				expect($location.url()).toEqual("/public");
			});
		});
		it('should allow access to private states after authentication', function(){
			authenticate = function($q){
				return $q.reject("not authenticated");
			};
			module("test.config");
			inject(function($rootScope,$state,$q,visor,$location,$timeout) {
				$location.url("/private_url");
				$rootScope.$apply();
				$timeout.flush();
				expect($state.current.name).toEqual("login");
				visor.setAuthenticated({username:"some_name"});
				$rootScope.$apply();
				$timeout.flush();
				//should redirect back to original route automatically
				expect($location.url()).toEqual("/private_url");
			});
		});

		it('should not allow access if user is not authorized',function(){
			authenticate = function($q){
				return $q.when(true);
			};
			module("test.config");
			inject(function($rootScope,$state,$q,visor,$location,$timeout) {
				$location.url("/hidden");
				$rootScope.$apply();
				$timeout.flush();
				expect($state.current.name).toEqual("access_denied");
				expect($location.url()).toEqual("/access_denied");
			});
		});
	});
});