angular.module('mooddiary', ['ui.router', 'chart.js', 'mgcrea.ngStrap'])

.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/');

    $stateProvider

    .state('index', {
        url: '/',
        templateUrl: '/templates/main',
        controller: 'MainCtrl',
        resolve: {
            fieldsResolved: ['$http', function($http) {
                return $http.get('/api/entry_field');
            }],
            entriesResolved: ['$http', function($http) {
                return $http.get('/api/entry');
            }]
        }
    })

    .state('settings', {
        url: '/settings',
        templateUrl: '/templates/settings',
        controller: 'SettingsCtrl',
        resolve: {
            fieldsResolved: ['$http', function($http) {
                return $http.get('/api/entry_field');
            }]
        }
    })

    ;

}])

.controller('MainCtrl', ['$scope', '$http', '$filter', '$q', 'fieldsResolved', 'entriesResolved', function($scope, $http, $filter, $q, fieldsResolved, entriesResolved) {

    var errorCallback = function(data) {
        console.error(data);
    };

    var reloadEntries = function() {
        $http.get('/api/entry').success(function(data) {
            $scope.entries = data;
            reloadCharts();
        }).error(errorCallback);
    };

    var reloadCharts = function() {
        $scope.chartData = {};
        $scope.actualChartData = [];
        $scope.series = [];

        $scope.labels = _.map($scope.entries.objects, function(entry) {
            return ($filter('date')(entry.date, 'dd', 'UTC') == 01 ? ($filter('date')(entry.date, 'MMMM', 'UTC') + ' ') : '') + $filter('date')(entry.date, 'dd', 'UTC');
        });

        angular.forEach($scope.chartableFields, function(field) {
            var data = _.map($scope.entries.objects, function(entry) {
                var answer = _.findWhere(entry.answers, {entry_field_id: field.id});
                if (answer) {
                    return answer.content;
                } else {
                    return 0;
                }
            })
            $scope.chartData[field.id] = data;
        });
    };

    $scope.toggleChartField = function(field) {
        if ($scope.series.indexOf(field.name) == -1) {
            $scope.series.push(field.name);
            $scope.actualChartData.push($scope.chartData[field.id]);
        } else {
            $scope.series.splice($scope.series.indexOf(field.name), 1);
            $scope.actualChartData.splice($scope.actualChartData.indexOf($scope.chartData[field.id]), 1);
        }
    };

    $scope.getAnswerForField = function(entry, field) {
        var answer = _.findWhere(entry.answers, {entry_field_id: field.id});
        if (answer) {
            return answer.content;
        } else {
            return '-';
        }
    };

    $scope.addEntry = function() {
        $http.post('/api/entry', $scope.newEntry).success(function(created_entry) {
            var promises = [];
            angular.forEach($scope.fields.objects, function(field) {
                var answer = {};
                answer.entry_field_id = field.id;
                answer.entry_id = created_entry.id;
                answer.content = $scope.newEntryAnswers[field.id];
                promises.push($http.post('/api/entry_field_answer', answer));
            });
            $q.all(promises).then(function() {
                $scope.newEntry = {};
                $scope.newEntryAnswers = {};
                reloadEntries();
            }, errorCallback);
        }).error(errorCallback);
    };

    /*$scope.$watch('timeLimit', function() {
        var number = parseInt($scope.timeLimit.split('.')[0]);
        var timeSpan = $scope.timeLimit.split('.')[1];
        var today = var endDate = new Date.UTC();
        var startDate = new Date();w
        if (timeSpan == 'w') {
            startDate.day -=
        }

        var filters = {'or': [{'name': 'date', 'op': '>', startDate}, {'name': 'date', 'op': '<=', endDate}]};
        $http.get('/api/entry', {'q': filters}).success(function(data) {
            $scope.entries = data;
            reloadCharts();
        });
    });*/

    // Init
    $scope.entries = entriesResolved.data;
    $scope.fields = fieldsResolved.data;
    $scope.chartableFields = _.filter($scope.fields.objects, function(field) {
        return field.type != 1;
    });

    $scope.newEntry = {};
    $scope.newEntryAnswers = {};
    $scope.today = new Date();

    reloadCharts();
}])

.controller('SettingsCtrl', ['$scope', '$http', 'fieldsResolved', function($scope, $http, fieldsResolved) {

    var errorCallback = function(data) {
        console.log(data);
    };

    var reloadFields = function() {
        $http.get('/api/entry_field').success(function(data) {
            $scope.fields = data;
        }).error(errorCallback);
    };

    $scope.fields = fieldsResolved.data;
    $scope.newField = {type: 2};

    $scope.addField = function() {
        $http.post('/api/entry_field', $scope.newField).success(function() {
            reloadFields();
            $scope.newField = {type: 2};
        }).error(errorCallback);
    };

    $scope.deleteField = function(field) {
        $http.delete('/api/entry_field/' + field.id).success(reloadFields);
    };

}])

.filter('fieldTypeToString', function() {
    return function(type) {
        if (type == 1) return 'String';
        else if (type == 2) return 'Range';
        else if (type == 3) return 'Integer';
        else return 'Invalid Type';
    };
})


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

;
