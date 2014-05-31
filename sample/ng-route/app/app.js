(function(){
	angular.module("visorSampleApp",["visor","ngRoute","ngCookies"])
		.config(function(visorProvider,$routeProvider){
			visorProvider.authenticate = function($cookies,$q,$rootScope){
				if ($cookies.user) {
					$rootScope.user = $cookies.user
					return $q.when($cookies.user);
				} else {
					return $q.reject(null);
				}
			};
			visorProvider.doOnNotAuthorized = function($location,restrictedUrl){
				$location.url("/access_denied?prevUrl=" + encodeURIComponent(restrictedUrl));
			}
			$routeProvider.when("/home",{
				templateUrl:"app/home.html"
			})
			.when("/login",{
				templateUrl:"app/login.html",
				controller:function($scope,visor,$rootScope,$cookies){
					$scope.login = function(){
						$cookies.user = {is_admin:$scope.is_admin};
						$rootScope.user = $cookies.user;
						visor.setAuthenticated($cookies.user);
					}
				},
				restrict:function(user){return user === undefined;}
			})
			.when("/private",{
				templateUrl:"app/private.html",
				restrict:function(user){return !!user}
			})
			.when("/access_denied",{
				templateUrl:"app/access_denied.html",
				controller:function($scope,$routeParams){
					$scope.prevUrl = $routeParams.prevUrl;
				}
			})
			.when("/admin",{
				templateUrl:"app/admin.html",
				restrict:function(user){return user && user.is_admin;}
			})
			.otherwise({redirectTo:"/home"});
		})
		.controller("MainCtrl",function($scope,$cookies,$rootScope,$route,visor,$location){
			$scope.$route = $route;
			$scope.logout = function(){
				delete $cookies.user;
				$rootScope.user = undefined;
				visor.setUnauthenticated();
				$location.url("/home");
			}
		})
})();