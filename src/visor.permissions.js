(function(){
  /**
   * @ngdoc overview
   * @name visor.permissions
   * @description
   *
   * # Visor.Permissions
   *
   * `Visor.Permissions` provides support for handling permissions and restricting access to routes based
   * on those restrictions.
   *
   *
   * See {@link visor.permissions.visorPermissions `visorPermissions service`} for usage.
   */

    angular.module("visor.permissions",[])

    /**
     * @ngdoc service
     * @name visor.permissions.visorPermissionsProvider
     *
     * @description
     *
     * `visorPermissionsProvider` provides a pluggable configuration to adjust how `visor.permissions`
     *  will handle route changes.
     *
     * Some of the api in the configuration is for use in plugins to allow support for multiple routing modules.\
     * Others are for use with clients ( such as {@link visor.visor `visor`} ).
     *
     * For examples of using the various plugin methods see the {@link visor.ngRoute visor.ngRoute}
     * and {@link visor.ui-router visor.ui-router} source codes.
     *
     */
    .provider("visorPermissions",[function(){
        var config = this;
        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#getPermissionsFromNext
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * <div class="alert alert-info">
         *  NOTE: should only be changed by routing module plugins
         * </div>
         *
         * A function that determines how permissions should be resolved from a route object.
         * It receives the `next` route object as the only parameter and must return a `permission function`,
         * or an Array of `permission functions`.
         *
         * A route object is an object that is sent to
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange }.
         * This configuration should be set by the same plugin that calls
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange } to guarantee compatibility.
         *
         * A `permission function` is a function that receives {@link visor.permissions.VisorPermissions.invokeParameters}
         * and returns a boolean indicating whether a route change should occur (I.E. the user has permission to access
         * the route)
         *
         * Default: a function that returns the permission function that is in the `next` route object's `restrict`
         * attribute (if any).
         *
         * Can also be changed at runtime by changing {@link visor.permissions.visorPermissions#getPermissionsFromNext}
         * @example
         *
         * <pre>
         *   // a plugin module that will allow all paths to go through
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      visorPermissionsProvider.getPermissionsFromNext = function(next){
         *        return function(){
         *          return true;
         *        }
         *      }
         *   });
         * </pre>
         */
        config.getPermissionsFromNext = function(next){
            return next.restrict? [next.restrict] : [];
        };

        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#doBeforeFirstCheck
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         *
         * A list of functions to run before the first permission check is performed (I.E. the first time a route that
         * requires permissions is navigated to).
         * These functions must return a promise.
         *
         *
         * @example
         *
         * <pre>
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      visorPermissionsProvider.doBeforeFirstCheck.push(["$http",function($http){
         *        return $http.get("/do/something");
         *      }]);
         *   });
         * </pre>
         */
        config.doBeforeFirstCheck = [];
        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#onNotAllowed
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * <div class="alert alert-info">
         *  NOTE: should only be changed by routing module plugins
         * </div>
         *
         * function to call when a permission failed to validate.
         *
         * The function is injected, with local `restrictedUrl` containing the url navigated to.
         *
         */
        config.onNotAllowed = function(){};

        /**
         * @ngdoc property
         * @name visor.permissions.visorPermissionsProvider#invokeParameters
         * @propertyOf visor.permissions.visorPermissionsProvider
         *
         * @description
         *
         * a list of values to send to each `permission function` to be used to determine if a route is allowed.
         *
         * Can also be changed at runtime by changing {@link visor.permissions.visorPermissions#invokeParameters}
         *
         * @example
         *
         * <pre>
         *   angular.moudle("myModule",["visor.permissions"])
         *   .config(function(visorPermissionsProvider){
         *      var userInfo = {username:"theUser",isAdmin:false};
         *      visorPermissionsProvider.invokeParameters.push(userInfo);
         *   });
         * </pre>
         */
        config.invokeParameters = [];
        var finishedBeforeCheck = false;


        /**
         * @ngdoc service
         * @name visor.permissions.visorPermissions
         *
         * @description
         *
         * `visorPermissions` checks for permissions and notifies when a routes that isn't allowed is requested.
         *
         * In order to work, routing module plugins (such as the provided {@link visor.ngRoute visor.ngRoute} and
         * {@link visor.ui-router visor.ui-router} must configure `visorPermissions` and call
         * {@link visor.permissions.visorPermissions#onRouteChange onRouteChange} when a route has changed.
         *
         */
        this.$get = ["$q","$injector","$location",function($q,$injector,$location){

            function handlePermission(next,permissions){
                if (!angular.isArray(permissions)) {
                  permissions = [permissions];
                }
                var isAllowed = true;
                permissions.forEach(function(permission){
                    isAllowed = isAllowed && permission.apply(null,VisorPermissions.invokeParameters);
                });
                if (isAllowed) {
									return true;
                } else {
									VisorPermissions.invokeNotAllowed(config.onNotAllowed);
									return false;
                }
            }
            var VisorPermissions = {

                /**
                 * @ngdoc function
                 * @name visor.permissions.visorPermissions#onRouteChange
                 * @methodOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * <div class="alert alert-info">
                 *  NOTE: should only be called by routing module plugins
                 * </div>
                 *
                 * A function to be called when a route changes, triggers the route permission checks.
                 *
                 * @param {*} next route object to be sent to `permission functions`.
                 *
                 * @param {function} delayChange a function to be called if visorPermissions requires that the route
                 *  change be delayed. in such case the delayChange function will be called with a promise that will be
                 *  resolved or rejected depending on whether the route is allowed.
                 *
                 * @returns {Any} true if next is allowed, false if not allowed. a string containing "delayed" if
                 *  the check is delayed.
                 */
                onRouteChange: function(next,delayChange){
                    var permissions = VisorPermissions.getPermissionsFromNext(next);
                    if (!permissions || permissions.length == 0) {
                        return true; // don't do beforeChecks without permissions
                    }
                    if (!finishedBeforeCheck) {
                        var waitForMe = $q.defer();
                        delayChange(waitForMe.promise);
                        $q.all(config.doBeforeFirstCheck.map(function(cb){
                            return $injector.invoke(cb)
                        }))
                        ['finally'](function(){
                            finishedBeforeCheck = true;
                            if (handlePermission(next,permissions)) {
                                waitForMe.resolve(true);
                            } else {
                                waitForMe.reject(false);
                            }
                        });
                        return "delayed";
                    } else {
                        return handlePermission(next,permissions)
                    }
                },
                /**
                 * @ngdoc property
                 * @name visor.permissions.visorPermissions#getPermissionsFromNext
                 * @propertyOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * runtime configuration for {@link visor.permissions.visorPermissionsProvider#getPermissionsFromNext getPermissionsFromNext}.
                 */
                getPermissionsFromNext: config.getPermissionsFromNext,
                /**
                 * @ngdoc property
                 * @name visor.permissions.visorPermissions#invokeParameters
                 * @propertyOf visor.permissions.visorPermissions
                 *
                 * @description
                 *
                 * runtime configuration for {@link visor.permissions.invokeParameters#getPermissionsFromNext getPermissionsFromNext}.
                 */
                invokeParameters:config.invokeParameters,
								invokeNotAllowed: function(notAllowedFn){$injector.invoke(notAllowedFn,null,{restrictedUrl:$location.url()})}
            };
            return VisorPermissions;
        }]
    }])
})();