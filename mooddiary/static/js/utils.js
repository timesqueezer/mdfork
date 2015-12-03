angular.module('mooddiary.utils', [
    'restmod'
])

.service('AuthService', ['$window', '$http', '$q', '$rootScope', 'Me', '$state', function($window, $http, $q, $rootScope, Me, $state) {
    return {
        login: function(email, pw) {
            return $q(function(resolve, reject) {
                $http.post('/auth', {username: email, password: pw}).success(function(data, status, headers, config) {
                    $window.localStorage.token = data.token;
                    $window.localStorage.exp = JSON.parse(atob(data.token.split('.')[0])).exp;
                    $rootScope.loggedIn = true;
                    $rootScope.me = Me.$fetch().$then(resolve);
                }).error(function(data, status, headers, config) {
                    reject(data);
                });
            });
        },
        logout: function() {
            $window.localStorage.removeItem('token');
            $rootScope.$broadcast('logout');
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
    return restmod.model('users').mix('DirtyModel', 'CachedModel', {
        entries: { hasMany: 'Entry' },
        fields: { hasMany: 'Field' }
    });
}])

.factory('Me', ['restmod', 'User', function(restmod, User) {
    return User.single('me');
}])

.factory('Entry', ['restmod', function(restmod) {
    return restmod.model('entries').mix('DirtyModel', 'CachedModel', {
        user: { belongsTo: 'User' },
        answers: { hasMany: 'Answer' },
        $hooks: {
            'after-feed': function() {
                this.answersSorted = {};
                var entry = this;
                angular.forEach(this.answers, function(answer) {
                    entry.answersSorted[answer.entry_field_id] = answer;
                });
            }
        }
    });
}])

.factory('Field', ['restmod', function(restmod) {
    return restmod.model('fields').mix('DirtyModel', 'CachedModel', {
        user: { belongsTo : 'User' },
        answers: { hasMany: 'Answer' }
    });
}])

.factory('Answer', ['restmod', function(restmod) {
    return restmod.model('answers').mix('DirtyModel', 'CachedModel', {
        entry: { belongsTo: 'Entry' },
        field: { belongsTo: 'Field' }
    });
}])

.factory('OfflineHelper', ['$http', '$interval', '$q', function($http, $interval, $q) {
    var instance = {online: true};

    instance.callbacks = [];
    instance.registerCallback = function(_fun) {
        instance.callbacks.push(_fun);
    };

    var checkOnlineStatus = function() {
        return $q(function(resolve, reject) {
            $http.get('/empty')
                .success(function() {
                    if (!instance.online) {
                        angular.forEach(instance.callbacks, function(_fun) {
                            _fun.call(this, 'online');
                        });
                        instance.online = true;
                        resolve();
                    }
                })
                .error(function() {
                    if (instance.online) {
                        angular.forEach(instance.callbacks, function(_fun) {
                            _fun.call(this, 'offline');
                        });
                        instance.online = false;
                        reject();
                    }
                }
            );
        });
    };

    $interval(function() {
        checkOnlineStatus();
    }, 5000);

    return instance;
}])

.factory('OfflineStorage', ['$window', function($window) {
    var instance = {};
    instance.storages = {};

    var storage = function(_id) {
        this.prefix = _id;
        this.get = function(_name) {
            return $window.localStorage.getItem(this.prefix + _name);
        };

        this.put = function(_name, _value) {
            return $window.localStorage.setItem(this.prefix + _name, _value);
        };

        this.remove = function(_name) {
            $window.localStorage.removeItem(this.prefix + _name);
        };
    };

    instance.create = function(_id) {
        this.storages[_id] = new storage(_id);
        return this.storages[_id];
    };

    instance.get = function(_id) {
        return this.storages[_id];
    };
    return instance;
}])

;
