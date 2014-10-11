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
	/**
	*	DatePicker
	*/
	$scope.dateOptions = {
		'year-format': "'yy'",
		'starting-day': 0
	};
	$scope.dt = new Date();
	/**
	*
	*/
	var redrawChart = function (data) {
		$scope.lastDay = new Date(data[0].time).format('yy년 mm월 dd일');
		$scope.firstDay = new Date(data.slice(-1)[0].time).format('yy년 mm월 dd일');

		var defDgList = [ '왕유', '빌마', '비명', '노페', '유열', '레쉬', '카사' ];
		var defRtList = [ '최상급', '상급', '중급', '하급', '최하급' ];

		drawGraph('#chart_dg svg', [
			{ key: '진고던 통계', values: table2graph(defDgList, data, 'dungeon') }
		]);
		drawGraph('#chart_rt svg', [
			{ key: '등급 통계', values: table2graph(defRtList, data, 'rating') }
		]);
	};
	/**
	*	Table
	*/
	var formatDate = function (date) {
		// 1385046000000
		return (date) ? new Date(date).format('yyyy-mm-dd') : '';
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
		itemsByPage: 8
	};

	$scope.getData = function () {
		$scope.loading = true;
		TodayFactory.read(function (data) {
			$scope.loading = false;

			// 내림차순
			$scope.rows = data.sort(function (left, right) {
				return right.time - left.time;
			});

			redrawChart($scope.rows);
		}, function (httpResponse) {
			alert(httpResponse.data || 'timeout!!');
		});
	};
	$scope.setRow = function (row) {
		$scope.dt = new Date(row.time);
		$scope.dungeon = row.dungeon;
		$scope.rating = row.rating;
		
		$scope.currId = row._id;
	};
	$scope.createRow = function (dt, dungeon, rating) {
		var data = {
			time: dt.getTime(),
			dungeon: dungeon,
			rating: rating
		};

		$scope.loading = true;
		var newRow = new TodayFactory(data);
		newRow.$create(function (data) {
			$scope.loading = false;
			$scope.rows.unshift(data);

			$scope.rows.sort(function (left, right) {
				return right.time - left.time;
			});

			redrawChart($scope.rows);
		}, function (httpResponse) {
			alert(httpResponse.data || 'timeout!!');
		});
	};
	$scope.updateRow = function (dt, dungeon, rating) {
		var data = {
			time: dt.getTime(),
			dungeon: dungeon,
			rating: rating
		};

		var finded = _.findWhere($scope.rows, { _id: $scope.currId });
		if (finded) {
			$scope.loading = true;
			finded = _.extend(finded, data);
			finded.$update(function (data) {
				$scope.loading = false;
				// console.log(data);

				redrawChart($scope.rows);
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

			redrawChart($scope.rows);
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

////////////////////////////// functions //////////////////////////////

function table2graph (defNames, table, key) {
	var dgs = _.pluck(table, key);
	var dgNames = _.uniq(dgs);

	return _.map(_.union(defNames, dgNames), function (name, i) {
		return {
			label: (name || '(미확인)'),
			value: _.filter(dgs, function (dgs) {
				return dgs === name;
			}).length
		};
	});
}

/**
*	Graph (nvd3)
*/
function drawGraph(selector, data) {
	nv.addGraph(function() {
		var chart = nv.models.discreteBarChart()
			.x(function(d) { return d.label; })
			.y(function(d) { return d.value; })
			// .staggerLabels(true)
			.tooltips(false)
			.showValues(true)
			;

		d3.select(selector)
			.datum(data)
		  .transition().duration(500)
			.call(chart);

		nv.utils.windowResize(chart.update);

		return chart;
	});
}
