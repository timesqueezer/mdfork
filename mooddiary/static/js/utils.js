angular.module('mooddiary.utils', [])

.service('AuthService', ['$window', '$http', '$q', '$rootScope', function($window, $http, $q, $rootScope) {
    return {
        login: function(email, pw) {
            return $q(function(resolve, reject) {
                $http.post('/auth', {username: email, password: pw}).success(function(data, status, headers, config) {
                    $window.localStorage.token = data.token;
                    $window.localStorage.exp = JSON.parse(atob(data.token.split('.')[0])).exp;
                    $rootScope.loggedIn = true;
                    resolve();
                }).error(function(data, status, headers, config) {
                    reject(data);
                });
            });
        },
        logout: function() {
            $window.localStorage.removeItem('token');
            $rootScope.loggedIn = false;
        },
        checkAndSetLogin: function() {
            var token = $window.localStorage.getItem('token');
            var exp = $window.localStorage.getItem('exp');
            if (token) {
                var now = new Date();
                var then = new Date();
                then.setUTCSeconds(exp);
                if (now < then) {
                    $rootScope.loggedIn = true;
                }
            }
        },
        register: function(email, pw) {
            var login = this.login;
            return $q(function(resolve, reject) {
                $http.post('/api/users', {email: email, password: pw}).success(function(data) {
                    console.log(login);
                    login(email, pw).then(resolve);
                }).error(function(data) {
                    reject(data);
                })
            });
        }
    };
}])

.factory('authInterceptor', ['$window', function($window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            var token = $window.localStorage.getItem('token');
            var exp = $window.localStorage.getItem('exp');
            var now = new Date();
            if (token && exp && exp > now.getUTCSeconds()) {
                config.headers.Authorization = 'Bearer ' + token;
            }

            return config;
        }
    };
}])

.factory('Me', ['$resource', function($resource) {
    return $resource('/api/me');
}])

.factory('Entry', ['$resource', function($resource) {
    return $resource('/api/entries/:entryId', {entryId: '@id'});
}])

.factory('Field', ['$resource', function($resource) {
    return $resource('/api/fields/:fieldId', {fieldId: '@id'});
}])

.factory('Answer', ['$resource', function($resource) {
    return $resource('/api/answers/:answerId', {answerId: '@id'});
}])

;
