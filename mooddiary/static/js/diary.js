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
                return Me.fields.$resolve().$asPromise().then(function(fields) {
                    if (Me.use_colors) {
                        return _.map(fields, function(field) {
                            field.colorStyle = {'background-color': '#'+field.color, 'border-color': '#'+field.color};
                            field.colorStyleBorder = {'border-color': '#'+field.color, 'color': '#'+field.color};
                            var bigint = parseInt(field.color, 16),
                                r = (bigint >> 16) & 255,
                                g = (bigint >> 8) & 255,
                                b = bigint & 255;
                            field.colorStyleRGBA = {'background-color': 'rgba('+r+','+g+','+b+', 0.2)'};
                            field.colorStyleInput = {'background-color': 'rgba('+r+','+g+','+b+', 0.9)', 'padding': '5px', 'border-radius': '5px', 'color': '#FFF'};
                            return field;
                        });
                    } else {
                        return fields;
                    }
                });
            }]
        }
    })

        .state('diary.list', {
            url: '/list',
            templateUrl: '/templates/diaryList',
            controller: 'DiaryListCtrl',
            resolve: {
                'firstPage': ['Me', '$q', function(Me, $q) {
                    if (Me.entries.length > 0) {
                        return $q.when(true);
                    } else {
                        return Me.entries.$resolve({'page': 1, 'per_page': 2, sort_by: 'date', order: 'desc'}).$asPromise();
                    }
                }]
            }
        })

        .state('diary.table', {
            url: '/table',
            templateUrl: '/templates/diaryTable',
            controller: 'DiaryListCtrl',
            resolve: {
                'firstPage': ['Me', '$q', function(Me, $q) {
                    if (Me.entries.length > 0) {
                        return $q.when(true);
                    } else {
                        return Me.entries.$resolve({'page': 1, 'per_page': 12, sort_by: 'date', order: 'desc'}).$asPromise();
                    }
                }]
            }
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

    $scope.sortAnswers = function(entries) {
        var promiseList = [];
        angular.forEach(entries, function(entry) {
            if (!entry.answersSorted || !entry.answersSorted.length) {
                promiseList.push($q(function(resolve, reject) {
                    var promise = entry.answers.length ? $q.when(true) : entry.answers.$resolve().$asPromise();
                    promise.then(function() {
                        entry.answersSorted = {};
                        angular.forEach(entry.answers, function(answer) {
                            entry.answersSorted[answer.entry_field_id] = answer;
                        });
                        resolve();
                    }, reject);
                }));
            }
        });
        return $q.all(promiseList);
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

            created_entry.answersSorted = {};
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
                promises.push(answer.$save().$asPromise().then(function(answer) {
                    created_entry.answersSorted[field.id] = answer;
                }));
            });
            $q.all(promises).then(function() {
                $scope.newEntry = Me.entries.$build();
                $scope.newEntryAnswers = {};
                $scope.newEntry.date = new Date();
                if ($state.includes('diary.chart')) {
                    $scope.$broadcast('reloadCharts');
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

.controller('DiaryChartCtrl',
['$scope', '$rootScope', '$filter', 'Me', 'entriesResolved', 'locale', '$timeout', '$window',
function($scope, $rootScope, $filter, Me, entriesResolved, locale, $timeout, $window) {
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
        if ($scope.timeLimit == '1.w' || Me.entries.length < 10) {
            $scope.chartOptions.pointDotRadius = 4;
        } else if ($scope.timeLimit == '2.w') {
            $scope.chartOptions.pointDotRadius = 3;
        } else if ($scope.timeLimit == '1.m') {
            $scope.chartOptions.pointDotRadius = 2;
        } else if ($scope.timeLimit == '2.m') {
            $scope.chartOptions.pointDotRadius = $rootScope.isMobile ? 0: 2;
        } else if ($scope.timeLimit == '4.m') {
            $scope.chartOptions.pointDotRadius = 0;
        } else {
            $scope.chartOptions.pointDotRadius = Me.entries.length > 14 ? Me.entries.length > 28 ? 0 : 1 : 2;
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
                angular.forEach(Me.entries, function(entry) {
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
        $timeout(function() {
            $scope.entriesLoading = !$scope.dontSetLoading;
        }, 400);
        $scope.dontSetLoading = false;
        Me.entries.$refresh({timespan: $scope.timeLimit, sort_by: 'date', order: 'asc'}).$then(function(data) {
            $scope.dontSetLoading = true;
            reloadCharts();
            $scope.entriesLoading = false;
        }, function() {
            $scope.errorCallback();
            $scope.entriesLoading = false;
        });
    });

    $scope.$watch('chartTheme', function(value) {
        if (value) {
            $scope.chartOptions.scaleFontColor = '#eee';
            $scope.chartOptions.datasetPointStrokeColor = '#333';
            $scope.chartOptions.scaleGridLineColor = 'rgba(255,255,255,0.05)';
            $scope.chartOptions.backgroundColor = '#111';
            $scope.chartPanelStyle = {'background-color': '#111'};
        } else {
            delete $scope.chartOptions.scaleFontColor;
            delete $scope.chartOptions.datasetPointStrokeColor;
            delete $scope.chartOptions.scaleGridLineColor;
            delete $scope.chartOptions.backgroundColor;
            $scope.chartPanelStyle = {};
        }
        reloadCharts();
    });

    $scope.export = function() {
        $window.open(document.getElementById('theCanvas').toDataURL('image/png'), '_blank');
        /*var canvasElement = document.getElementById('theCanvas');

        var MIME_TYPE = "image/png";

        var imgURL = canvasElement.toDataURL(MIME_TYPE);

        var dlLink = document.createElement('a');
        dlLink.download = 'export';
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);*/
    };

    $scope.$on('reloadCharts', reloadCharts);

    // Init

    $scope.chartableFields = _.filter($scope.fields, function(field) {
        return field.type != 1;
    });

    $scope.activeFields = {};

    $scope.activeFields[$scope.fields[0].id] = true;
    $scope.toggleChartField($scope.fields[0]);

    angular.element(document).ready(function() {
        $scope.timeLimit = '2.w';
        reloadCharts();
    });
}])

.controller('DiaryListCtrl', ['$scope', '$rootScope', '$state', 'Answer', '$alert', 'Me', 'firstPage', 'locale', '$q', function($scope, $rootScope, $state, Answer, $alert, Me, firstPage, locale, $q) {
    $scope.loadMore = function() {
        $scope.reloadCount += 1;
        $scope.listLimit += $scope.args.page == 1 && $state.includes('diary.list') ? 0 : $scope.args.per_page;
        $scope.args.page += 1;
        if (Me.entries.length < ($scope.args.page * $scope.args.per_page) ) {
            $scope.stopScroll = true;
            var lastLength = Me.entries.length;
            Me.entries.$fetch($scope.args).$then(function(entries) {
                var newEntries = entries.slice(lastLength);
                $scope.stopScroll = newEntries.length == 0;
                // Sort and load answers
                $scope.sortAnswers(newEntries);
                if ($rootScope.isMobile) {
                    angular.forEach(newEntries, function(entry) {
                        $scope.entryHidden[entry.id] = true;
                    });
                }
             }, function() {
                $scope.stopScroll = true;
            });
        }
    };

    $scope.reloadList = function() {
        $scope.activeFieldsList = _.filter($scope.fields, function(field) { return $scope.activeFields[field.id]; });
    };

    $scope.saveEntry = function(entry) {
        $scope.saving = true;
        var promises = [];
        for (i in entry.answersSorted) {
            entry.answersSorted[i].content = entry.answersSorted[i].content.toString();
            if (entry.answersSorted[i].id) {
                promises.push(entry.answersSorted[i].$save(['content']).$asPromise());
            } else {
                promises.push(entry.answersSorted[i].$save().$asPromise());
            }
        }
        $q.all(promises).then(function() {
            $alert({content: locale.getString('common.save')});
            entry.$save(['date']).$then(function() {
                $scope.edittingEntry[entry.id] = false;
                $scope.saving = false;
            }, function(error) {
                $scope.edittingEntry[entry.id] = false;
                $scope.saving = false;
                $alert({content: error.$response.data.message});
            });
        });
    };

    $scope.editEntry = function(entry) {
        angular.forEach($scope.fields, function(field) {
            var answer = entry.answersSorted[field.id];
            if (answer) {
                if (field.type == 3) {
                    answer.content = parseInt(answer.content);
                }
            } else {
                entry.answersSorted[field.id] = entry.answers.$build({entry_field_id: field.id});
            }
        });
        $scope.edittingEntry[entry.id] = true;
    };

    $scope.deleteEntry = function(entry) {
        if (confirm('Bist du dir sicher?')) {
            entry.$destroy();
        }
    };

    $scope.toggleEntry = function(entry) {
        $scope.entryHidden[entry.id] = !$scope.entryHidden[entry.id];
    };

    $scope.getProgressBarStyle = function(entry, field) {
        return $.extend({width: entry.answersSorted[field.id].content * 10 + '%'}, field.colorStyle);
    };
    // Init
    $scope.args = {sort_by: 'date', order: 'desc', page: 1}; // Page actually starts at 2

    if ($rootScope.isMobile) {
        $('#fieldListToggle').collapse();
    }
    if ($state.includes('diary.list')) {
        $scope.args.per_page = 2;
        $scope.listLimit = 2;
    } else {
        $scope.args.per_page = 12;
        $scope.listLimit = 12;
    }

    $scope.activeFields = {};
    angular.forEach($scope.fields, function(field) { $scope.activeFields[field.id] = true; });
    $scope.edittingEntry = {};
    $scope.entryHidden = {};
    $scope.reloadCount = 0;
    $scope.stopScroll = true;
    if (firstPage.length > 0) {
        $scope.sortAnswers(Me.entries).then(function() {
            $scope.stopScroll = false;
        });
    }

    $scope.activeFieldsList = $scope.fields;
}])

;
