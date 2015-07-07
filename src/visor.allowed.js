(function () {
    "use strict";

    /**
     * @ngdoc overview
     * @name visor.allowed
     * @description
     *
     * # Visor.Allowed
     *
     * `Visor.Allowed` contains directives that change elements based on weather a route is allowed or not.
     *
     */
    angular.module("visor.allowed", ["visor.permissions"])
    /**
     * @ngdoc directive
     * @name visor.allowed.showIfAllowed
     *
     * @description
     *
     * the `showIfAllowed` directive shows or hides the given HTML element based on whether the expression
     * provided to `showIfAllowed` resolve to a route (url or state name) that can be accessed.
     * `showIfAllowed` directive acts similar to `ngHide` directive - it adds an 'ng-hide' class to the element.
     *
     * @animations
     * addClass: `.ng-hide` - happens when the `showIfAllowed` evaluates to a route that is restricted or when the
     *  route becomes restricted
     * removeClass: `.ng-hide` - happens when the `showIfAllowed` evaluates to a route that is not restricted or
     *  when the route is no longer restricted
     *
     * @element ANY
     * @param {expression} showIfAllowed If the {@link guide/expression expression} resolves to a route that
     * is currently available then the element is shown.
     */
        .directive("showIfAllowed", ["visorPermissions", "$animate", function (visorPermissions, $animate) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var unListen = visorPermissions.notifyOnCacheClear(function(){
                        syncElement(attr.showIfAllowed);
                    })
                    function syncElement(value) {
                        // Copied from ngHideDirective (v1.3.13)
                        var allowed = visorPermissions.checkPermissionsForRoute(value);
                        $animate[allowed ? 'removeClass' : 'addClass'](element, "ng-hide", {
                            tempClasses: "ng-hide-animate"
                        });
                    }
                    attr.$observe('showIfAllowed', syncElement);
                    scope.$on('$destroy',unListen);
                }
            };
        }])
    /**
     * @ngdoc directive
     * @name visor.allowed.classIfRestricted
     *
     * @description
     *
     * the `classIfRestricted` directive adds a class to the given HTML element based on whether the expression
     * provided to `classIfRestricted` resolve to a route (url or state name) that is restricted.
     *
     * @animations
     * addClass: `.visor-restricted` - happens when the `classIfRestricted` evaluates to a route that is restricted or when the
     *  route becomes restricted
     * removeClass: `.visor-restricted` - happens when the `classIfRestricted` evaluates to a route that is not restricted or
     *  when the route is no longer restricted
     *
     * @element ANY
     * @param {expression} showIfAllowed If the {@link guide/expression expression} resolves to a route that
     * is currently available then the element is shown.
     *
     * @param {string} restrictedClass the class to add to the element. Defaults to 'visor-restricted'
     */
        .directive("classIfRestricted", ["visorPermissions", "$animate", function (visorPermissions, $animate) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    //internal mechanism - cache clear is the only way in which a permission value can change
                    var unListen = visorPermissions.notifyOnCacheClear(function(){
                        syncElement(attr.classIfRestricted);
                    })
                    function syncElement(value) {
                        var allowed = visorPermissions.checkPermissionsForRoute(value);
                        $animate[!allowed ? 'addClass' : 'removeClass'](element, attr.restrictedClass || 'visor-restricted');
                    };
                    attr.$observe('classIfRestricted', syncElement);
                    scope.$on('$destroy',unListen);
                }
            };
        }])
})();