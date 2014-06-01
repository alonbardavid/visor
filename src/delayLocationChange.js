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
				if (changeStarted && unfinishedPromises <= 0){
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