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