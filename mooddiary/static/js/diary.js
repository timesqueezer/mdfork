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
            }]
        }
    })

        .state('diary.list', {
            url: '/list',
            templateUrl: '/templates/diaryList',
            controller: 'DiaryListCtrl',
            resolve: {
                entriesResolved: ['Entry', function(Entry) {
                    return Entry.query({sort_by: 'date', order: 'desc'}).$promise;
                }]
            }
        })

        .state('diary.table', {
            url: '/table',
            templateUrl: '/templates/diaryTable',
            controller: 'DiaryListCtrl',
            resolve: {
                entriesResolved: ['Entry', function(Entry) {
                    return Entry.query({sort_by: 'date', order: 'desc'}).$promise;
                }]
            }
        })

        .state('diary.chart', {
            url: '/chart',
            templateUrl: '/templates/diaryChart',
            controller: 'DiaryChartCtrl',
            resolve: {
                entriesResolved: ['Entry', function(Entry) {
                    return Entry.query({sort_by: 'date', order: 'asc'}).$promise;
                }]
            }
        })

}])



.controller('DiaryCtrl', ['$scope', '$q', '$state', '$alert', 'fieldsResolved', 'Field', 'Entry', 'Answer', function($scope, $q, $state, $alert, fieldsResolved, entriesResolved, Field, Entry, Answer) {

    var errorCallback = $scope.errorCallback = function(data) {
        console.error(data);
    };

    var checkIfEntryAddedToday = function(entries) {
        var today = new Date();

        var entry = _.filter(entries, function(entry) {

        })
    };

    var reloadEntries = $scope.reloadEntries = function() {
        return $q(function(resolve, reject) {
            Entry.query(function(data) {
                $scope.entries = data;
                resolve();
            }, reject);

        });
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
    $scope.fields = fieldsResolved;

    $scope.newEntry = new Entry();
    $scope.newEntryAnswers = {};
    $scope.newEntry.date = new Date();

    $scope.$state = $state;
}])

.controller('DiaryChartCtrl', ['$scope', '$filter', 'Entry', 'entriesResolved', function($scope, $filter, Entry, entriesResolved) {
    Chart.defaults.global.scaleBeginAtZero = true;
    Chart.defaults.global.colours = [
        '#0a80ba',
        '#F7464A', // red
        '#39BF71', // green
        '#FDB45C', // yellow
        '#4D5360',  // dark grey
        '#460793',
        '#390DFA',
        '#cc3f1a'
    ];
    Chart.defaults.global.tooltipTitleFontFamily = "'Josefin Sans', 'Roboto', 'Arial', sans-serif";
    $scope.chartOptions = {
        bezierCurveTension : 0.25,
        datasetStrokeWidth : 1,
        pointDotRadius: 4,
    };
    $scope.buttonStyles = {};

    var getChartLabel = function(date) {
        return ($filter('date')(date, 'dd', 'UTC') == 01 ? ($filter('date')(date, 'MMMM', 'UTC') + ' ') : '') + $filter('date')(date, 'dd', 'UTC');
    };

    var reloadCharts = function() {
        $scope.labels = _.map($scope.entries, function(entry) {
            if ($scope.timeLimit == '1.w') {
                var scale = 1;
            } else if ($scope.timeLimit == '2.w') {
                var scale = 2;
            } else if ($scope.timeLimit == '1.m') {
                var scale = 4;
            } else if ($scope.timeLimit == '2.m') {
                var scale = 8;
            } else if ($scope.timeLimit == '4.m') {
                var scale = 8;
            } else {
                var scale = 10;
            }
            if ($scope.entries.indexOf(entry) % scale == 0) {
                return getChartLabel(entry.date);
            } else {
                return "";
            }
        });

        $scope.actualChartData = [];

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
            angular.forEach($scope.series, function(field_name) {
                if (field.name == field_name)
                    $scope.actualChartData.push($scope.chartData[field.id]);
            });
        });
    };

    var getStyle = function(color) {
        var bigint = parseInt(color.slice(1), 16),
        r = ( (bigint >> 16) & 255 ) / 255,
        g = ( (bigint >> 8) & 255 ) / 255,
        b = ( bigint & 255 ) / 255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        l = ( max + min ) / 2;

        var style = {'background-color': color};
        if (l < 0.65) {
            style.color = '#FFFFFF';
        }
        return style;
    };

    $scope.toggleChartField = function(field) {
        if ($scope.series.indexOf(field.name) == -1) {
            $scope.series.push(field.name);
            $scope.actualChartData.push($scope.chartData[field.id]);
            var style = getStyle(Chart.defaults.global.colours[$scope.series.length-1]);
            $scope.buttonStyles[field.id] = style;
        } else {
            $scope.series.splice($scope.series.indexOf(field.name), 1);
            $scope.actualChartData.splice($scope.actualChartData.indexOf($scope.chartData[field.id]), 1);
            delete $scope.buttonStyles[field.id];
        }
    };

    $scope.$watch('timeLimit', function(old_values, new_values) {
        if (old_values == new_values)
            return;
        if ($scope.timeLimit == '0.a') {
            $scope.reloadEntries().then(reloadCharts, $scope.errorCallback);
        } else {
            Entry.query({timespan: $scope.timeLimit}, function(data) {
                $scope.entries = data;
                reloadCharts();
            }, $scope.errorCallback);
        }
        /*
            $scope.entries = data;
            reloadCharts();
        });*/
    });

    // Init

    $scope.chartableFields = _.filter($scope.fields, function(field) {
        return field.type != 1;
    });

    $scope.entries = entriesResolved;
    $scope.activeFields = {};
    $scope.chartData = {};
    $scope.actualChartData = [];
    $scope.series = [];

    reloadCharts();
}])

.controller('DiaryListCtrl', ['$scope', 'Answer', '$alert', 'entriesResolved', function($scope, Answer, $alert, entriesResolved) {
    $scope.activeFields = {};
    angular.forEach($scope.fields, function(field) { $scope.activeFields[field.id] = true; });
    $scope.editField = {};
    $scope.editEntry = {};

    $scope.saveEntry = function(entry) {
        entry.$save(function() {
            $scope.editEntry[entry.id] = false;
        }, function(error) {
            $alert({content: error.data.message});
        });
    };

    $scope.startEditField = function(entry, field) {
        $scope.answer = _.findWhere(entry.answers, {entry_field_id: field.id});
        $scope.editAnswer = Answer.get({answerId: $scope.answer.id}, function() {
            $scope.editAnswer.tmpContent = $scope.getAnswerForField(entry, field);

            $scope.editField[entry.id][field.id] = true;
        });
    };

    $scope.editFieldAnswer = function(entry, field) {
        $scope.editAnswer.content = $scope.editAnswer.tmpContent;
        $scope.answer.content = $scope.editAnswer.tmpContent;
        $scope.editAnswer.$save().then(function() {
            $scope.editField[entry.id][field.id] = false;
        });
    };
    // Init

    $scope.entries = entriesResolved;
}])

;
