angular.module('mooddiary', [
    'ngAnimate',
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
    'ngLocalize.InstalledLanguages',
    'grecaptcha',
    'restmod'
])

.controller('myAppControl', ['$scope', 'localeEvents',
    function ($scope, localeEvents) {
        $scope.$on(localeEvents.resourceUpdates, function () {
            console.log('locale resource update');
        });
        $scope.$on(localeEvents.localeChanges, function (event, data) {
            console.log('new locale chosen: ' + data);
        });
    }
])

.value('localeConf', {
    basePath: 'languages',
    defaultLocale: 'de-DE',
    sharedDictionary: 'common',
    fileExtension: '.lang.json',
    persistSelection: false,
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

.config(['$alertProvider', function($alertProvider) {
    angular.extend($alertProvider.defaults, {
        animation: 'am-fade',
        container: '#alert-container',
        dismissable: false,
        duration: 4,
        show: true,
        type: 'danger'
    });
}])

.config(['grecaptchaProvider', function(grecaptchaProvider) {
    grecaptchaProvider.setParameters({
        sitekey: '6LdSswwTAAAAABTZq5Za_0blmaSpcg-dFcqaGda9',
        theme: 'light'
    });
}])

.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}])

.run(['AuthService', '$rootScope', 'locale', function(AuthService, $rootScope, locale) {
    AuthService.checkAndSetLogin().then(function() {
        locale.setLocale($rootScope.me.language);
    }, function() {
        locale.setLocale('de-DE');
    });
}])

.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', 'restmodProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider, restmodProvider) {
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/about');

    restmodProvider.rebase('MoodDiaryApi');

    $stateProvider

    .state('settings', {
        url: '/settings',
        templateUrl: '/templates/settings',
        controller: 'SettingsCtrl',
        resolve: {
            fieldsResolved: ['Me', function(Me) {
                return Me.fields.$refresh().$asPromise();
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

.controller('SettingsCtrl', ['$scope', '$alert', '$rootScope', 'fieldsResolved', 'Me', 'locale', 'localeSupported', 'localeEvents',
function($scope, $alert, $rootScope, fieldsResolved, Me, locale, localeSupported, localeEvents) {

    var errorCallback = function(data) {
        console.log(data);
    };

    var reloadFields = function() {
        Me.fields.$refresh().$then(function(data) {
            $scope.fields = data;
        }, errorCallback);
    };

    $scope.fields = fieldsResolved;
    $scope.newField = Me.fields.$build({type: 2});

    $scope.addField = function() {
        if (angular.isString($scope.newField.type)) {
            $scope.newField.type = parseInt($scope.newField.type);
        }
        $scope.newField.$save().$then(function() {
            reloadFields();
            $scope.newField = Me.fields.$build({type: 2});
        }, errorCallback);
    };

    $scope.deleteField = function(field) {
        if (confirm(locale.getString('common.delete_field_confirm'))) {
            field.$destroy().$then(reloadFields);
        }
    };

    $scope.supportedLang = localeSupported;
    $scope.localeData = {
        'en-US': {
            flagClass: 'flag-icon-us',
            langDisplayText: 'English'
        },
        'de-DE': {
            flagClass: 'flag-icon-de',
            langDisplayText: 'Deutsch'
        }
    };

    $scope.setLocale = function (loc) {
        locale.setLocale(loc);
        $rootScope.me.language = loc;
    };

    locale.ready('common').then(function () {
        $scope.flagClass = $scope.localeData[locale.getLocale()].flagClass;
        $scope.langDisplayText = $scope.localeData[locale.getLocale()].langDisplayText;
    });

    $scope.$on(localeEvents.localeChanges, function (event, data) {
        $scope.flagClass = $scope.localeData[data].flagClass;
        $scope.langDisplayText = $scope.localeData[data].langDisplayText;
    });

    $scope.saveProfile = function() {
        if ($rootScope.me.password && $rootScope.me.password != $scope.password2) {
            $alert({content: locale.getString('common.password_differ')});
            return;
        }
        $rootScope.me.$save($rootScope.me.$dirty()).$then(function() {
            $alert({content: locale.getString('common.changes_saved')});
        });
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

.controller('NavCtrl', ['$scope', 'AuthService', '$http', '$state', 'locale',
function($scope, AuthService, $http, $state, locale) {
    $scope.logout = function() {
        AuthService.logout();
        locale.setLocale('de-DE');
        $state.go('about');
    };

    $scope.$state = $state;
}])

.controller('LoginCtrl', ['$scope', '$state', 'Me', '$rootScope', 'AuthService', 'locale',
function($scope, $state, Me, $rootScope, AuthService, locale) {
    $scope.login = function(email, password) {
        AuthService.login(email, password).then(function() {
            locale.setLocale($rootScope.me.language);
            $state.go('diary.list');
        }, function(resp) {
            $scope.errorMessage = resp.description;
        });
    };

    $scope.register = function() {
        if (!$scope.passwordRegister || !$scope.password2Register || $scope.passwordRegister != $scope.password2Register) {
            $alert({content: locale.getString('common.password_differ')});
        } else {
            AuthService.register($scope.emailRegister, $scope.passwordRegister, $scope.captcha).then(function() {
                $state.go('settings', {newUser: true});
            }, function(resp) {
                $scope.errorMessage = resp.message;
            });
        }
    };
}])

.controller('AboutCtrl', function() {})

;

angular.module('restmod').factory('MoodDiaryApi', ['restmod', 'inflector', function(restmod, inflector) {

    return restmod.mixin({ // include default packer extension
        $config: {
            urlPrefix: '/api/',
            style: 'MoodDiary',
            primaryKey: 'id'
        },
        $extend: {
            Model: {
                encodeUrlName: inflector.parameterize
            }
        }
    });
}])

;
