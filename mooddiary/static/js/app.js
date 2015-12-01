angular.module('mooddiary', [
    'ngAnimate',
    'ui.router',
    'chart.js',
    'mgcrea.ngStrap',
    'mgcrea.ngStrap.modal',
    'mgcrea.ngStrap.alert',
    'mooddiary.config',
    'mooddiary.diary',
    'mooddiary.utils',
    'ngLocalize',
    'ngLocalize.Events',
    'ngLocalize.Config',
    'ngLocalize.InstalledLanguages',
    'grecaptcha',
    'restmod',
    'infinite-scroll',
    'smoothScroll'
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

.run(['AuthService', '$rootScope', 'locale', '$anchorScroll', '$state', '$window', function(AuthService, $rootScope, locale, $anchorScroll, $state, $window) {
    AuthService.checkAndSetLogin().then(function() {
        locale.setLocale($rootScope.me.language);
    }, function() {
        locale.setLocale('de-DE');
    });

    moment().utc();

    $rootScope.$on('$viewContentLoaded', function() {
        $anchorScroll();
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        if (error && error.status == 404) {
            $state.go('about');
        } else if (error && error.status == 401) {
            $state.go('about');
        }

        console.log(error); //Do not remove this!
    });

    $rootScope.$on('logout', function() {
        $state.go('about').then(function() {
            $window.location.reload(true);
        });
    });

    $rootScope.isMobile = false; //initiate as false
    // device detection
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) $rootScope.isMobile = true;
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

    .state('register', {
        url: '/register',
        templateUrl: '/templates/register',
        controller: 'LoginCtrl'
    })

    .state('disclaimer', {
        url: '/disclaimer',
        templateUrl: '/templates/disclaimer',
        controller: function() {}
    })

    .state('privacy', {
        url: '/privacy',
        templateUrl: '/templates/privacyPolicy',
        controller: function() {}
    })

    .state('admin', {
        url: '/admin',
        templateUrl: '/templates/admin',
        controller: 'AdminCtrl'
    })

    ;

}])

.controller('SettingsCtrl', ['$scope', '$alert', '$rootScope', 'fieldsResolved', 'Me', 'locale', 'localeSupported', 'localeEvents', 'smoothScroll',
function($scope, $alert, $rootScope, fieldsResolved, Me, locale, localeSupported, localeEvents, smoothScroll) {
    // Functions and constants
    var errorCallback = function(data) {
        console.log(data);
        $alert({content: locale.getString('common.default_error')});
    };

    var reloadFields = function() {
        Me.fields.$refresh().$then(function(data) {
            $scope.fields = data;
        }, errorCallback);
    };

    var defaultColors = [
        '0a80ba',
        'F7464A', // red
        '39BF71', // green
        'FDB45C', // yellow
        '4D5360', // dark grey
        '460793',
        '390DFA',
        'cc3f1a'
    ];

    // generic color-style to user e.g. in setStyle(style) or style[0] as 'real' style in ng-style
    $scope.getColorStyle = function(color, clickable) {
        clickable = clickable || false;
        if (clickable)
            return [{'background-color': color, 'height': '80px', 'width': '100%', 'cursor': 'pointer'}, color];
        else
            return [{'background-color': color, 'height': '80px', 'width': '100%', 'border-radius': '3px'}, color];
    };

    // Field circle-dots
    $scope.getFieldStyle = function(color) {
        return {'background-color': color, 'height': '30px', 'width': '30px', 'vertical-align': 'middle', 'border-radius': '30px'};
    };

    $scope.addField = function() {
        if (angular.isString($scope.newField.type)) {
            $scope.newField.type = parseInt($scope.newField.type);
        }
        var callback = function() {
            $scope.editOrAddField = false;
            $scope.newField = Me.fields.$build({type: 2});
            $scope.setStyle($scope.getColorStyle(defaultColors[0]));
        };
        if ($scope.newField.id) {
            $scope.newField.$save(['name', 'color']).$then(callback, errorCallback);
        } else {
            $scope.newField.$save().$then(callback, errorCallback);
        }
    };

    $scope.deleteField = function(field) {
        if (confirm(locale.getString('common.delete_field_confirm'))) {
            field.$destroy().$then(reloadFields);
        }
    };

    $scope.saveProfile = function() {
        if ($rootScope.me.password && $rootScope.me.password != $scope.password2) {
            $alert({content: locale.getString('common.password_differ')});
            return;
        }
        var colorsChanged = $rootScope.me.$dirty().indexOf('use_colors') != -1;
        $rootScope.me.$save($rootScope.me.$dirty()).$then(function() {
            $alert({content: locale.getString('common.changes_saved')});
            $scope.showReloadAlert = colorsChanged;
        });
    };

    $scope.setStyle = function(style) {
        $scope.selectedColorStyle = style[0];
        $scope.newField.color = style[1];
    };

    $scope.editField = function(field) { // Or add without parameter
        $scope.editOrAddField = true;
        var elem = document.getElementById('editOrAddContainer');
        smoothScroll(elem);

        if (field) {
            $scope.newField = field;
            $scope.edittingField = true;
            $scope.setStyle($scope.getColorStyle(field.color));
        } else {
            $scope.edittingField = false;
        }
    };

    $scope.resetForm = function() {
        if ($scope.newField.id) {
            $scope.newField.$restore();
        }
        $scope.newField = Me.fields.$build({type: 2});
        $scope.setStyle($scope.getColorStyle(defaultColors[0]));
        $scope.editOrAddField = false;
    };

    // Init-stuff

    if ($rootScope.isMobile) {
        $('#profileEditForm').collapse();
        $('#fieldContent').collapse();
    }

    $scope.defaultColorStyles = _.map(defaultColors, function(color) {
        return $scope.getColorStyle(color, true);
    });

    $scope.fields = fieldsResolved;
    $scope.newField = fieldsResolved.$build({type: 2});
    $scope.setStyle($scope.defaultColorStyles[0]);
    $scope.edittingField = false;

}])

.controller('LanguageCtrl', ['$scope', '$rootScope', 'locale', 'localeSupported', 'localeEvents',
function($scope, $rootScope, locale, localeSupported, localeEvents) {
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
}])

.filter('fieldTypeToString', ['$filter', 'locale', function($filter, locale) {
    return function(type) {
        if (type == 1) return locale.getString('common.field_string');
        else if (type == 2) return locale.getString('common.field_range');
        else if (type == 3) return locale.getString('common.field_integer');
        else return 'Invalid Type';
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
    };

    $scope.$state = $state;
}])

.controller('LoginCtrl', ['$scope', '$state', 'Me', '$rootScope', 'AuthService', 'locale', '$alert',
function($scope, $state, Me, $rootScope, AuthService, locale, $alert) {
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

.controller('AdminCtrl', ['$scope', '$state', 'User', 'Me', '$q', function($scope, $state, User, Me, $q) {
    if (!Me.is_admin) {
        $state.go('about');
    } else {
        $scope.users = User.$collection();
        $scope.users.$refresh();
    }

    var args = {sort_by: 'date', order: 'desc'};

    $scope.loadUser = function(user) {
        $scope.selectedUser = null;
        var promises = [];
        promises.push(user.fields.$resolve().$asPromise());
        promises.push(user.entries.$resolve().$asPromise());
        $q.all(promises).then(function() {
            $scope.selectedUser = user;
        });
    };
}])

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
