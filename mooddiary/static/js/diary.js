angular.module('mooddiary.diary', [
    'mooddiary.utils'
])

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
            fieldsResolved: ['Me', function(Me) {
                return Me.fields.$refresh().$asPromise();
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
            controller: 'DiaryChartCtrl',
            resolve: {
                entriesResolved: ['Me', function(Me) {
                    return Me.entries.$refresh({sort_by: 'date', order: 'asc'}).$asPromise();
                }]
            }
        })

}])



.controller('DiaryCtrl', ['$scope', '$q', '$state', '$alert', 'fieldsResolved', 'Me', function($scope, $q, $state, $alert, fieldsResolved, Me) {

    var errorCallback = $scope.errorCallback = function(data) {
        console.error(data);
    };

    var checkIfEntryAddedToday = function(entries) {
        var today = new Date();

        var entry = _.filter(entries, function(entry) {

        })
    };

    var reloadEntries = $scope.reloadEntries = function() {
        if ($state.includes('diary.chart')) {
            var args = {sort_by: 'date', order: 'asc'};
        } else {
            var args = {sort_by: 'date', order: 'desc'};
        }
        return $q(function(resolve, reject) {
            Me.entries.$refresh(args).$then(function(data) {
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
        $scope.newEntry.$save().$then(function(created_entry) {
            $scope.entryAdding = false;
            var promises = [];
            angular.forEach($scope.fields, function(field) {
                var answer = created_entry.answers.$build();
                answer.entry_field_id = field.id;
                answer.entry_id = created_entry.id;
                if (field.type == 1 && !$scope.newEntryAnswers[field.id])
                    answer.content = '';
                else if (field.type == 3 && !$scope.newEntryAnswers[field.id])
                    answer.content = '0';
                else
                    answer.content = $scope.newEntryAnswers[field.id];
                promises.push(answer.$save().$asPromise());
            });
            $q.all(promises).then(function() {
                $scope.newEntry = Me.entries.$build();
                $scope.newEntryAnswers = {};
                $scope.newEntry.date = new Date();
                reloadEntries().then(function() {
                    if ($state.includes('diary.chart')) {
                        $scope.$broadcast('reloadCharts');
                    }
                });
            }, errorCallback);
        }, function(resp) {
            $alert({content: resp.$response.data.message});
        });
    };

    // Init
    $scope.fields = fieldsResolved;

    $scope.newEntry = Me.entries.$build();
    $scope.newEntryAnswers = {};
    $scope.newEntry.date = new Date();

    $scope.$state = $state;
}])

.controller('DiaryChartCtrl', ['$scope', '$filter', 'Me', 'entriesResolved', function($scope, $filter, Me, entriesResolved) {
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
        animation : false,
        animationSteps: 10
    };
    $scope.buttonStyles = {};

    var getChartLabel = function(entry, scale) {
        if ($filter('date')(entry.date, 'dd', 'UTC') == 01) {
            return $filter('date')(entry.date, 'MMM', 'UTC') + ' 01';
        }
        if ($scope.entries.indexOf(entry) % scale == 0) {
            return $filter('date')(entry.date, 'dd', 'UTC');
        } else {
            return '';
        }
    };

    var reloadCharts = function() {
        if ($scope.timeLimit == '1.w' || $scope.entries.length < 10) {
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
        $scope.labels = _.map($scope.entries, function(entry) {
            return getChartLabel(entry, scale);
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
        l = ( max + min ) / 2; // calculate brightness

        var style = {'background-color': color};
        if (l < 0.65) {
            style.color = '#FFFFFF';
        }
        return style;
    };

    $scope.$on('reloadCharts', reloadCharts);

    $scope.toggleChartField = function(field) {
        if ($scope.series.indexOf(field.name) == -1) {
            $scope.series.push(field.name);
            $scope.actualChartData.push($scope.chartData[field.id]);
            var style = getStyle(Chart.defaults.global.colours[$scope.series.length-1]);
            $scope.buttonStyles[field.id] = style;
            $scope.activeFieldIds.push(field.id);
        } else {
            $scope.series.splice($scope.series.indexOf(field.name), 1);
            $scope.activeFieldIds.splice($scope.activeFieldIds.indexOf(field.id), 1);
            angular.forEach($scope.activeFieldIds, function(fieldId) {
                $scope.buttonStyles[fieldId] = getStyle(Chart.defaults.global.colours[$scope.activeFieldIds.indexOf(fieldId)]);
            });
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
            Me.entries.$refresh({timespan: $scope.timeLimit}).$then(function(data) {
                $scope.entries = data;
                reloadCharts();
            }, $scope.errorCallback);
        }
    });

    // Init

    $scope.chartableFields = _.filter($scope.fields, function(field) {
        return field.type != 1;
    });

    $scope.entries = entriesResolved;
    $scope.activeFields = {};
    $scope.activeFieldIds = []; // Keep track of the order in which fields are activated
    $scope.chartData = {};
    $scope.actualChartData = [];
    $scope.series = [];

    reloadCharts();
    $scope.toggleChartField($scope.fields[0]);
    $scope.activeFields[$scope.fields[0].id] = true;
}])

.controller('DiaryListCtrl', ['$scope', '$state', 'Answer', '$alert', function($scope, $state, Answer, $alert) {
    $scope.args = {sort_by: 'date', order: 'desc', page: 1};

    $scope.loadMore = function() {
        $scope.args.page += 1;
        $scope.stopScroll = true;
        $scope.entries.$fetch($scope.args).$then(function() { $scope.stopScroll = false; }, function() {
            $scope.stopScroll = true;
        });
    };

    $scope.reloadList = function() {
        $scope.activeFieldsList = _.filter($scope.fields, function(field) { return $scope.activeFields[field.id]; });
    };

    $scope.saveEntry = function(entry) {
        entry.$save(['date']).$then(function() {
            $scope.editEntry[entry.id] = false;
        }, function(error) {
            $alert({content: error.$response.data.message});
        });
    };

    $scope.startEditField = function(entry, field) {
        $scope.answer = _.findWhere(entry.answers, {entry_field_id: field.id});
        if ($scope.answer) {
            Answer.$find($scope.answer.id).$then(function(answer) {
                $scope.editAnswer = answer;
                $scope.editAnswer.tmpContent = $scope.getAnswerForField(entry, field);

                $scope.editField[entry.id][field.id] = true;
            });
        } else {
            $scope.editAnswer = $scope.answer = entry.answers.$build({entry_field_id: field.id});
            $scope.editField[entry.id][field.id] = true;
        }
    };

    $scope.editFieldAnswer = function(entry, field) {
        $scope.editAnswer.content = $scope.editAnswer.tmpContent;
        $scope.answer.content = $scope.editAnswer.tmpContent;
        if ($scope.editAnswer.id) {
            $scope.editAnswer.$save(['content']).$then(function() {
                $scope.editField[entry.id][field.id] = false;
            });
        } else {
            $scope.editAnswer.$save().$then(function() {
                $scope.editField[entry.id][field.id] = false;
            });
        }
    };
    // Init

    $scope.activeFields = {};
    angular.forEach($scope.fields, function(field) { $scope.activeFields[field.id] = true; });
    $scope.editField = {};
    $scope.editEntry = {};

    $scope.entries = $scope.me.entries.$refresh($scope.args);
    $scope.activeFieldsList = $scope.fields;
}])

;
