module.exports = function(config){
  config.set({

    files : [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-route/angular-route.js',
      'src/**/*.js',
      'test/unit/**/*.js'
    ],

    autoWatch : false,
    singleRun: true,
		basePath:"../",

    reporters: ['spec'],
    frameworks: ['jasmine'],

    browsers : ['PhantomJS'],

    plugins : [
            'karma-phantomjs-launcher',
            'karma-jasmine',
            'karma-spec-reporter',
            'karma-chrome-launcher'
            ]

  });
};