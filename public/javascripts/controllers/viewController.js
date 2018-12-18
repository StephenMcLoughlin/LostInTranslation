app.controller('viewCtrl', function($scope) {
	//Dashboard and game view templates
	$scope.dashboard = true;	//Dashboard initially set to true as it's the first view
	$scope.game = false;

	//Toggle function to change views
	$scope.changeView = function() {
		$scope.dashboard = !$scope.dashboard;
		$scope.game = !$scope.game;
		console.log("View ctrl: " + $scope.dashboard);
	}
});