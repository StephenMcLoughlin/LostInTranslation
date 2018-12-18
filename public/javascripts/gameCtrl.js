
app.controller('gameCtrl', function($scope, socket, $cookies, $window, $interval, httpFac) {

	$scope.roomObjs;
	$scope.leaderboard;
	$scope.dashboard = true;
	$scope.game = false;
	
	$scope.heading = "Welcome";
	$scope.vid = false;
	$scope.options = true;
	$scope.gameCntrls = false;
	$scope.isDisabled = true;

	var socketId;
	var roomName;

	var cookie = $cookies.get('Authorization');
	var token = cookie.split("Bearer ");	
	

	$scope.create = function() {
		var room;
		swal({
 		 	title: 'Enter room name',
  			input: 'text'
		}).then(function (text) {
  			room = text;
			socket.emit("createRoom", {roomname: room});
		})
	}

	$scope.joinRoom = function(roomName) {
		//console.log(roomName);
		socket.emit("joinRoom", {roomname: roomName, socketId: socketId});
	}

	$scope.leaveRoom = function() {
		socket.emit("leaveRoom", {roomname: roomName, socketId: socketId})
	}

	$scope.submit = function() {
			console.log($scope.subsTextField);
			socket.emit('submit-subtitles', {roomname: roomName, id: socketId, subtitles: $scope.subsTextField});
			$scope.isDisabled = true;
			$scope.subsTextField = "";
	}

	$scope.vote = function(data) {
		console.log(data.id);
		socket.emit('vote-cast', {roomname: roomName, vote: data.id});
	}

	
    $interval(function () {
        httpFac.get('/leaderboard').then(function(data) {
        	$scope.leaderboard = data.data;
        });
    }, 5000);
/*
	socket.on('nickname', function(data){
		swal({
 		 	title: 'Enter Nickname',
  			input: 'text'
		}).then(function (text) {
  			nickName = text;
			socket.emit("nickname-entered", {nickname: nickName});
		})
	}); 
*/
	socket.on('connect', function() {
		console.log('connected: ' + token[1]);
		socket.emit('token', {token: token[1], hello: "poo"});
	});


	socket.on('joined-room', function(data) {
		$scope.dashboard = false;
		$scope.game = true;
		console.log(data);
		roomName = data.room;
		console.log(roomName);
		socketId = data.socketId;
		/*console.log(data);
		$scope.options = false;
		$scope.vid = true;
		$scope.gameCntrls = true;
		$scope.heading = "Room: " + data.room;
		roomName = data.room;
		socketId = data.socketId;
		$scope.nickname = 'Nickname: ' + data.nickname;*/
	})

	socket.on('left-room', function(data) {
		console.log(data);
		$scope.game = false;
		$scope.dashboard = true;

	});
	socket.on('denied-room-full', function(data){
		swal({
 		 	title: data,
		})
	}); 

	socket.on('stream-video', function(data){
		//console.log(data);
		var videoData = data.video;
		console.log(videoData);
		var video = document.createElement('video');
		video.id = 'vid';
		var vidContainer = document.getElementById('vidContainer');
		console.log(data);
		var cue_1 = new VTTCue(videoData.initCue[0], videoData.initCue[1], videoData.initText);
    	var cue_2 = new VTTCue(videoData.responseCue[0], videoData.responseCue[1], data.message);
		track = video.addTextTrack("captions", "English", "en");
				track.mode = 'showing';
				track.addCue(cue_1);
				track.addCue(cue_2);

		video.src = '/video?id='+videoData._id;
		vidContainer.appendChild(video);
		video.play();
		

		video.addEventListener('ended', myHandler, false);
		function myHandler() {
			vidContainer.removeChild(video);
        	socket.emit('check-state', {roomname: roomName, playerId: socketId});
    	}
	});  

	socket.on('countdown', function(data){
		$scope.count = data.count;
	});
	
	socket.on('write-response', function(data){
		//$scope.count = data.count;
		$scope.isDisabled = false;
	});

	socket.on('timeout', function(data) {
		$scope.count = data.message;
		$scope.isDisabled = true;
		socket.emit('check-state', {roomname: roomName});
	});

	socket.on('votes', function(data) {
		console.log(data.otherPlayers);
		$scope.playerObjs = data.otherPlayers;

		//Create button for the each player
	});

	socket.on('winner', function(data) {
		console.log(data);
	});

	socket.on('disconnect', function() {
		//console.log('goodbye');
	}); 

	socket.on('roomData', function(data) {
		$scope.roomObjs = data.roomData;
	});

	socket.on('userData', function(data) {
		$scope.username = data.username;
		$scope.wins = data.wins;
		$scope.rank = data.rank;
		console.log(data);
	});

	/*
	 *	NB: DONT DELETE THIS YET
	 */
	ss(socket).on('video-stream', function(stream, data) {
		
				console.log(data);
				//$scope.template = $scope.templates[1];	

				var video = document.getElementById('video');
				track = video.addTextTrack("captions", "English", "en");
				track.mode = 'showing';
				track.addCue(new VTTCue(0.5, 5, data.message));

				parts = [];
				stream.on('data', function(chunk) {
					parts.push(chunk);
				});
				stream.on('end', function() {
					video.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
					video.play();
				});
				//var video = document.getElementById("video");
				
			//	track = video.addTextTrack("captions", "English", "en");
			//	track.mode = 'showing';
			//	track.addCue(new VTTCue(0.5, 5, "My first Cue"));	
	});

	socket.on('broadcast', function(data) {
			console.log(data);
			
			//$scope.template = data.message;
	});

	function emitToServer(event, data) {
		socket.emit("nickname-entered", {nickname: nickname});	
	}

});


/*
app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
		on: 	function (eventName, callback) {
		      		socket.on(eventName, function () {  
		        		var args = arguments;
		        		$rootScope.$apply(function () {
		         		 	callback.apply(socket, args);
		        		});
		      		});
		    	},
   		emit: 	function (eventName, data, callback) {
	      			socket.emit(eventName, data, function () {
	        			var args = arguments;
	        			$rootScope.$apply(function () {
	          				if (callback) {
	            				callback.apply(socket, args);
	          				}
	        			});
	      			})
    			}
  		};
});


	  //	Factory to handle GET and POST methods
	  
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
*/