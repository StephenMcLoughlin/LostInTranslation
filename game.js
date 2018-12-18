
var Video = require('./models/videos');
var games = require('./models/roomData');
var User = require('./models/users');


const MAX_SIZE = 1;
var io;


exports.play = function(sio, socket, user) {
  io = sio;
  var currentRoom = null;

  console.log("User: " + user.username + " socketId:" + socket.id);
  socket.on('createRoom', function(data) {
    var roomName = data.roomname;
    var numClients = getNumClients(roomName);

    currentRoom = roomName;

    //Join socket to a room
    socket.join(roomName);

    //Create a player
    var player = createPlayer(socket, user);

    //Create a room
    var room = createRoom(data);

    //Push player on the rooms player array
    room.players.push(player);

    room.numPlayers++;

    isPlaying(player.id, true);

    //Push the room on the games array
    games.push(room);

    //Emit player details back to the client
    console.log("Created room: " + socket.id)
    emitToClient(socket.id, 'joined-room', {room: roomName, socketId: socket.id});

    var players = room.players;

    var playersNeeded = room.size - players.length;

    broadcastToRoom(roomName, 'players-in-room', {players: players, playersNeeded: playersNeeded});

    setCurrentRoom(roomName);
  })

  socket.on('joinRoom', function(data) {
    var socketId = data.socketId;
    var roomName = data.roomname;

    var numClients = getNumClients(roomName);
    var room = getRoom(roomName);
    
 
    if(numClients < room.size) {
      //Join socket to a room
      socket.join(roomName);

      //Create a player
      var player = createPlayer(socket, user);

      //Push player on the rooms player array
      room.players.push(player);

      isPlaying(player.id, true);
      
      room.numPlayers++;

      currentRoom = roomName;

      //Can delete after
      for(var i= 0; i < games.length; i++) {
          console.log(games[i]);
      }

      //Emit player details back to the client
      emitToClient(socket.id, 'joined-room', {room: roomName, socketId: socket.id});

      var playersNeeded = room.size - room.players.length;
      broadcastToRoom(roomName, 'players-in-room', {players: room.players, playersNeeded: playersNeeded});
      
      if(numClients+1 == room.size) {
        broadcastToRoom(roomName, 'begin-game', {status: 'start game'});
      }

      setCurrentRoom(roomName);
    } else {
      //Room is full 
      emitToClient(socket.id, 'denied-room-full', roomName + " is full");
    }    
  });

  	socket.on('check-state', function(data) {
  		var room = getRoom(data.roomname);
 
  		room.playerCount++;

      if(room.state === room.gameStates.BEGIN) {
		  
        //room.players.length
        if(room.playerCount === room.size) {

          //Get video from the database
          getRandomVideo(room.name);

          //Zero the player counter for the next state call
          room.playerCount = 0;

          //Change state of game in room
          room.state = room.gameStates.PLAYER_RESPONSE;
        }

      } else if(room.state === room.gameStates.PLAYER_RESPONSE) {

  			//Player counter is limited to the amount of players in the room
  			//This makes sure the code is only triggered once per room
    		if(room.playerCount === room.players.length) {

    			//This broadcast enables HTML elements on the client side
        		broadcastToRoom(data.roomname,'write-response');

        		//Countdown for the players response, triggers a timeout handled on the client side
        		countdown(data.roomname,'timeout', room.timeout+1, {info:"Write your response"});

        		//Zero the player counter for the next state call
        		room.playerCount = 0;

				//Shuffle the rooms player array so players can't guess who's video is next
				room.players = shuffle(room.players);
				for(var i = 0; i < room.players; i++) {
					console.log(room.players[i]);
				}
        		//Change state of game in room
        		room.state = room.gameStates.PLAYBACK;
        	}
    	}else if(room.state === room.gameStates.PLAYBACK) {
    		if(room.playerCount === room.players.length) {

          		var count = room.videoCount + 1;
	          	//Countdown for next video
	          	countdown(data.roomname,'stream-video', 6, {playerId: room.players[room.videoCount].id, 
	              message: room.players[room.videoCount].message, 
	              video: room.currentVideo, info: "Loading Video " + count + " . . ."});

	    		room.videoCount++;
	          	room.playerCount = 0;

    			if(room.videoCount === room.players.length) {
            		room.videoCount = 0;
            		//Change state of game in room
    				room.state = room.gameStates.VOTES;

    			} 
    			
    		}
    	}else if(room.state === room.gameStates.VOTES) {
       
        var otherPlayers = prepareBallot(data.playerId, room);
        socket.emit('votes', {otherPlayers});


        console.log("***** PLAYER COUNT IN THE VOTES STATE: " + room.playerCount)
        room.playerCount = 0;
    	  room.videoCount = 0;

    	}
  	});

	//Player leaves the room
  	socket.on('leaveRoom', function(data) {
      
      socket.leave(data.roomname);
 	 });

  	socket.on('disconnect', function () {
    	console.log('A client disconnected '+ socket.id);

    	//If the player is in a game remove player from the rooms player array
    	if(currentRoom != null) {
        console.log("Leaving room " + currentRoom);

        
        var room = getRoom(currentRoom);
        
    	removePlayer(socket.id, currentRoom);

        isPlaying(socket.id, false);

        var playersNeeded = room.size - room.players.length
        broadcastToRoom(currentRoom, 'players-in-room', {players: room.players, playersNeeded: playersNeeded});

        //All players have left the room, delete the room
        if(room.players.length < 1) {
          removeRoom(room);
        }
    	}  
    });

	
	//Players cast their vote
    socket.on('vote-cast', function(data) {
		var room = getRoom(data.roomname);

		giveVote(data.roomname, data.vote);

		room.playerCount++;

		if(room.playerCount == room.players.length) {
      		room.playerCount = 0;

			var winner = getWinner(room);

      		if(winner.length > 1) {
      			broadcastToRoom(data.roomname, 'winner', {winner: winner});
      		} else {
      			//Update winners data
    				User.update({ '_id' :  winner[0].profile }, {$inc: {wins: 1}}, function(err, user) {
    					if(err) {
    						console.log(err)
    					} else {
    					console.log("User: " + user.email + " wins: " + user.wins);
    					}
    				});
      	    broadcastToRoom(data.roomname, 'winner', {winner: winner});
      	}
      		clearPlayersData(room);
			    room.state = room.gameStates.BEGIN;
		}
	});

	//Socket event to handle the players submission
	socket.on('submit-subtitles', function(data) {
  		var thisRoom = getRoom(data.roomname);
  		for(var i = 0; i < thisRoom.players.length; i++) {
  			if(thisRoom.players[i].id === data.id) {
  				thisRoom.players[i].message = data.subtitles;
  			}
  		}
  		
	});

}//End of function


