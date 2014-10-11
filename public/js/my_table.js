/**
*
*/
var myTableApp = angular.module('myTable', [ 'ngTable' ]);

myTableApp
.config(['$compileProvider', function ($compileProvider) {
    // allow data links (for export to csv)
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
}])
.directive('myTable', ['ngTableParams', '$filter', '$compile', function myTable (ngTableParams, $filter, $compile) {
    /**
    *   functions
    */
    var generateCols = function (rows) {
        if (!rows.length || !_.isObject(rows[0])) {
            return [];
        }

        return _.map(_.keys(rows[0]), function (key) {
            return { title: key, field: key };
        });
    };
    var configure = function (conf) {
        conf.pagination = (conf.pagination === undefined) || (conf.pagination.toString() !== 'false');
        if (conf.selectionMode !== 'multiple') {
            conf.selectionCheckbox = false;
        }
        conf.itemsByPage = conf.itemsByPage || 10;
        conf.truncateLength = conf.truncateLength || 100;

        return conf;
    };
    var fill = function (data, key, value) {
        for (var i=0, l=data.length; i<l; i++) {
            data[i][key] = value;
        }
    };

    return {
        templateUrl: '/template/my-table.html',
        replace: true,
        restrict: 'E',
        scope: {
            rows: '=',
            cols: '=?',
            config: '=?',
            filter: '=?',
            csv: '=?exportToCsv'
        },
        compile: function (tElement) {
            var headerTemplate = tElement.find('thead')[0].innerHTML;

            return function postlink ($scope, iElement, iAttrs, controller) {
                $scope.userScope = $scope.$parent;
                /**
                *
                */
                var getData = function() {
                    var filterText = $scope.filter;
                    if (filterText) {
                        return _.filter($scope.rows, function (row) {
                            return (_.values(row).join('').indexOf(filterText) !== -1);
                        });
                    }

                    return $scope.rows;
                };
                /**
                *   variables
                */
                $scope.rows = $scope.rows || [];
                $scope.cols = $scope.cols || generateCols($scope.rows);
                $scope.config = $scope.config || {};

                var config = configure($scope.config);
                /**
                *   watch
                */
                $scope.$watch('rows', function (newValue) {
                    if (!$scope.cols.length) {
                        $scope.cols = generateCols(newValue);
                    }
                    $scope.tableParams.reload();
                });
                $scope.$watch('config', function () {
                    config = configure($scope.config);
                });
                $scope.$watch('filter', function () {
                    $scope.tableParams.reload();
                });
                $scope.$watch('csv', function (newVal) {
                    if (!newVal || !_.keys(newVal).length) {
                        $scope.csv = {
                            csvData: '',
                            generate: function () {
                                var colDelim = '","';
                                var rowDelim = '"\n"';

                                var titles = _.pluck($scope.cols, 'title');
                                var fields = _.pluck($scope.cols, 'field');

                                var strHead = titles.join(colDelim);
                                var strBody = _.map(getData(), function (row) {
                                    return _.map(fields, function (field) {
                                        return row[field];
                                    }).join(colDelim);
                                }).join(rowDelim);

                                this.csvData = [ '"', strHead, rowDelim, strBody, '"' ].join('');
                            },
                            link: function () {
                                return 'data:text/csv;charset=UTF-8,' + encodeURIComponent(this.csvData);
                            }
                        };
                    }
                });
                /**
                *   ngTableParams
                */
                var currPage = 1;
                var params = {
                    page: 1,                    // show first page
                    count: config.itemsByPage,  // count per page
                    // sorting: {
                    //     name: 'asc'     // initial sorting
                    // }
                };
                var settings = {
                    total: getData().length,    // length of data
                    counts: [],                 // change count btns
                    getData: function($defer, params) {
                        var filteredData = getData();
                        var orderedData = (_.keys(params.sorting()).length) ?
                                $filter('orderBy')(filteredData, params.orderBy()) :
                                filteredData;

                        // set params
                        if (!config.pagination) {
                            // What does it mean to count????
                            // case) orderedData.length === 1, params.count(1) ->$data is empty.
                            // params.count(orderedData.length);
                            params.count(orderedData.length+1);
                        }
                        params.total(orderedData.length); // set total for recalc pagination

                        // return data
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));

                        // fire event
                        if (currPage !== params.page()) {
                            currPage = params.page();
                            $scope.$emit('paginationChange', currPage);
                        }
                    },
                    $scope: { $data: {} }
                };

                if (!config.pagination) {
                    params.count = getData().length;
                    settings.total = 1;
                }

                $scope.tableParams = new ngTableParams(params, settings);
                /**
                *   row classing
                */
                var classRow = '{ selected: row.isSelected }';
                if (config.ngClassRow) {
                    classRow = classRow.replace(' }', ', ') + config.ngClassRow.replace('{ ', '');
                }
                config.ngClassRow = classRow;
                /**
                *   Select - checkbox & click
                */
                var fireSelected = function (data) {
                    // fire event
                    var selItems = _.where(data, { isSelected: true });
                    var deselItems = _.difference(data, selItems);

                    $scope.$emit('selected', selItems);
                    $scope.$emit('deselected', deselItems);
                };
                $scope.selectAll = function () {
                    fill(getData(), 'isSelected', true);
                };
                $scope.deselectAll = function () {
                    fill(getData(), 'isSelected', false);
                };
                $scope.isAllSelected = function () {
                    var data = getData();

                    return data.length && _.every(data, function (item) {
                        return item.isSelected;
                    });
                };
                $scope.toggleAll = function () {
                    var data = getData();

                    fill(data, 'isSelected', !($scope.isAllSelected()));
                    fireSelected(data);
                };
                $scope.toggle = function (rowIdx, row, colIdx, col) {
                    var mode = config.selectionMode;

                    if (!mode || mode === 'none') {
                        return;
                    }
                    if (mode === 'single' && !row.isSelected) {
                        $scope.deselectAll();
                    }

                    row.isSelected = !row.isSelected;
                    $scope.$emit('selectionChange', row, rowIdx, col, colIdx);

                    if (mode === 'multiple') {
                        fireSelected(getData());
                    }
                };
                /**
                *   Etc
                */
                // thead reconstruction
                iElement.find('thead').remove();
                var $thead = angular.element('<thead/>').html(headerTemplate);
                $compile($thead.contents())($scope);
                iElement.children('table').prepend($thead);

                return iElement;
            };
        }
    }; // end return
}]) // end directive('myTable')
.directive('myTableTd', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function ($scope, iElement, iAttrs, controller) {
            $scope.$watch('col.format', function (newVal) {
                if (newVal) {
                    iElement.html(newVal($scope.value, $scope.row));
                    $compile(iElement.contents())($scope.userScope);
                }
            });
            $scope.$watch('col.click', function (newVal) {
                if (newVal) {
                    iElement.unbind('click');
                    iElement.click(function (e) {
                        newVal(e, $scope.value, $scope.row);
                    });
                }
            });
        }
    };
}]); // end directive('myTableTd')

// addClass 'active' to pagination...
myTableApp.run(['$templateCache', function ($templateCache) {
    var template = $templateCache.get('ng-table/pager.html');
    $templateCache.put('ng-table/pager.html',
        template.replace('ng-class="{\'disabled\': !page.active}"', 'ng-class="{\'disabled\': !page.active, active: (page.number===params.page()) && (page.type===\'page\' || page.type===\'first\' || page.type===\'last\')}"'));
}]);
