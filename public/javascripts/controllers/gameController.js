app.controller('gameCtrl', function($scope, socket, $window, $interval, httpFac, DataService, $sce) {
	$scope.isDisabled = true;
	$scope.replay = false;
	$scope.showCount = true;
	$scope.showWinner = false;
	$scope.voteDisabled = false;

	//$scope.players;

	//Leave room function
	$scope.leaveRoom = function() {
		//Emit event to the server 
		socket.emit("leaveRoom", {roomname: DataService.getRoomName(), socketId: DataService.getSocketId()});
		//Redirect to users dashboard
		$window.location = '/users/home';
	}

	//Submit users subtitles
	$scope.submit = function() {
		console.log($scope.subsTextField);
		socket.emit('submit-subtitles', {roomname: DataService.getRoomName(), id: DataService.getSocketId(), subtitles: $scope.subsTextField});
		$scope.isDisabled = true;	//Disable button after submission
		$scope.subsTextField = "";
	}

	//Submit users vote
	$scope.vote = function(data) {
		$scope.count = "Vote Placed";
		$scope.voteDisabled = true;	//Disable button after submission
		console.log(data.id);
		socket.emit('vote-cast', {roomname: DataService.getRoomName(), vote: data.id});
	}

	//Replay game function
	$scope.replayGame = function() {
		$scope.replay = false;
		$scope.showWinner = false;
		$scope.count = "Waiting for Other Players";
		console.log("replay");
		socket.emit('check-state', {roomname: DataService.getRoomName(), playerId: DataService.getSocketId()});
		incrementGamesPlayed();
	}

	//Add video to users favourites
	$scope.add = function(data) {
		var id = DataService.getVideoData()._id;
		var sub = data.message;
		var videoName = DataService.getVideoData().name;

		//POST the video data to the Server to store on the users profile
		httpFac.post('../addFavourite', {videoId: id, name: videoName, subtitle: sub});
	}

	$scope.invite = function(player) {

		console.log(player);
		socket.emit('invite-player', {player: player.socketId, room: DataService.getRoomName()});
	}


	////////////////////////////
	//	SOCKETS
	///////////////////////////

	//Update the users view
    socket.on('apply-updates', function(data) {
        httpFac.get('/playersOnline').then(function(data) {
        	$scope.onlinePlayers = data.data;
        });
    });

    //Socket event to show user has joined room
	socket.on('joined-room', function(data) {
		$scope.changeView();
		$scope.beginGame = false;
		console.log(data);
		DataService.setRoomName(data.room);
		DataService.setSocketId(data.socketId);
		$scope.roomName = DataService.getRoomName();
		$scope.username = DataService.getUserName();
		socket.emit('check-for-updates');
	});

	//Socket event to handle when user leaves a room
	socket.on('left-room', function(data) {
		console.log(data);
		$scope.changeView();
	});

	//Socket event to handle countdown
	socket.on('countdown', function(data){
		if(data.count == 0) {
			$scope.count = "";
		}
		$scope.count = data.count;
		$scope.msg = data.info;
	});

	//Socket event to handle Video stream
	socket.on('stream-video', function(data){
		//Hide the count 
		$scope.showCount = false;

		var videoData = data.video;
		console.log(videoData);

		//Save video data for player to add to favourites
		DataService.setVideoData(videoData);

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
		video.muted = true;	//REMOVE AFTER TEST
		video.play();
		

		video.addEventListener('ended', myHandler, false);
		function myHandler() {
			//When the video ends, video element is deleted 
			vidContainer.removeChild(video);
			//User checks the state of the game
        	socket.emit('check-state', {roomname: DataService.getRoomName(), playerId: DataService.getSocketId()});
        	$scope.showCount = true;

    	}
	});

	//Socket event to tell the user to write their response
	socket.on('write-response', function(data){
		$scope.count = "";
		$scope.isDisabled = false;
	});

	//Socket event to handle the end of the countdown
	socket.on('timeout', function(data) {
		$scope.count = "Timeout";
		$scope.isDisabled = true;
		socket.emit('check-state', {roomname: DataService.getRoomName()});

	});

	//Socket event to trigger the users vote
	socket.on('votes', function(data) {
		$scope.voteDisabled = false;
		$scope.voteBallot = true;
		$scope.count = "Place your vote";
		$scope.msg = "";
		console.log(data.otherPlayers);
		$scope.playerObjs = data.otherPlayers;
	});

	//Socket event to display the winner
	socket.on('winner', function(data) {

		$scope.showWinner = true;

		//If more than 1 player has the most votes game is a draw
		//Else display the winner of the game
		if(data.winner.length > 1) {
			$scope.count = "No winner";
		} else {
			var player = data.winner[0].username;
			var subtitle = data.winner[0].message;
			$scope.count = "Congratulations!!";
			$scope.winnerName = "Winner: " + player;	//Players name
			$scope.winnerImg = "<img src='../users/"+player+"/profileImage.jpg'>";	//Players profile image
			$scope.winner = $sce.trustAsHtml($scope.winnerImg);
			$scope.sub = '"'+subtitle+'"';		//Winning subtitle
			console.log(data.winner);
		}
		$scope.voteBallot = false;
		$scope.replay = true;
	});

	//Socket event to display the players in a room
	socket.on('players-in-room', function(data) {
		console.log(data);
		$scope.players = data.players;
		$scope.waitingfor = (data.playersNeeded);
	});

	//Socket event to handle the start of a game
	socket.on('begin-game', function(data) {
			$scope.beginGame = true;
			socket.emit('check-state', {roomname: DataService.getRoomName(), playerId: DataService.getSocketId(), state: ''});
			console.log(DataService.getRoomName);
			
			incrementGamesPlayed();	
	});

	function incrementGamesPlayed() {
		//Increment players games played
		httpFac.put('./incrementGamesPlayed').then(function(result) {
			console.log(result.data);
		});
	}

});



function emitToServer(event, data) {
	socket.emit("nickname-entered", {nickname: nickname});	
}
	
