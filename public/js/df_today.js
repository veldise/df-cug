'use strict';

var dnfTodayApp = angular.module('dnfTodayApp', [
	'ngRoute', 'ngResource',
	'ui.bootstrap', 'myTable'
]);

dnfTodayApp.config(['$logProvider', function ($logProvider) {
    // disable debug level messages
    $logProvider.debugEnabled(false);
}]);

dnfTodayApp.controller('NavbarCtrl', ['$scope', '$http', function ($scope, $http) {
	$http.get('/server/version')
		.success(function (data, status) {
			$scope.version = data.split('-')[0];
		});
}]);

dnfTodayApp.factory('TodayFactory', ['$resource', function ($resource) {
	return $resource('/document/dftoday/:_id', {}, {
		read: { method: 'GET', isArray: true },
		create: { method: 'POST' },
		update: { method: 'PUT', params: { _id: '@_id' } },
		delete: { method: 'DELETE', params: { _id: '@_id' } }
	});
}]);

dnfTodayApp.controller('TodayListCtrl',
['$scope', '$http', 'TodayFactory', 
function ($scope, $http, TodayFactory) {
	var formatDate = function (date) {
		// 2014-01-28T15:00:00.000Z
		return date.slice(0, 10);
	};
	var formatDeleteBtn = function (col, row) {
		return [
			'<button class="btn" ng-click="setRow('+ JSON.stringify(row).split('"').join('\'') + ')">수정</button>',
			'<button class="btn" ng-click="deleteRow(\'' + row._id + '\')">삭제</button>'
		].join('');
	};
	
	$scope.column = [
		{ title: '일자', field: 'time', format: formatDate },
		{ title: '진고던', field: 'dungeon' },
		{ title: '등급', field: 'rating' },
		{ title: 'action', field: '', format: formatDeleteBtn }
	];
	$scope.rows = [];
	$scope.config = {
		itemsByPage: 10
	};

	$scope.getData = function () {
		$scope.loading = true;
		TodayFactory.read(function (data) {
			$scope.loading = false;

			$scope.rows = data;
		}, function (httpResponse) {
			alert(httpResponse.data || 'timeout!!');
		});
	};
	$scope.setRow = function (row) {
		$scope.time = row.time;
		$scope.dungeon = row.dungeon;
		$scope.rating = row.rating;
		
		$scope.currId = row._id;
	};
	$scope.createRow = function (time, dungeon, rating) {
		var data = {
			time: time,
			dungeon: dungeon,
			rating: rating
		};

		$scope.loading = true;
		var newRow = new TodayFactory(data);
		newRow.$create(function (data) {
			$scope.loading = false;
			$scope.rows.unshift(data);
		}, function (httpResponse) {
			alert(httpResponse.data || 'timeout!!');
		});
	};
	$scope.updateRow = function (time, dungeon, rating) {
		var data = {
			time: time,
			dungeon: dungeon,
			rating: rating
		};

		var finded = _.findWhere($scope.rows, { _id: $scope.currId });
		if (finded) {
			$scope.loading = true;
			finded = _.extend(finded, data);
			finded.$update(function (data) {
				$scope.loading = false;
				console.log(data);
			}, function (httpResponse) {
				alert(httpResponse.data || 'timeout!!');
			});
		}
	};
	$scope.deleteRow = function (id) {
		$scope.loading = true;
		TodayFactory.delete({ _id: id }, function (data) {
			$scope.loading = false;

			var removed = _.findWhere($scope.rows, { _id: data._id });
			$scope.rows.splice(_.indexOf($scope.rows, removed), 1);
		}, function (httpResponse) {
			alert(httpResponse.data || 'timeout!!');
		});
	};

	// run
	$scope.getData();
}]);

angular.element(document).ready(function () {
	angular.bootstrap(document, [ 'dnfTodayApp' ]);
});