/*
 *  FUNCTIONS
 */

function getNumClients(roomName) {
      var clientsInRoom = io.sockets.adapter.rooms[roomName];
      var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
      return numClients;
}

//Create a player object
function createPlayer(socket, user) {
  var player = {
      profile: user._id,
      id: socket.id,
      username: user.username,
      message: "",
      votes: 0 
  }
  return player;
}


//Create a room object
function createRoom(room) {
  var room = {
    name: room.roomname,
    players: [],
    playerCount: 0,
    videoCount: 0,
    size: room.size,
    timeout: room.timeout,
    numPlayers: 0,
    currentVideo: {},
    videosPlayed: [],
    gameStates: {
      BEGIN: 1,
      PLAYER_RESPONSE: 2,
      PLAYBACK: 3,
      VOTES: 4,
      REPLAY: 5
    },
    state: 1
  }
  return room;
}

function setCurrentRoom(roomName) {
      currentRoom = roomName;
}

function emitToClient(socketId, event, data) {
      io.to(socketId).emit(event, data);
}

//Get the current room from the games array
function getRoom(roomName) {
  var obj = games.find(function(obj) {
    return obj.name === roomName;
  });
  return obj;
}

function removePlayer(playerId, roomName) {
  var player = playerId;        //Player that's left the room
  var thisRoom = getRoom(roomName); //Room the player is leaving
  console.log("Remove player from room: " + thisRoom.name);

  for(var i = 0; i < thisRoom.players.length; i++) { 
    if(player === thisRoom.players[i].id) {
      thisRoom.players.splice(i,1);
    }
    console.log(thisRoom.players);
  }  
}

