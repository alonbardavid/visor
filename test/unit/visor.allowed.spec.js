describe("visor.allowed", function () {
    var mockedRouteResult = false;
    var routes = {
        'first': {
            restrict: function () {
                return true
            }
        },
        'deny': {
            restrict: function () {
                return false
            }
        },
        'mocked': {
            restrict: function () {
                return mockedRouteResult
            }
        }
    }
    describe('show-if-allowed', function () {
        beforeEach(function () {
            angular.module("test.show-if-allowed-directive", ["visor.allowed"])
                .config(function (visorPermissionsProvider) {
                    visorPermissionsProvider.getRoute = function (routeId) {
                        return routes[routeId]
                    }
                });
            mockedRouteResult = false;
            module("test.show-if-allowed-directive")
        });
        it('should hide element if route is not allowed', inject(function ($rootScope, $compile) {
            var scope = $rootScope.$new();
            scope.value = 'deny';
            var dirRoot = $compile("<div show-if-allowed='{{value}}'></div>")(scope);
            $rootScope.$apply();
            expect(dirRoot[0].className).toMatch(/ng-hide/);
            scope.value = 'first';
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/ng-hide/)
        }));
        it('should show element if route becomes available', inject(function ($rootScope, $compile, visorPermissions) {
            var dirRoot = $compile("<div show-if-allowed='mocked'></div>")($rootScope);
            $rootScope.$apply();
            expect(dirRoot[0].className).toMatch(/ng-hide/);
            mockedRouteResult = true;
            visorPermissions.clearPermissionCache();
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/ng-hide/)
        }));
    })
    describe('class-if-restricted', function () {
        beforeEach(function () {
            angular.module("test.class-if-restricted-directive", ["visor.allowed"])
                .config(function (visorPermissionsProvider) {
                    visorPermissionsProvider.getRoute = function (routeId) {
                        return routes[routeId]
                    }
                });
            mockedRouteResult = false;
            module("test.class-if-restricted-directive")
        });
        it('should add visor-restricted class to element if route is restricted', inject(function ($rootScope, $compile) {
            var scope = $rootScope.$new();
            scope.value = 'deny';
            var dirRoot = $compile("<div class-if-restricted='{{value}}'></div>")(scope);
            $rootScope.$apply();
            expect(dirRoot[0].className).toMatch(/visor-restricted/);
            scope.value = 'first';
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/visor-restricted/)
        }));
        it('should add custom class to element if route is restricted', inject(function ($rootScope, $compile) {
            var scope = $rootScope.$new();
            scope.value = 'deny';
            var dirRoot = $compile("<div class-if-restricted='{{value}}' restricted-class='zzz'></div>")(scope);
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/visor-restricted/);
            expect(dirRoot[0].className).toMatch(/zzz/);
            scope.value = 'first';
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/zzz/)
            expect(dirRoot[0].className).not.toMatch(/visor-restricted/);
        }));
        it('should add custom class to element if route becomes available', inject(function ($rootScope, $compile, visorPermissions) {
            var dirRoot = $compile("<div class-if-restricted='mocked'></div>")($rootScope);
            $rootScope.$apply();
            expect(dirRoot[0].className).toMatch(/visor-restricted/);
            mockedRouteResult = true;
            visorPermissions.clearPermissionCache();
            $rootScope.$apply();
            expect(dirRoot[0].className).not.toMatch(/visor-restricted/)
        }));

    })
})