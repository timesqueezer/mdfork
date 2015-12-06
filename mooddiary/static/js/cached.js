/**
 * @mixin CachedModel
 *
 * @description
 *
 * Enables localStorage-based caching of models
 */

angular.module('restmod').factory('CachedModel', ['restmod', 'OfflineStorage', 'OfflineHelper', '$q', function(restmod, OfflineStorage, OH, $q) {

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
                cache.put(this.$pk, this.$wrap());
            })

            .on('after-destroy', function(xhr) {
                console.log('after-destroy');
                var cache = getCache(this.$type.getProperty('name'));
                cache.remove(this.$pk);
            })

            .define('$fetch', function() {
                console.log('$fetch', this.$type.getProperty('name'));
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    var _id = this.$pk || this.id;
                    if (_id) {
                        var cached = cache.get(_id);
                        if (cached) {
                            return this.$unwrap(cached);
                        }
                    }
                    console.log('NETWORK Loading', this.$type.getProperty('name'));
                    return this.$super.apply(this, arguments).$asPromise().then(function(instance) {
                        cache.put(instance.id, instance.$wrap());
                    });
                });
            })

            /*.define('Model.$new', function(_key, _scope) {
                console.log('$new', this.$type.getProperty('name'));
                var self = this;

                if(_key) {
                    // search for instance with same key, if key is found then return instance
                    var cache = getCache(this.$type.getProperty('name'));
                    var cached = cache.get(_key);
                    if(cached) {
                        this.$build(_key, _scope).$extend(cached);
                    }
                }
                return this.$super(_key, _scope);
            })*/
            /*
            .define('$decode', function(_raw, _mask) {
                console.log('$decode', this.$type.getProperty('name'));
                var self = this,
                    result = this.$super(_raw, _mask);

                if(result.$pk) {
                    var cache = getCache(this.$type.getProperty('name'));
                    cache.put(result.$pk, this.$wrap());
                }

                return this.$super(_raw, _mask);
            })*/

            .define('Collection.$fetch', function(_args) {
                console.log('Collection.$fetch', this.$type.getProperty('name'));
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    //self.$promise = $q(function(resolve, reject) {
                        //console.debug('offline:', !OH.online);
                        var cachedList = cache.getAll(_args)
                        if (cachedList.length) {
                            var lastResolved = this.$resolved;
                            this.$decode(cachedList);
                            this.$resolved = lastResolved;
                        } else {
                            console.log('NETWORK Loading', this.$type.getProperty('name'), _args);
                            this.$super.call(this, _args).$then(function(data) {
                                angular.forEach(data, function(instance) {
                                    cache.put(instance.id, instance.$wrap());
                                });
                            });
                        }
                    //});
                });
            })

            .define('Model.$eject', function() {
                console.log('$eject');
                var cache = getCache(this.$type.getProperty('name'));
                angular.forEach(cache.keys(), function(key, value) {
                    cache.remove(key);
                });
            })

        ;
    });
}]);