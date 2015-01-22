(function(){
  angular.module("visor.allowed",["visor.permissions"])
    .directive("showIfAllowed"["visorPermissions","$animate",function(visorPermissions,animate){
      return {
        restrict: 'A',
        multiElement: true,
        link: function(scope, element, attr) {
          scope.$watch(attr.showIfAllowed, function ngShowWatchAction(value) {
            // we're adding a temporary, animation-specific class for ng-hide since this way
            // we can control when the element is actually displayed on screen without having
            // to have a global/greedy CSS selector that breaks when other animations are run.
            // Read: https://github.com/angular/angular.js/issues/9103#issuecomment-58335845
            var allowed = visorPermissions.checkPermissionsForRoute(value);
            $animate[allowed ? 'removeClass' : 'addClass'](element, "ng-hide", {
              tempClasses: "ng-hide-animate"
            });
          });
        }
      };
    }])
})();