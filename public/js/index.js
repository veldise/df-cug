/**
*
*/
(function (angular) {
    'use strict';

    angular.module('dnfCugApp', [
        'ngRoute', 'ngCookies',
        'ui.bootstrap', 'myTable'
    ])
    .config(['$logProvider', function ($logProvider) {
        // disable debug level messages
        $logProvider.debugEnabled(false);
    }])
    .controller('NavbarCtrl', ['$scope', '$http', function ($scope, $http) {
        $http.get('/server/version')
            .success(function (data) {
                $scope.version = data.split('-')[0];
            });
    }])
    .controller('MemberListCtrl', ['$scope', '$http', '$location', '$cookies', function ($scope, $http, $location, $cookies) {
        $scope.sep = '/';
        $scope.postno = $location.search().postno || $cookies.postno || 47961;

        $scope.globalConfig = {
            itemsByPage: 10
        };

        $scope.columnMatchup = [
            { title: '캐릭터명', field: 'charName', sortPredicate: function (dataRow) { return dataRow.charName; } },
            { title: '커그닉', field: 'cugName' }
        ];
        $scope.rowMatchup = [];

        $scope.columnMembers = [
            { title: '작성자', field: 'writer' },
            { title: '커그닉', field: 'cugName' },
            { title: '캐릭터명', field: 'chars' },
            { title: '캐릭터 수', field: 'charLen' },
            { title: '등급', field: 'rank' }
        ];
        $scope.rowMembers = [];

        $scope.columnWrongs = [
            { title: '작성자', field: 'writer' },
            { title: '댓글', field: 'comments' }
        ];
        $scope.rowWrongs = [];

        $scope.reqData = function () {
            var postno = $scope.postno,
                sep = $scope.sep;

            $scope.loading = true;

            $cookies.postno = postno;
            $http.get('/users/' + postno)//, { params: { sep: sep } })
                .success(function (data) {
                    $scope.rowMatchup = data.matchup.sort(function (l, r) {
                        if (l.charName < r.charName) { return -1; }
                        if (l.charName > r.charName) { return 1; }
                        return 0;
                    });
                    $scope.rowMembers = data.members.sort(function (l, r) {
                        if (l.rank < r.rank) { return -1; }
                        if (l.rank > r.rank) { return 1; }
                        return 0;
                    });
                    $scope.rowWrongs = data.wrongs;
                    $scope.total = data.total;

                    $scope.loading = false;
                })
                .error(function (data) {
                    alert(data || 'timeout!!');
                });
        };

        // run
        $scope.reqData();
    }]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'dnfCugApp' ]);
    });
})(angular);
