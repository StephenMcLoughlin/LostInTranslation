app.factory('httpFac', function($http) {
	return{
		post: 	function(url, data, config) {		//POST data to the Server
					return $http.post(url, data, config);
				},
		get: 	function(url, data) {				//GET data from the Server
					return $http.get(url);
				},
		put:  	function(url,data,config) {			//Used to update user data on the Server
					return $http.put(url, data, config);
				},

		}
});