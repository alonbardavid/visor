var VOID = function(){return true};
var NEXT = {restrict:VOID};

describe("visor.permissions",function(){
    describe("doBeforeFirstCheck",function(){
        var doBeforeFunctions = [];
        angular.module("config.do-before",["visor.permissions"]).config(function(visorPermissionsProvider){
            visorPermissionsProvider.doBeforeFirstCheck =
                visorPermissionsProvider.doBeforeFirstCheck.concat(doBeforeFunctions)
        })
        beforeEach(function(){doBeforeFunctions = [];});

        it("should call doBeforeFirstCheck on first change",function(){
           var called = false;
            doBeforeFunctions.push(function($q){called = true;return $q.when("");});

            module("config.do-before");
            inject(function($rootScope,visorPermissions){
                $rootScope.$apply();
                expect(called).toEqual(false);
                visorPermissions.onRouteChange(NEXT,VOID)
                $rootScope.$apply();
                expect(called).toEqual(true);
            });
        });
        it("should call multiple doBeforeFirstCheck",function(){
            var calledOne = false, calledTwo = false;
            doBeforeFunctions.push(function($q){calledOne = true;return $q.when("");});
            doBeforeFunctions.push(function($q){calledTwo = true;return $q.when("");});
            module("config.do-before");
            inject(function($rootScope,visorPermissions){
                $rootScope.$apply();
                expect(calledOne).toEqual(false);
                expect(calledTwo).toEqual(false);
                visorPermissions.onRouteChange(NEXT,VOID);
                $rootScope.$apply();
                expect(calledOne).toEqual(true);
                expect(calledTwo).toEqual(true);
            });
        });
        it("should wait until doBeforeFirstCheck finishes before checking permissions",function(){
            var defer = null, called = false;
            doBeforeFunctions.push(function($q){defer = $q.defer(); return defer.promise;});

            module("config.do-before");
            inject(function($rootScope,visorPermissions,$q){
                var next = {restrict:function(){called = true;return true;}};
                visorPermissions.onRouteChange(next,VOID);
                $rootScope.$apply();
                expect(called).toEqual(false);
                defer.resolve(true);
                $rootScope.$apply();
                expect(called).toEqual(true);
            });
        })
        it("should not call doBeforeFirstCheck again",function(){
            var calledCount = 0;
            doBeforeFunctions.push(function($q){calledCount++;return $q.when("");});

            module("config.do-before");
            inject(function($rootScope,visorPermissions){
                visorPermissions.onRouteChange(NEXT,VOID)
                $rootScope.$apply();
                expect(calledCount).toEqual(1);
                visorPermissions.onRouteChange(NEXT,VOID)
                $rootScope.$apply();
                expect(calledCount).toEqual(1);
            });
        });
        it("should allow having no doBeforeFirstCheck",function(){
            var called = false;

            module("visor.permissions");
            inject(function($rootScope,visorPermissions){
                var next = {restrict:function(){called = true;return true;}};
                visorPermissions.onRouteChange(next,VOID);
                $rootScope.$apply();
                expect(called).toEqual(true);
            });
        });

        it("should call doBeforeFirstCheck only when first accessing route with permission",function(){
            var called = false;
            module("visor.permissions");
            inject(function($rootScope,visorPermissions){
                var next = {restrict:function(){called = true;return true;}};
                visorPermissions.onRouteChange({},VOID);
                $rootScope.$apply();
                expect(called).toEqual(false);
                visorPermissions.onRouteChange(next,VOID);
                $rootScope.$apply();
                expect(called).toEqual(true);
            });
        });
    });

    describe("allowed/notallowed",function(){
        beforeEach(function(){
					angular.module("test.allowed-notallowed",["visor.permissions"])
						.config(function(visorPermissionsProvider){
							visorPermissionsProvider.getPermissionsFromNext = function(next){
								return next.permissions || [next.permission];
							}
						});
					module("test.allowed-notallowed")
				});

        it("should allow access if permission returns true",inject(function($rootScope,visorPermissions){
            var success =false;
            var next = {permission:function(){return true;}};
            visorPermissions.onRouteChange(next,function(promise){promise.then(function(){success=true;})});
            $rootScope.$apply();
            expect(success).toEqual(true);
        }));
        it("should deny access if permission returns false",inject(function($rootScope,visorPermissions){
            var rejected =false;
            var next = {permission:function(){return false;}};
            visorPermissions.onRouteChange(next,function(promise){promise.catch(function(){rejected=true;})});
            $rootScope.$apply();
            expect(rejected).toEqual(true);
        }));

			  it("should deny access if first permission is false and second true",inject(function($rootScope,visorPermissions){
					var rejected =false;
					var next = {permissions:[function(){return false;},function(){return true;}]};
					visorPermissions.onRouteChange(next,function(promise){promise.catch(function(){rejected=true;})});
					$rootScope.$apply();
					expect(rejected).toEqual(true);
				}));
			  it("should deny access if first permission is true and second false",inject(function($rootScope,visorPermissions){
					var rejected =false;
					var next = {permissions:[function(){return true;},function(){return false;}]};
					visorPermissions.onRouteChange(next,function(promise){promise.catch(function(){rejected=true;})});
					$rootScope.$apply();
					expect(rejected).toEqual(true);
				}));
				it("should allow access if all permissions return true",inject(function($rootScope,visorPermissions){
					var success =false;
					var next = {permissions:[function(){return true;},function(){return true;}]};
					visorPermissions.onRouteChange(next,function(promise){promise.then(function(){success=true;})});
					$rootScope.$apply();
					expect(success).toEqual(true);
				}));

    });
    describe("doOnNotAllowed",function(){
        var notAllowedCalled = false;
        angular.module("config.notAllowed",["visor.permissions"]).config(function(visorPermissionsProvider){
            visorPermissionsProvider.onNotAllowed = function(){notAllowedCalled = true;};
        });
        beforeEach(function(){
            module("config.notAllowed");
            notAllowedCalled = false;
        });

        it("should call doOnNotAllowed if permission returns false",inject(function($rootScope,visorPermissions){
            var next = {restrict:function(){return false;}};
            visorPermissions.onRouteChange(next,VOID);
            $rootScope.$apply();
            expect(notAllowedCalled).toEqual(true);
        }));

        it("should notcall doOnNotAllowed if permission returns true",inject(function($rootScope,visorPermissions){
            var next = {restrict:function(){return true;}};
            visorPermissions.onRouteChange(next,VOID);
            $rootScope.$apply();
            expect(notAllowedCalled).toEqual(false);
        }));
    });
    describe("getPermissionsFromNext",function(){
       it("should use next.permission getPermissionsFromNext if not overriden",function(){
           var called = false;

           module("visor.permissions");
           inject(function($rootScope,visorPermissions){
               var next = {restrict:function(){called = true;return true;}};
               visorPermissions.onRouteChange(next,VOID);
               $rootScope.$apply();
               expect(called).toEqual(true);
           });
       });
       it("should allow replacing getPermissionsFormNext",function(){
           angular.module("config.getPerm",["visor.permissions"]).config(function(visorPermissionsProvider){
               visorPermissionsProvider.getPermissionsFromNext = function(next){return [next.something];};
           });
           var called = false;
           var shouldNotBeCalled = false;

           module("config.getPerm");
           inject(function($rootScope,visorPermissions){
               var next = {
                   something:function(){called = true;return true;},
                   restrict:function(){shouldNotBeCalled = true;}
               };
               visorPermissions.onRouteChange(next,VOID);
               $rootScope.$apply();
               expect(shouldNotBeCalled).toEqual(false);
               expect(called).toEqual(true);
           });
       });
    });
    describe("invokeParameters",function(){
        it("should send invoke parameters to permission checks",function(){
            angular.module("config.invoke",["visor.permissions"]).config(function(visorPermissionsProvider){
                visorPermissionsProvider.invokeParameters = ["param to invoke"];
            });
            var invoked = null;
            module("config.invoke");
            inject(function($rootScope,visorPermissions){
                visorPermissions.onRouteChange({
                    restrict:function(param){invoked=param;return true;}
                },VOID);
                $rootScope.$apply();
                expect(invoked).toEqual("param to invoke");
            });
        });
        it("should allow overriding invoke parameters in runtime",function(){
            var invoked = null;
            module("visor.permissions");
            inject(function($rootScope,visorPermissions){
                visorPermissions.invokeParameters = ["param to invoke"];
                visorPermissions.onRouteChange({
                    restrict:function(param){invoked=param;return true;}
                },VOID);
                $rootScope.$apply();
                expect(invoked).toEqual("param to invoke");
            });
        });
    });


});
