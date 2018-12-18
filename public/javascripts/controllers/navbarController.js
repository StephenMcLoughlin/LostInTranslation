app.controller('logRegCtrl', function($scope, $window, httpFac, $cookies) {

	//Configure the headers for the HTTP requests
	var config = {
           	headers : {
                    	'Content-Type': 'application/json'
                }
        }

    var data = {};

    //Register User
	$scope.register = function() {
		
		//Form fields places in the data object
		data['email'] = $scope.email;
		data['password'] = $scope.password;
		data['username'] = $scope.username;

		var url = '/users/register';

		//POST users data to the servers API
        httpFac.post(url,data,config).then(function(token) {
        
        	$window.location.href = '/users/login';
     	},
     	function(data) {
     		//Display error
     		console.log(data.data.body);
     		swal(data.data.body, "", "error");
     	}); 
     	  	
	}

	//Login User
	$scope.login = function() {

		//Form fields placed in the data object
		data['email'] = $scope.email;
		data['password'] = $scope.password;
		
		var url = '/users/login';

		//POST users data to the servers API
        httpFac.post(url,data,config).then(function(token) {
   
        	$window.location.href = '/users/home';
     	},
     	function(data) {
     		//Display error
     		console.log(data.data.body);
     		swal(data.data.body, "", "error");
     	});
	}

	$scope.logout = function($cookie) {

		var url = '/users/logout'
		var data = {loggedIn: false};
		
		//POST data to the servers API
		httpFac.post(url, data, config).then(function(status) {
			console.log("Status: " + status.data.logged_out);

			//Remove the access token from the cookie
			$cookies.remove('Authorization', {path: '/'});

			//Redirect to home page
			$window.location.href = '/';
		}),
		function(err) {
			console.log(err);
		}
	}

 });