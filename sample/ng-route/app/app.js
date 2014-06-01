(function(){
	angular.module("visorSampleApp",["visor","ngRoute","ngCookies"])
		.config(function(visorProvider,$routeProvider){
			visorProvider.authenticate = function($cookieStore,$q,$rootScope){
        var user = $cookieStore.get("user");
				if (user) {
					$rootScope.user = user;
					return $q.when(user);
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
				controller:function($scope,visor,$rootScope,$cookieStore){
					$scope.login = function(){
            var user = {is_admin:$scope.is_admin};
            $cookieStore.put("user",user);
						$rootScope.user = user;
						visor.setAuthenticated(user);
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
		.controller("MainCtrl",function($scope,$cookieStore,$rootScope,$route,visor,$location){
			$scope.$route = $route;
			$scope.logout = function(){
        $cookieStore.remove("user");
				$rootScope.user = undefined;
				visor.setUnauthenticated();
				$location.url("/home");
			}
		})
})();