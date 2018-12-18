var app = angular.module('myApp', ['ngCookies']);
	/* 
	 * Login/Register Controller 
	 */
	 app.controller('logRegCtrl', function($scope, $window, httpFac, $cookies) {

		var config = {
	           	headers : {
	                    	'Content-Type': 'application/json'
	                }
	        }
	    var data = {};

	    //Register User
		$scope.register = function() {
			
			data['email'] = $scope.email;
			data['password'] = $scope.password;
			data['username'] = $scope.username;

			var url = '/users/register';

	        httpFac.post(url,data,config).then(function(token) {
	        
	        	$window.location.href = '/users/login';
	     	}); 
	     	  	
		}

		//Login User
		$scope.login = function() {

			data['email'] = $scope.email;
			data['password'] = $scope.password;
			
			var url = '/users/login';

	        httpFac.post(url,data,config).then(function(token) {
	        	//console.log(token.data);
	        	//cookieFactory.setCookie(token.data);
	        	$window.location.href = '/users/home';
	     	});
		}

		$scope.logout = function($cookie) {
			$cookies.remove('Authorization');            
			$window.location.href = '/';
		}

	 });

	 /*
	  *	Factory to handle GET and POST methods
	  */
	app.factory('httpFac', function($http) {
   		return{
   			post: 	function(url, data, config) {
   						return $http.post(url,data,config);
   					},
   			get: 	function(url, data) {
   						return $http.get(url);
   					}  

   			}
   	});
/*
   	app.factory('cookieFactory', function($cookies) {
   		var cookie;

   		function setCookie(cooki) {
   			cookie = cooki
   		}
   	
   		var data = {
   			setCookie: setCookie(),
   			getCookie: cookie,
   		}
   		return data;

   	});
   	*/