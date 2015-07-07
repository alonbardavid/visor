describe('visor.ngRoute', function () {
    describe('route change', function () {
        var defer = null;
        angular.module('test.routes', ['visor.ngRoute', 'ngRoute']).config(function ($routeProvider, visorPermissionsProvider) {
            defer = null;
            $routeProvider.when('/first', {
                restrict: function () {
                    return true;
                }
            }).when('/deny', {
                restrict: function () {
                    return false;
                }
            });
            visorPermissionsProvider.doBeforeFirstCheck.push(function ($q) {
                defer = $q.defer();
                return defer.promise;
            });
        });
        beforeEach(module('test.routes'));

        it('should wait to change route until delay called', inject(function ($location, $route, $rootScope) {
            var successCounter = 0;
            $rootScope.$on('$routeChangeSuccess', function () {
                successCounter++;
            });
            $location.url('/first');
            $rootScope.$apply();
            expect(successCounter).toEqual(0);
            defer.resolve('');
            $rootScope.$apply();
            expect(successCounter).toEqual(1);
            expect($location.url()).toEqual('/first');
            expect($route.current.originalPath).toEqual('/first');
        }));

        it('should stop route change when permission rejected', inject(function ($location, $route, $rootScope) {
            var errorCounter = 0;
            $rootScope.$on('$routeChangeError', function () {
                errorCounter++;
            });
            expect(errorCounter).toEqual(0);
            $location.url('/deny');
            $rootScope.$apply();
            defer.resolve(false);
            $rootScope.$apply();
            expect(errorCounter).toEqual(1);
        }));
    });

    it('should not change anything if ng-route is not depended on', function () {
        module('visor.permissions', 'visor.ngRoute');
        inject(function ($location, $rootScope, visorPermissions) {
            $location.url('/something');
            $rootScope.$apply();
            visorPermissions.onRouteChange({
                restrict: function () {
                    return false;
                }
            }, function () {
            });
            $rootScope.$apply();
            //nothing crushed!
        })
    });
});
