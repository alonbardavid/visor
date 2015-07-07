(function () {
    angular.module("visorSampleApp", ["visor", "ui.router", "ngCookies"])
        .config(function (visorProvider, $stateProvider, $urlRouterProvider) {
            visorProvider.authenticate = function ($cookieStore, $q, $rootScope) {
                var user = $cookieStore.get("user");
                if (user) {
                    $rootScope.user = user;
                    return $q.when(user);
                } else {
                    return $q.reject(null);
                }
            };
            visorProvider.doOnNotAuthorized = function ($state, restrictedUrl) {
                $state.go("access_denied", {prevUrl: restrictedUrl});
            }
            $stateProvider.state("home", {
                templateUrl: "app/home.html",
                url: "/home"
            })
                .state("login", {
                    templateUrl: "app/login.html",
                    url: "/login",
                    controller: function ($scope, visor, $rootScope, $cookieStore) {
                        $scope.login = function () {
                            var user = {is_admin: $scope.is_admin};
                            $cookieStore.put("user", user);
                            $rootScope.user = user;
                            visor.setAuthenticated(user);
                        }
                    },
                    restrict: function (user) {
                        return user === undefined;
                    }
                })
                .state("private", {
                    templateUrl: "app/private.html",
                    url: "/private",
                    restrict: function (user) {
                        return !!user
                    }
                })
                .state("access_denied", {
                    templateUrl: "app/access_denied.html",
                    controller: function ($scope, $stateParams) {
                        $scope.prevUrl = $stateParams.prevUrl;
                    },
                    url: "/access_denied?prevUrl"
                })
                .state("admin", {
                    templateUrl: "app/admin.html",
                    url: "/admin",
                    restrict: function (user) {
                        return user && user.is_admin;
                    }
                });
            $urlRouterProvider.otherwise("/home");
        })
        .controller("MainCtrl", function ($scope, $cookieStore, $state, $rootScope, visor) {
            $scope.logout = function () {
                $cookieStore.remove("user");
                $rootScope.user = undefined;
                visor.setUnauthenticated();
                $state.go("home");
            }
        }).run(function ($state, $rootScope) {
            $rootScope.$state = $state;
        })
})();