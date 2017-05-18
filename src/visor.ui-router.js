(function () {
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
    angular.module('visor.ui-router', ['visor.permissions'])
        .run(['$rootScope', 'visorPermissions', '$injector', '$timeout', function ($rootScope, visorPermissions, $injector, $timeout) {
            var uiModuleExists = false;
            try {
                $injector.get('$state');
                uiModuleExists = true;
            } catch (e) {
            }
            if (uiModuleExists) {
                $injector.invoke(['$transitions', '$state', function ($transitions, $state) {
                    // we need to check parent states for permissions as well
                    visorPermissions.getPermissionsFromNext = function (next) {
                        var perms = [];
                        while (next) {
                            if (next.restrict) perms.unshift(next.restrict);
                            if (next.parent) {
                                next = $state.get(next.parent)
                            } else if (next.name.indexOf('.') > 0) {
                                var chain = next.name.split('.');
                                chain.pop(); //remove the leftmost
                                var parent = chain.join('.');
                                next = $state.get(parent);
                            } else {
                                next = null;
                            }
                        }
                        return perms;
                    };
                    var toUrl = null;
                    var bypass = false;
                    $transitions.onBefore({}, function (trans) {
                        if (bypass) {
                            bypass = false;
                            return;
                        }
                        var toState = trans.to();
                        var toParams = trans.params('to');
                        toUrl = $state.href(toState, toParams).replace(/^#/, '');
                        var shouldContinue = visorPermissions.onRouteChange(toState, function delayChange(promise) {
                            promise.then(function () {
                                bypass = true;
                                $state.go(toState, toParams);
                            })
                        });
                        if (!shouldContinue || shouldContinue === 'delayed') {
                            return false;
                        }
                    });
                    visorPermissions.invokeNotAllowed = function (notAllowed) {

                        //timeout is required because when using preventDefault on $stateChangeStart, the url is
                        //reverted to it's original location, and no change at this time will override this.
                        $timeout(function () {
                            $injector.invoke(notAllowed, null, {restrictedUrl: toUrl})
                        }, 0);
                    };
                    visorPermissions.getRoute = function (routeId) {
                        return $state.get(routeId);
                    };
                }]);
            }
        }])
})();
