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
				var toUrl = null;
				$rootScope.$on('$stateChangeStart', function(e,next){
					toUrl = $location.url();
					var shouldContinue = visorPermissions.onRouteChange(next,function delayChange(promise){
						promise.then(function(){
							if ($location.url() === toUrl) {
								$urlRouter.sync();
							} else {
								$location.url(toUrl);
								$urlRouter.sync();
							}
						})
					});
					if (!shouldContinue || shouldContinue === "delayed") {
						e.preventDefault();
					}
				});
				visorPermissions.invokeNotAllowed = function(notAllowed){

					//timeout is required because when using preventDefault on $stateChangeStart, the url is
					//reverted to it's original location, and no change at this time will override this.
					$timeout(function(){
						$injector.invoke(notAllowed,null,{restrictedUrl:toUrl})
					},0);
				}
			}
		}])
})();