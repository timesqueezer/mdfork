angular.module('mooddiary.utils', [
    'restmod'
])

.service('AuthService', ['$window', '$http', '$q', '$rootScope', 'Me', function($window, $http, $q, $rootScope, Me) {
    return {
        login: function(email, pw) {
            return $q(function(resolve, reject) {
                $http.post('/auth', {username: email, password: pw}).success(function(data, status, headers, config) {
                    $window.localStorage.token = data.token;
                    $window.localStorage.exp = JSON.parse(atob(data.token.split('.')[0])).exp;
                    $rootScope.loggedIn = true;
                    $rootScope.me = Me.$fetch().$then(function() {
                        resolve();
                    });
                }).error(function(data, status, headers, config) {
                    reject(data);
                });
            });
        },
        logout: function() {
            $window.localStorage.removeItem('token');
            $rootScope.loggedIn = false;
            $rootScope.me = undefined;
        },
        checkAndSetLogin: function() {
            return $q(function(resolve, reject) {
                var token = $window.localStorage.getItem('token');
                var exp = $window.localStorage.getItem('exp');
                if (token) {
                    var now = new Date();
                    var then = new Date();
                    then.setUTCSeconds(exp);
                    if (now < then) {
                        $rootScope.loggedIn = true;
                        $rootScope.me = Me.$fetch().$then(function() {
                            resolve();
                        });
                    } else { reject() }
                } else { reject() }
            });
        },
        register: function(email, pw, captcha) {
            var login = this.login;
            return $q(function(resolve, reject) {
                $http.post('/api/users', {email: email, password: pw, captcha: captcha}).success(function(data) {
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

.factory('User', ['restmod', function(restmod) {
    return restmod.model('users').mix('DirtyModel', {
        entries: { hasMany: 'Entry' },
        fields: { hasMany: 'Field' }
    });
}])

.factory('Me', ['restmod', 'User', function(restmod, User) {
    return User.single('me');
}])

.factory('Entry', ['restmod', function(restmod) {
    return restmod.model('entries').mix('DirtyModel', {
        user: { belongsTo: 'User' },
        answers: { hasMany: 'Answer' }
    });
}])

.factory('Field', ['restmod', function(restmod) {
    return restmod.model('fields').mix('DirtyModel', {
        user: { belongsTo : 'User' },
        answers: { hasMany: 'Answer' }
    });
}])

.factory('Answer', ['restmod', function(restmod) {
    return restmod.model('answers').mix('DirtyModel', {
        entry: { belongsTo: 'Entry' },
        field: { belongsTo: 'Field' }
    });
}])

;
