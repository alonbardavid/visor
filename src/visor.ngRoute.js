(function () {

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
    angular.module('visor.ngRoute', ['visor.permissions'])
        .run(['$rootScope', 'visorPermissions', '$injector', function ($rootScope, visorPermissions, $injector) {
            var ngRouteModuleExists = false;
            var $route = null;
            try {
                $route = $injector.get("$route");
                ngRouteModuleExists = true;
            } catch (e) {
            }
            if (ngRouteModuleExists) {
                visorPermissions.getRoute = function (routeId) {
                    for (var path in $route.routes) {
                        var route = $route.routes[path];
                        if (route.regexp.exec(routeId)) {
                            return route;
                        }
                    }
                    return null;
                };
                $rootScope.$on('$routeChangeStart', function (e, next) {
                    next.resolve = next.resolve || {};
                    visorPermissions.onRouteChange(next, function delayChange(promise) {
                        next.resolve._visorDelay = function () {
                            return promise;
                        };
                    });
                });
            }
        }])
})();