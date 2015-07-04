describe('delayLocationChange', function () {
  var firstCalled, secondCalled;
  var firstDefer, secondDefer;
  angular.module('delayLocationChange.test', ['delayLocationChange'])
    .run(function (delayLocationChange, $q) {
      firstCalled = secondCalled = 0;
      firstDefer = $q.defer();
      secondDefer = $q.defer();
      delayLocationChange(firstDefer.promise);
      delayLocationChange(secondDefer.promise);
    })
  beforeEach(module('delayLocationChange.test'));

  it('should stop location change until promises is resolved', inject(function ($location, $rootScope) {
    var successes = 0;
    $rootScope.$on('$locationChangeSuccess', function () {
      successes++;
    });
    $rootScope.$apply();
    expect(successes).toEqual(0);
    firstDefer.resolve();
    $rootScope.$apply();
    expect(successes).toEqual(0);
    secondDefer.resolve();
    $rootScope.$apply();
    expect(successes).toEqual(1);
  }));
});
