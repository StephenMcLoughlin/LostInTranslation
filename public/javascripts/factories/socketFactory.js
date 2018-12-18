app.factory('socket', function ($rootScope) {
  var socket = io.connect();	//Establish connection with the server socket
  return {
		on: 		function (eventName, callback) {	//Handle incoming Socket event
		      			socket.on(eventName, function () {  
		        			var args = arguments;
		        			$rootScope.$apply(function () {
		         		 		callback.apply(socket, args); 	//check the state of the application and update the templates 
		         		 										//if there was a change after running the callback
		        			});
		      			});
		    		},
	   	emit: 		function (eventName, data, callback) {	//Emit Socket event
		      			socket.emit(eventName, data, function () {
		        			var args = arguments;
		        			$rootScope.$apply(function () {
		          				if (callback) {
		            				callback.apply(socket, args);
		          				}
		        			});
		      			})
	    			},
    	stream: 	function(eventName, file, data, stream) {	//Stream file data to the server
    					ss(socket).emit(eventName, stream, data);
    				}	
  		};
});