angular.module('mooddiary', ['ui.router'])

.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/');

    $stateProvider

    .state('index', {
        url: '/',
        templateUrl: '/templates/main',
        controller: 'MainCtrl'
    })

    ;

}])

.controller('MainCtrl', ['$scope', '$http', function($scope, $http) {
    var errorCallback = function(data) {
        console.log(data);
    };

    $http.get('/api/entry_fields').success(function(data) {
        $scope.fields = data.objects;
    }).error(errorCallback);

    $http.get('/api/entry').success(function(data) {
        $scope.entries = data.objects;
    }).error(errorCallback);

}])

;
