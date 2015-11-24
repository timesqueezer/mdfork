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
                    return Me.entries.$refresh({sort_by: 'date', order: 'asc', timespan: '2.w'}).$asPromise();
                }]
            }
        })

}])



.controller('DiaryCtrl', ['$scope', '$q', 'smoothScroll', '$state', '$alert', 'fieldsResolved', 'Me', function($scope, $q, smoothScroll, $state, $alert, fieldsResolved, Me) {

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
        } else if ($state.includes('diary.list')) {
            var args = {sort_by: 'date', order: 'desc', 'page': 1};
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

    $scope.showEntryAddContainer = function() {
        $scope.entryAdding = true;
        var elem = document.getElementById('AddEntry');
        smoothScroll(elem);
    };

    $scope.addEntry = function() {
        $scope.entrySaving = true;
        $scope.newEntry.$save().$then(function(created_entry) {
            $scope.entrySaving = false;
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
                else if (field.type != 1) {
                    answer.content = $scope.newEntryAnswers[field.id].toString();
                } else
                    answer.content = $scope.newEntryAnswers[field.id];
                promises.push(answer.$save().$asPromise());
            });
            $q.all(promises).then(function() {
                $scope.newEntry = Me.entries.$build();
                $scope.newEntryAnswers = {};
                $scope.newEntry.date = new Date();
                if ($state.includes('diary.chart')) {
                    reloadEntries().then(function() {
                        $scope.$broadcast('reloadCharts');
                    });
                }
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

.controller('DiaryChartCtrl', ['$scope', '$rootScope', '$filter', 'Me', 'entriesResolved', 'locale', function($scope, $rootScope, $filter, Me, entriesResolved, locale) {
    Chart.defaults.global.scaleBeginAtZero = true;

    $scope.chartOptions = {
        bezierCurveTension : 0.25,
        datasetStrokeWidth : 1,
        pointDotRadius: 4,
        animation : false,
        scaleType: 'date',
        emptyDataMessage: locale.getString('common.chart_empty_data_message'),
        scaleFontFamily: "'Josefin Sans'",
        tooltipFontFamily: "'Josefin Sans'",
        tooltipTemplate: "<%if (datasetLabel){%><%=datasetLabel%>: <%}%> <%=valueLabel%>",
        tooltipFontSize: 16,
        tooltipCornerRadius: 3,
        scaleOverride: true,
        scaleStepWidth: 1,
        scaleStartValue: 0,
    };
    $scope.buttonStyles = {};

    var hexToRgb = function(hex) {
        var bigint = parseInt(hex, 16),
            r = (bigint >> 16) & 255,
            g = (bigint >> 8) & 255,
            b = bigint & 255;

        return [r, g, b];
    };

    var rgba = function(colour, alpha) {
        return 'rgba(' + colour.concat(alpha).join(',') + ')';
    };

    var getStyle = function(color) {
        var bigint = parseInt(color, 16),
        r = ( (bigint >> 16) & 255 ) / 255,
        g = ( (bigint >> 8) & 255 ) / 255,
        b = ( bigint & 255 ) / 255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        l = ( max + min ) / 2; // calculate brightness

        var style = {'background-color': '#' + color};
        if (l < 0.65) {
            style.color = '#FFFFFF';
        }
        return style;
    };

    var reloadCharts = function() {
        if ($scope.timeLimit == '1.w' || $scope.entries.length < 10) {
            $scope.chartOptions.pointDotRadius = 4;
        } else if ($scope.timeLimit == '2.w') {
            $scope.chartOptions.pointDotRadius = 3;
        } else if ($scope.timeLimit == '1.m') {
            $scope.chartOptions.pointDotRadius = 2;
        } else if ($scope.timeLimit == '2.m') {
            $scope.chartOptions.pointDotRadius = $rootScope.isMobile ? 0: 1;
        } else if ($scope.timeLimit == '4.m') {
            $scope.chartOptions.pointDotRadius = 0;
        } else {
            $scope.chartOptions.pointDotRadius = $scope.entries.length > 14 ? $scope.entries.length > 28 ? 0 : 1 : 2;
        }

        $scope.data = [];
        var only_range = true;

        angular.forEach($scope.chartableFields, function(field) {
            if ($scope.activeFields[field.id]) {
                if (field.type == 3) only_range = false;

                var dataset = {label: field.name};
                dataset.strokeColor = '#' + field.color;
                dataset.fillColor = rgba(hexToRgb(field.color), 0.15);
                dataset.data = [];
                angular.forEach($scope.entries, function(entry) {
                    var answer = _.findWhere(entry.answers, {entry_field_id: field.id});
                    if (answer) {
                        var date = new Date(entry.date);
                        var dataPoint = {x: date};
                        dataPoint.y = parseInt(answer.content);
                        dataset.data.push(dataPoint);
                    }
                });
                $scope.data.push(dataset);
            }
        });

        if (only_range) {
            $scope.chartOptions.scaleSteps = 10;
            $scope.chartOptions.scaleStepWidth = 1;
        } else {
            var max_value = _.max(
                _.flatten(_.pluck($scope.data, 'data')
                ), function(point) {
                return point.y;
            }).y;
            var scale = 1;
            if ($rootScope.isMobile) {
                scale = Math.ceil(max_value / 10);
            } else if (max_value > 50) {
                scale = 5;
            } else if (max_value > 30) {
                scale = 2;
            } else if (max_value < 10) {
                $scope.chartOptions.scaleSteps = 10;
            } else {
                $scope.chartOptions.scaleSteps = max_value;
            }
            $scope.chartOptions.scaleStepWidth = scale;
            $scope.chartOptions.scaleSteps = Math.ceil(max_value / scale);
        }

        var ctx = document.getElementById('theCanvas').getContext('2d');
        new Chart(ctx).Scatter($scope.data, $scope.chartOptions);

    };

    $scope.toggleChartField = function(field) {
        if ($scope.activeFields[field.id]) { // Reverse-logic because ng-model already updated the object
            var style = getStyle(field.color);
            $scope.buttonStyles[field.id] = style;
        } else {
            delete $scope.buttonStyles[field.id];
        }
        reloadCharts();
    };

    $scope.$watch('timeLimit', function(old_values, new_values) {
        if (old_values == new_values)
            return;
        if ($scope.timeLimit == '0.a') {
            $scope.reloadEntries().then(reloadCharts, $scope.errorCallback);
        } else {
            Me.entries.$refresh({timespan: $scope.timeLimit, sort_by: 'date', order: 'asc'}).$then(function(data) {
                $scope.entries = data;
                reloadCharts();
            }, $scope.errorCallback);
        }
    });

    $scope.$on('reloadCharts', reloadCharts);

    // Init

    $scope.chartableFields = _.filter($scope.fields, function(field) {
        return field.type != 1;
    });

    $scope.entries = entriesResolved;
    $scope.activeFields = {};

    $scope.activeFields[$scope.fields[0].id] = true;
    $scope.toggleChartField($scope.fields[0]);

    angular.element(document).ready(function() {
        $scope.timeLimit = '2.w';
        reloadCharts();
    });
}])

.controller('DiaryListCtrl', ['$scope', '$rootScope', '$state', 'Answer', '$alert', 'Me', function($scope, $rootScope, $state, Answer, $alert, Me) {
    $scope.loadMore = function() {
        $scope.args.page += 1;
        $scope.stopScroll = true;
        var lastLength = Me.entries.length;
        Me.entries.$fetch($scope.args).$then(function(entries) {
            $scope.stopScroll = entries.length == 0 ? true : false;
            if ($rootScope.isMobile) {
                angular.forEach(entries.slice(lastLength), function(entry) {
                    $scope.entryHidden[entry.id] = true;
                });
            }
         }, function() {
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
            $scope.editAnswer = $scope.answer;
            $scope.editAnswer.tmpContent = $scope.getAnswerForField(entry, field);

            $scope.editField[entry.id][field.id] = true;
        } else {
            $scope.editAnswer = $scope.answer = entry.answers.$build({entry_field_id: field.id});
            $scope.editField[entry.id][field.id] = true;
        }
    };

    $scope.editFieldAnswer = function(entry, field) {
        $scope.editAnswer.content = $scope.editAnswer.tmpContent.toString();
        $scope.answer.content = $scope.editAnswer.tmpContent;
        $scope.editField[entry.id][field.id] = false;
        if ($scope.editAnswer.id) {
            $scope.editAnswer.$save(['content']);
        } else {
            $scope.editAnswer.$save();
        }
    };

    $scope.deleteEntry = function(entry) {
        if (confirm('Bist du dir sicher?')) {
            entry.$destroy();
        }
    };

    $scope.toggleEntry = function(entry) {
        $scope.entryHidden[entry.id] = !$scope.entryHidden[entry.id];
        console.log($scope.entryHidden[entry.id]);
    };
    // Init
    $scope.args = {sort_by: 'date', order: 'desc', page: 0};

    if ($rootScope.isMobile) {
        $('#fieldListToggle').collapse();
        $scope.args.per_page = 2;
    }

    $scope.activeFields = {};
    angular.forEach($scope.fields, function(field) { $scope.activeFields[field.id] = true; });
    $scope.editField = {};
    $scope.editEntry = {};
    $scope.entryHidden = {};

    //$scope.entries = $scope.me.entries.$collection();
    //$scope.loadMore();
    $scope.activeFieldsList = $scope.fields;
}])

;
