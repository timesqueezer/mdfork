angular.module('mooddiary', [
    'ngResource',
    'ui.router',
    'chart.js',
    'mgcrea.ngStrap',
    'mgcrea.ngStrap.modal',
    'mgcrea.ngStrap.alert',
    'mooddiary.diary',
    'mooddiary.utils'
])

.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}])

.run(['AuthService', '$rootScope', '$http', function(AuthService, $rootScope, $http) {
    AuthService.checkAndSetLogin();
    if ($rootScope.loggedIn) {
        $http.get('/api/me').success(function(data) {
            $rootScope.me = data;
        });
    }
}])

.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/about');

    $stateProvider

    .state('settings', {
        url: '/settings',
        templateUrl: '/templates/settings',
        controller: 'SettingsCtrl',
        resolve: {
            fieldsResolved: ['Field', function(Field) {
                return Field.query().$promise;
            }]
        }
    })

    .state('about', {
        url: '/about',
        templateUrl: '/templates/about',
        controller: 'AboutCtrl'
    })

    ;

}])

.controller('SettingsCtrl', ['$scope', 'fieldsResolved', 'Field', function($scope, fieldsResolved, Field) {

    var errorCallback = function(data) {
        console.log(data);
    };

    var reloadFields = function() {
        Field.query(function(data) {
            $scope.fields = data;
        }, errorCallback);
    };

    $scope.fields = fieldsResolved;
    $scope.newField = new Field({type: 2});

    $scope.addField = function() {
        if (angular.isString($scope.newField.type)) {
            $scope.newField.type = parseInt($scope.newField.type);
        }
        $scope.newField.$save(function() {
            reloadFields();
            $scope.newField = new Field({type: 2});
        }, errorCallback);
    };

    $scope.deleteField = function(field) {
        field.$delete(reloadFields);
    };

}])

.filter('fieldTypeToString', function() {
    return function(type) {
        if (type == 1) return 'String';
        else if (type == 2) return 'Range';
        else if (type == 3) return 'Integer';
        else return 'Invalid Type';
    };
})


.filter('array', function() {
    return function(arrayLength) {
        if (arrayLength) {
            arrayLength = Math.ceil(arrayLength);
            var arr = new Array(arrayLength), i = 0;
            for (; i < arrayLength; i++) {
                arr[i] = i;
            }
            return arr;
        }
    }
})

.controller('LoginCtrl', ['$scope', 'AuthService', '$modal', '$http', '$rootScope', '$state', function($scope, AuthService, $modal, $http, $rootScope, $state) {
    var loginModal = $modal({title: 'Login or Register', show: false, contentTemplate: '/templates/loginModal', scope: $scope});

    $scope.login = function(email, password) {
        AuthService.login(email, password).then(function() {
            loginModal.hide();
            $http.get('/api/me').success(function(data) {
                $rootScope.me = data;
            });
        }, function(resp) {
            $scope.errorMessage = resp.description;
        });
    };

    $scope.register = function(email, password) {
        AuthService.register(email, password).then(function() {
            loginModal.hide();
            $state.go('settings', {newUser: true});
        }, function(resp) {
            $scope.errorMessage = resp.message;
        });
    };

    $scope.showLoginModal = function() {
        loginModal.show();
    };

    $scope.logout = function() {
        AuthService.logout();
        $state.go('about');
    }

    $scope.$state = $state;
}])

.controller('AboutCtrl', function() {})

;
