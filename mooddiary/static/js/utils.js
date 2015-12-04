angular.module('mooddiary.utils', [
    'restmod'
])

.service('AuthService', ['$window', '$http', '$q', 'User', '$rootScope', '$state', function($window, $http, $q, User, $rootScope, $state) {
    return {
        login: function(email, pw) {
            return $q(function(resolve, reject) {
                $http.post('/auth', {username: email, password: pw}).success(function(data, status, headers, config) {
                    var myUserId = $window.localStorage.myUserId = JSON.parse(atob(data.token.split('.')[1])).user_id;
                    $window.localStorage.token = data.token;
                    $window.localStorage.exp = JSON.parse(atob(data.token.split('.')[0])).exp;
                    $rootScope.loggedIn = true;
                    $rootScope.me = User.$find(myUserId).$then(resolve);
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
                var myUserId = $window.localStorage.getItem('myUserId');
                var token = $window.localStorage.getItem('token');
                var exp = $window.localStorage.getItem('exp');
                if (token) {
                    var now = new Date();
                    var then = new Date();
                    then.setUTCSeconds(exp);
                    if (now < then) {
                        $rootScope.loggedIn = true;
                        $rootScope.me = User.$find(myUserId).$then(function() {
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

.factory('Me', ['$rootScope', function($rootScope) {
    return $rootScope.me;
}])

.factory('User', ['restmod', function(restmod) {
    return restmod.model('users').mix('DirtyModel', 'CachedModel', {
        entries: { hasMany: 'Entry' },
        fields: { hasMany: 'Field' }
    });
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
                        instance.online = true;
                        angular.forEach(instance.callbacks, function(_fun) {
                            _fun.call(this, 'online');
                        });
                        resolve();
                    }
                })
                .error(function() {
                    if (instance.online) {
                        instance.online = false;
                        angular.forEach(instance.callbacks, function(_fun) {
                            _fun.call(this, 'offline');
                        });
                        reject();
                    }
                }
            );
        });
    };

    $interval(function() {
        checkOnlineStatus();
    }, 2000);

    return instance;
}])

.factory('OfflineStorage', ['$window', function($window) {
    var instance = {};
    instance.storages = {};

    var storage = function(_id) {
        this.prefix = _id;

        this.getAll = function() {
            var values = [];
            for (key in $window.localStorage) {
                if (key.split('/')[0] == this.prefix) {
                    var value = $window.localStorage.getItem(key);
                    values.push(JSON.parse(value));
                }
            }
            console.log('GETALL', this.prefix, values.length);
            return values;
        };

        this.get = function(_name) {
            var value = $window.localStorage.getItem(this.prefix + '/' + _name);
            console.log('GET', this.prefix, _name, value);
            return JSON.parse(value);/*, function (key, value) {
                var type;
                if (value && typeof value === 'object') {
                    type = value.type;
                    if (typeof type === 'string' && typeof window[type] === 'function') {
                        return new (window[type])(value);
                    }
                }
                return value;
            });*/
        };

        this.put = function(_name, _value) {
            console.log('PUT', this.prefix, _name, _value, JSON.stringify(_value));
            return $window.localStorage.setItem(this.prefix + '/' + _name, JSON.stringify(_value));
        };

        this.remove = function(_name) {
            console.log('REMOVE', _name);
            $window.localStorage.removeItem(this.prefix + '/' + _name);
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
