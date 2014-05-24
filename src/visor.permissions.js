(function(){
    angular.module("visor.permissions",[])
    .provider("visorPermissions",[function(){
        var config = this;
        config.getPermissionsFromNext = function(next){
            return next.restrict? [next.restrict] : [];
        };
        config.doBeforeFirstCheck = [];
        config.onNotAllowed = function(){};
        config.invokeParameters = [];
        var finishedBeforeCheck = false;
        this.$get = ["$q","$injector","$location",function($q,$injector,$location){

            function handlePermission(next,permissions){
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
                onRouteChange:function(next,delayChange){
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
                        .finally(function(){
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
                getPermissionsFromNext: config.getPermissionsFromNext,
                invokeParameters:config.invokeParameters,
								invokeNotAllowed: function(notAllowedFn){$injector.invoke(notAllowedFn,null,{restrictedUrl:$location.url()})}
            };
            return VisorPermissions;
        }]
    }])
})();