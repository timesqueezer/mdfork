/**
 * @mixin CachedModel
 *
 * @description
 *
 * Enables localStorage-based caching of models
 */

angular.module('restmod').factory('CachedModel', ['restmod', 'OfflineStorage', function(restmod, OfflineStorage) {

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

            .define('Resource.$fetch', function() {
                var _id = this.$pk ? this.$pk : this.$url();
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    var instance = cache.get(_id);
                    if (instance) {
                        return instance;
                    } else {
                        this.$super.apply(this, arguments);
                        cache.put(_id, this);
                        return this;
                    }
                });
            })

            .define('Resource.$find', function(_pk) {
                console.log('$find');
                var cache = getCache(this.$type.getProperty('name'));
                return this.$action(function() {
                    var instance = cache.get(_pk);
                    if (instance) {
                        return instance;
                    } else {
                        instance = this.$super.apply(this, arguments);
                        cache.put(_pk, instance);
                        return instance;
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
