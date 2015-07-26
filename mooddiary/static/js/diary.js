angular.module('mooddiary.diary', [])

.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/about');

    $stateProvider

    .state('diary', {
        url: '/diary',
        templateUrl: '/templates/diary',
        controller: 'DiaryCtrl',
        resolve: {
            fieldsResolved: ['Field', function(Field) {
                return Field.query().$promise;
            }],
            entriesResolved: ['Entry', function(Entry) {
                return Entry.query().$promise;
            }]
        }
    })

        .state('diary.list', {
            url: '/list',
            templateUrl: '/templates/diaryList',
            controller: 'DiaryListCtrl'
        })

        .state('diary.table', {
            url: '/table',
            templateUrl: '/templates/diaryTable',
            controller: 'DiaryListCtrl'
        })

        .state('diary.chart', {
            url: '/chart',
            templateUrl: '/templates/diaryChart',
            controller: 'DiaryChartCtrl'
        })

}])



.controller('DiaryCtrl', ['$scope', '$q', '$state', '$alert', 'fieldsResolved', 'entriesResolved', 'Field', 'Entry', 'Answer', function($scope, $q, $state, $alert, fieldsResolved, entriesResolved, Field, Entry, Answer) {

    var errorCallback = function(data) {
        console.error(data);
    };

    var checkIfEntryAddedToday = function(entries) {
        var today = new Date();
        
        var entry = _.filter(entries, function(entry) {

        })
    };

    var reloadEntries = function() {
        Entry.query(function(data) {
            $scope.entries = data;
        }, errorCallback);
    };

    $scope.getAnswerForField = function(entry, field) {
        var answer = _.findWhere(entry.answers, {entry_field_id: field.id});
        if (answer) {
            if (field.type != 1)
                answer.content = parseInt(answer.content);
            return answer.content;
        } else {
            return '-';
        }
    };

    $scope.addEntry = function() {
        $scope.newEntry.$save(function(created_entry) {
            var promises = [];
            angular.forEach($scope.fields, function(field) {
                var answer = new Answer();
                answer.entry_field_id = field.id;
                answer.entry_id = created_entry.id;
                answer.content = $scope.newEntryAnswers[field.id];
                promises.push(answer.$save().$promise);
            });
            $q.all(promises).then(function() {
                $scope.newEntry = new Entry();
                $scope.newEntryAnswers = {};
                $scope.entryAdding = false;
                reloadEntries();
            }, errorCallback);
        }, function(resp) {
            $scope.errorMessage = resp.data.message;
        });
    };

    // Init
    $scope.entries = entriesResolved;
    $scope.fields = fieldsResolved;

    $scope.newEntry = new Entry();
    $scope.newEntryAnswers = {};
    $scope.today = new Date();

    $scope.$state = $state;
}])

.controller('DiaryChartCtrl', ['$scope', '$filter', 'Entry', function($scope, $filter, Entry) {
    var reloadCharts = function() {
        $scope.chartData = {};
        $scope.actualChartData = [];
        $scope.series = [];

        $scope.labels = _.map($scope.entries, function(entry) {
            return ($filter('date')(entry.date, 'dd', 'UTC') == 01 ? ($filter('date')(entry.date, 'MMMM', 'UTC') + ' ') : '') + $filter('date')(entry.date, 'dd', 'UTC');
        });

        angular.forEach($scope.chartableFields, function(field) {
            var data = _.map($scope.entries, function(entry) {
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

    $scope.chartableFields = _.filter($scope.fields, function(field) {
        return field.type != 1;
    });
    reloadCharts();
}])

.controller('DiaryListCtrl', function() {})

;
