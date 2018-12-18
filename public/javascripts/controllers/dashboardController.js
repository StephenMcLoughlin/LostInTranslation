app.controller('dashboardCtrl', function($scope, httpFac, socket, $cookies, $window, DataService){
	 

	//$scope.leaderboard;
	//$scope.favourites;

	var socketId;
	var roomName;

	//Create game room function
	$scope.create = function() {
		//Emits socket event to the server to create a room and update other users view
		socket.emit('createRoom', {roomname: $scope.roomName, size: $scope.roomSize, timeout: $scope.timeout});
		socket.emit('check-for-updates');
	}

	//Join room function
	$scope.joinRoom = function(roomName) {
		//Emits socket event to the server to join a room and update other users view
		socket.emit("joinRoom", {roomname: roomName, socketId: socketId});
		socket.emit('check-for-updates');
	}

	//View favourite videos 
	$scope.viewFavs = function() {
		//Get request for the users favourite videos
		httpFac.get('/getFavourites').then(function(videoData) {
			$scope.favourites = videoData.data;
		});	
	}

	//Function to GET and stream the video for modal
	$scope.getVideo = function(fav) {
		console.log(fav);
		var id = fav.videoId;
		var videoData;
		

		httpFac.get('/getVideoData?id=' + id).then(function(video) {
			videoData = video.data;

		console.log(videoData)
		var video = document.createElement('video');
		video.id = 'vid';
		var vidContainer = document.getElementById('modalVideo');
		var cue_1 = new VTTCue(videoData.initCue[0], videoData.initCue[1], videoData.initText);
    	var cue_2 = new VTTCue(videoData.responseCue[0], videoData.responseCue[1], fav.subtitle);
    	track = video.addTextTrack("captions", "English", "en");
				track.mode = 'showing';
				track.addCue(cue_1);
				track.addCue(cue_2);

		video.src = '/video?id='+id;
		vidContainer.appendChild(video);
		video.setAttribute("controls","controls");
		video.muted = true;	//REMOVE AFTER TEST
		//video.play();
		});
	}

	//Closes the modal window and deletes the video element
	$scope.close = function() {
		console.log("close")
		var vidContainer = document.getElementById('modalVideo');
		while (vidContainer.firstChild) {
		  vidContainer.firstChild.remove();
		}	
	}

	//Function to handle the users upload of a profile image
	$scope.uploadFile = function() {
       var file = $scope.myFile;
       
       console.log('file is ' );
       console.dir(file);
       var ext = file.type.split('/');
       if(ext[1] == 'jpeg') {
       	var stream = ss.createStream();

       	socket.stream('profile-image', file, {size: file.size, username: $scope.username, fileType: file.type}, stream);
       	var blobStream = ss.createBlobReadStream(file);
                var size = 0;
                blobStream.on('data', function(chunk) {
                    size += chunk.length;
                    console.log(Math.floor(size / file.size * 100) + '%');
                    $scope.progress = Math.floor(size / file.size * 100) + '%';
                });

                blobStream.pipe(stream);
                blobStream.on('end' , function() {
                    console.log('done');
                    $window.location = '/users/home';
                });
       } else {
       		$scope.progress = 'Invalid fileType'
       }
       
       
    }

    //Function to handle the users upload of a video
    $scope.uploadVideo = function() {
    	
    	var file = $scope.myFile;

    	console.log('file is ' );
       	console.dir(file);
       	if(file.type != 'video/mp4') {
       		console.log("Invalid");
       		swal({
 		 	title: "Invalid file type"
			})
       	} else {
       		var stream = ss.createStream();

       		socket.stream('profile-image', file, {size: file.size, 
	       		name: $scope.videoName, fileType: file.type, 
	       		initText: $scope.initSubtitle, initCueStart: $scope.initStartTime,
	       		initCueEnd: $scope.initEndTime,
	       		responseCueStart: $scope.responseStartTime,
	       		responseCueEnd: $scope.responseEndTime}, stream);
	       	
	       	var blobStream = ss.createBlobReadStream(file);
                var size = 0;
                blobStream.on('data', function(chunk) {
                    size += chunk.length;
                    console.log(Math.floor(size / file.size * 100) + '%');
                    $scope.progress = Math.floor(size / file.size * 100) + '%';
                });

                blobStream.pipe(stream);
                blobStream.on('end' , function() {
                    swal({
 		 				title: "Video uploaded!"
					})
                });
       	}     	
    }


    /*
     *	SOCKET.IO
     */
    socket.emit('check-for-updates');

    //Server tells the client to update the view
    socket.on('apply-updates', function(data) {

    	//Get request for the leaderboard data
    	httpFac.get('/leaderboard').then(function(data) {
        	$scope.leaderboard = data.data;
        });

        //Get request for the onlinePlayers data
        httpFac.get('/playersOnline').then(function(data) {
        	$scope.onlinePlayers = data.data;
        });

        //Update view for updated room data
        $scope.roomObjs = data.roomData;
    });

    //Socket event to display an invite
    socket.on('invite', function(data) {
    	var roomName = data.room;

    	//Display alert on users screen
    	swal({
 		 	title: 'Invite to join room: ' + roomName,
 		 	showCancelButton: true,
 		 	confirmButtonText: "Join room",
		 	cancelButtonText: "Nah, I'm fine",
		  	closeOnConfirm: false,
		  	closeOnCancel: false
		}).then(function (text) {
			//User clicks to join the room, triggers join socket event
			socket.emit("joinRoom", {roomname: roomName, socketId: socketId});
		}, function(cancel) {
			//Alert is closed
			console.log("Cancel");
		});
    });


    //Update user data
	socket.on('userData', function(data) {
		$scope.extension = data.profile_ext;
		$scope.username = data.username;
		$scope.wins = data.wins;
		$scope.rank = data.rank;
		$scope.games_played = data.gamesPlayed;
		DataService.setUserName(data.username);
	});

	//Display alert to show room is full
    socket.on('denied-room-full', function(data){
		swal({
 		 	title: data,
		})
	}); 
});