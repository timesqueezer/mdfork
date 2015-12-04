/**
 * @mixin CachedModel
 *
 * @description
 *
 * Enables localStorage-based caching of models
 */

angular.module('restmod').factory('CachedModel', ['restmod', 'OfflineStorage', 'OfflineHelper', function(restmod, OfflineStorage, OH) {

    var getCache = function(_name) {
        if (angular.isUndefined(_name)) {
            console.log('WHOOPS');
        } else {
            return OfflineStorage.get(_name) || OfflineStorage.create(_name);
        }
    };

    return restmod.mixin(function() {
        this

            .on('after-fetch-many', function(xhr) {
                console.log('after-fetch-many');
                /*angular.forEach(this, function(record) {
                    cache = getCache(record.$type.getProperty('name'));
                    cache.put(record.$pk, record);
                });*/
            })

            .on('after-save', function(xhr) {
                console.log('after-save');
                var cache = getCache(this.$type.getProperty('name'));
                cache.put(this.$pk, this);
            })

            .on('after-destroy', function(xhr) {
                console.log('after-destroy');
                var cache = getCache(this.$type.getProperty('name'));
                cache.remove(this.$pk);
            })

            .define('$fetch', function() {
                console.log('$fetch');
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    var _id = this.$pk || this.id;
                    if (_id) {
                        var cached = cache.get(_id);
                        if (cached) {
                            return this.$unwrap(cached);
                        }
                    }
                    return this.$super.apply(this, arguments).$asPromise().then(function(instance) {
                        cache.put(instance.id, instance.$wrap());
                    });
                });
            })

            .define('Collection.$fetch', function() {
                console.log('Collection.$fetch');
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    console.debug('online:', OH.online, 'resolved:', this.$dmStatus);
                    if (!OH.online) {
                        var cachedList = cache.getAll();
                        if (cachedList.length) {
                            var lastResolved = this.$resolved;
                            this.$decode(cachedList);
                            this.$resolved = lastResolved;
                        }
                    } else {
                        this.$super.apply(this, arguments).$asPromise().then(function(data) {
                            console.debug('resolved:', data.$resolved);
                            angular.forEach(data, function(instance) {
                                cache.put(instance.id, instance.$wrap());
                            });
                        });
                    }
                });
            })

            .define('Resource.$eject', function() {
                console.log('$eject');
                var cache = getCache(this.$type.getProperty('name'));
                angular.forEach(cache.info(), function(key, value) {
                    cache.remove(key);
                });
            })

        ;
    });
}]);
