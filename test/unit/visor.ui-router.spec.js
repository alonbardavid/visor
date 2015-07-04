describe('visor.ui-router', function () {
  describe('state change', function () {
    var defer = null;
    angular.module('test.states', ['visor.ui-router', 'ui.router']).config(function ($stateProvider, visorPermissionsProvider) {
      $stateProvider.state('first', {
        url: '/first',
        restrict: function () {
          return true;
        }
      }).state('deny', {
        url: '/deny',
        restrict: function () {
          return false;
        }
      });
      visorPermissionsProvider.doBeforeFirstCheck.push(function ($q) {
        defer = $q.defer();
        return defer.promise;
      });

    });
    beforeEach(module('test.states'));

    it('should wait to change state until delay called', inject(function ($location, $state, $rootScope) {
      var successCounter = 0;
      $rootScope.$on('$stateChangeSuccess', function () {
        successCounter++;
      });
      $location.url('/first');
      $rootScope.$apply();
      expect(successCounter).toEqual(0);
      defer.resolve('');
      $rootScope.$apply();
      expect(successCounter).toEqual(1);
      expect($location.url()).toEqual('/first');
      expect($state.current.name).toEqual('first');
    }));

    it('should stop state change when permission rejected', inject(function ($location, $state, $rootScope) {
      $location.url('/deny');
      $rootScope.$apply();
      defer.reject('');
      $rootScope.$apply();
      expect($state.current.name).toEqual('');
    }));
  });
  describe('permissions', function () {
    var calls = [];
    angular.module('test.states.permissions', ['visor.ui-router', 'ui.router']).config(function ($stateProvider, visorPermissionsProvider) {
      $stateProvider.state('parent', {
        restrict: function () {
          calls.push('parent');
          return true;
        }
      }).state('child', {
        parent: 'parent',
        url: '/child',
        restrict: function () {
          calls.push('child');
          return true;
        }
      }).state('deny', {
        url: '/deny',
        restrict: function () {
          calls.push('deny');
          return false;
        }
      });

    });
    beforeEach(function () {
      calls = [];
      module('test.states.permissions')
    });
    it('should check permissions in next', inject(function ($state, $rootScope, $location) {
      $state.go('deny');
      $rootScope.$apply();
      expect(calls).toEqual(['deny'])
    }));
    it('should check permission for parent route', inject(function ($state, $rootScope, $location) {
      $state.go('child');
      $rootScope.$apply();
      expect(calls).toEqual(['parent', 'child'])
    }));
  });
  it('should not change anything if ui-router is not depended on', function () {
    module('visor.permissions', 'visor.ui-router');
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
      //nothing crashed!
    })
  });
});