function removeRoom(room) {
	for(var i = 0; i < games.length; i++) {
		if(room.name === games[i].name) {
			games.splice(i,1);
		}
	}
}

function broadcastToRoom(room, event, data) {
   	io.sockets.in(room).emit(event, data);
}


function getRandomVideo(roomName) {
	var room = getRoom(roomName);
	var videosPlayed = room.videosPlayed;
	  Video.count({}, function(err, max) {
	    console.log(max);
	    var randomNumber = Math.floor(Math.random() * (max - 1 + 1) + 1);

	    //Check to see if the room has already played this video
	    //If it has generate a new video number to play
	    while(videosPlayed.includes(randomNumber)) {
			randomNumber = Math.floor(Math.random() * (max - 1 + 1) + 1);
		}
		
	    console.log(randomNumber);
	    Video.findOne({videoNo: randomNumber}, function(err, video) {
	        var videoObj = video;

	        //Countdown to begin game
	        countdown(roomName, 'stream-video', 6, {message: "WHAT'S YOUR RESPONSE?", video: videoObj});

	        //Add video to the room object
	        addVideoToRoom(roomName, videoObj);
	    });
	  });
}


//Countdown timer
  function countdown(roomName, event, counter, data) {
    	var count = counter;
    	var timer = setInterval(function() {
      	count--;
      	broadcastToRoom(roomName, 'countdown', {count: count, info: data.info});
        console.log(data.info);
      		if(count == 0) {
        		clearInterval(timer);
        		broadcastToRoom(roomName, event, data);
      		}
    	}, 1000);
	}

//Update player is playing
function isPlaying(playerId, value) {
  console.log("is playing " + value)
  
  User.findOne({'socketId': playerId}, function(err, user) {
    if(err)
      throw err
    user.isPlaying = value;
    user.save();
  });
  
}

//Add video to the rooms played video array
function addVideoToRoom(roomName, video) {
        var room = getRoom(roomName);
        room.currentVideo = video;
        room.videosPlayed.push(video.videoNo);
        console.log("ADD VIDEO TO ROOM FUNCTION");
        console.log(room);
    }

//Shuffle the players array so the next players submission can't be predicted	
function shuffle(players) {
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }
      return players;
    }

//Prepare the voting ballot for each player in the game
function prepareBallot(playerId, room) {
	var otherPlayers = [];

	//Create player array which doesnt contain the requesting player
	for(var i = 0; i < room.players.length; i++) {
		
		if(playerId != room.players[i].id) {
			var tempPlayer =  {};
			tempPlayer['profile'] = room.players[i].profile;
			tempPlayer['id'] = room.players[i].id;
			tempPlayer['message'] = room.players[i].message;
			otherPlayers.push(tempPlayer);
		}
	}
	return otherPlayers;
}

	//Submit vote to the rooms player array
  	function giveVote(roomName, playerId) {
  		var room = getRoom(roomName);
  		for(var i  = 0; i < room.players.length; i++) {
  			if(playerId == room.players[i].id) {
  				room.players[i].votes++;
  			}
  		}
  	}

	//Pass back the winner of the game
  	function getWinner(room) {
     	console.log("GET WINNER!!!");
  		var winner;
      	var max = 0; 
      	var winners = [];
      	var skip;

		//Check which player has the highest score
  		for(var i = 0; i < room.players.length; i++) {
	        if(room.players[i].votes > max) {
	          max = room.players[i].votes;
	          winner = room.players[i];
	          skip = i;
	        }
  		}

		//Push that player on to a winner array
  		winners.push(winner);

		//Check if another player equals this score
  		for(var i = 0; i < room.players.length; i++) {
			//Skip the player thats already on the winner array
  			if(i != skip) {
				//Player equal the high score, push on the winner array
  				if(room.players[i].votes == winner.votes) {
  					winners.push(room.players[i]);
  				}
  			}
  		}
      
  		return winners;	//REturn the winner array
  	}

	//Clear players data for the next game
  	function clearPlayersData(room) {
  		for(var i = 0; i < room.players.length; i++) {
  			room.players[i].message = "";
  			room.players[i].votes = 0;
  		}
  	} 
