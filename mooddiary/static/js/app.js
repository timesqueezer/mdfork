angular.module('mooddiary', [
    'ngResource',
    'ui.router',
    'chart.js',
    'mgcrea.ngStrap',
    'mgcrea.ngStrap.modal',
    'mgcrea.ngStrap.alert',
    'mooddiary.diary',
    'mooddiary.utils',
    'ngLocalize',
    'ngLocalize.Events',
    'ngLocalize.Config',
    'ngLocalize.InstalledLanguages'
])

.controller('myAppControl', ['$scope', 'localeEvents',
    function ($scope, localeEvents) {
        $scope.$on(localeEvents.resourceUpdates, function () {
            console.log('rofl');
        });
        $scope.$on(localeEvents.localeChanges, function (event, data) {
            console.log('new locale chosen: ' + data);
        });
    }
])

.value('localeConf', {
    basePath: 'languages',
    defaultLocale: 'en-US',
    sharedDictionary: 'common',
    fileExtension: '.lang.json',
    persistSelection: true,
    cookieName: 'COOKIE_LOCALE_LANG',
    observableAttrs: new RegExp('^data-(?!ng-|i18n)'),
    delimiter: '::'
})

.value('localeSupported', [
    'en-US',
    'de-DE'
])

.value('localeFallbacks', {
    'en': 'en-US',
    'de': 'de-DE'
})

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

    .state('login', {
        url: '/login',
        templateUrl: '/templates/login',
        controller: 'LoginCtrl'
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

.filter('fieldTypeToString', ['$filter', 'locale', function($filter, locale) {
    return function(type) {
        locale.ready('common').then(function() {
            if (type == 1) return $filter('i18n')('common.field_string');
            else if (type == 2) return $filter('i18n')('common.field_range');
            else if (type == 3) return $filter('i18n')('common.field_integer');
            else return 'Invalid Type';
        });
    };
}])


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

.controller('NavCtrl', ['$scope', 'AuthService', '$http', '$state', 'locale', 'localeSupported', 'localeEvents',
function($scope, AuthService, $http, $state, locale, localeSupported, localeEvents) {
    $scope.logout = function() {
        AuthService.logout();
        $state.go('about');
    };

    $scope.supportedLang = localeSupported;
    $scope.localeData = {
        'en-US': {
            flagClass: 'flag-us',
            langDisplayText: 'English'
        },
        'de-DE': {
            flagClass: 'flag-de',
            langDisplayText: 'Deutsch'
        }
    };

    $scope.setLocale = function (loc) {
        locale.setLocale(loc);
    };

    locale.ready('common').then(function () {
        $scope.flagClass = $scope.localeData[locale.getLocale()].flagClass;
        $scope.langDisplayText = $scope.localeData[locale.getLocale()].langDisplayText;
    });

    $scope.$on(localeEvents.localeChanges, function (event, data) {
        $scope.flagClass = $scope.localeData[data].flagClass;
        $scope.langDisplayText = $scope.localeData[data].langDisplayText;
    });

    $scope.$state = $state;
}])

.controller('LoginCtrl', ['$scope', '$state', '$http', '$rootScope', 'AuthService', function($scope, $state, $http, $rootScope, AuthService) {
    $scope.login = function(email, password) {
        AuthService.login(email, password).then(function() {
            $http.get('/api/me').success(function(data) {
                $rootScope.me = data;
                $state.go('diary.list');
            });
        }, function(resp) {
            $scope.errorMessage = resp.description;
        });
    };

    $scope.register = function(email, password) {
        AuthService.register(email, password).then(function() {
            $state.go('settings', {newUser: true});
        }, function(resp) {
            $scope.errorMessage = resp.message;
        });
    };
}])

.controller('AboutCtrl', function() {})

;
