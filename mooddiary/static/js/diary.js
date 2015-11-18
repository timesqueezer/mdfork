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

.controller('DiaryChartCtrl', ['$scope', '$filter', 'Me', 'entriesResolved', 'locale', function($scope, $filter, Me, entriesResolved, locale) {
    var isMobile = false; //initiate as false
    // device detection
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;
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

    var reloadCharts = function() {
        if ($scope.timeLimit == '1.w' || $scope.entries.length < 10) {
            $scope.chartOptions.pointDotRadius = 4;
        } else if ($scope.timeLimit == '2.w') {
            $scope.chartOptions.pointDotRadius = 3;
        } else if ($scope.timeLimit == '1.m') {
            $scope.chartOptions.pointDotRadius = 2;
        } else if ($scope.timeLimit == '2.m') {
            $scope.chartOptions.pointDotRadius = 0;
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
                dataset.strokeColor = Chart.defaults.global.colours[$scope.series.indexOf(field.name)];
                dataset.fillColor = rgba(hexToRgb(Chart.defaults.global.colours[$scope.series.indexOf(field.name)].substr(1)), 0.15);
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
            if (isMobile) {
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
        if ($scope.series.indexOf(field.name) == -1) {
            $scope.series.push(field.name);
            var style = getStyle(Chart.defaults.global.colours[$scope.series.length-1]);
            $scope.buttonStyles[field.id] = style;
            $scope.activeFieldIds.push(field.id);
        } else {
            $scope.series.splice($scope.series.indexOf(field.name), 1);
            $scope.activeFieldIds.splice($scope.activeFieldIds.indexOf(field.id), 1);
            angular.forEach($scope.activeFieldIds, function(fieldId) {
                $scope.buttonStyles[fieldId] = getStyle(Chart.defaults.global.colours[$scope.activeFieldIds.indexOf(fieldId)]);
            });
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
    $scope.activeFieldIds = []; // Keep track of the order in which fields are activated
    $scope.series = [];

    $scope.toggleChartField($scope.fields[0]);
    $scope.activeFields[$scope.fields[0].id] = true;

    angular.element(document).ready(function() {
        reloadCharts();
    });
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
        $scope.editAnswer.content = $scope.editAnswer.tmpContent.toString();
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

    $scope.deleteEntry = function(entry) {
        if (confirm('Bist du dir sicher?')) {
            entry.$destroy();
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
