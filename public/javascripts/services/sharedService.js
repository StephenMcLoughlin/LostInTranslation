app.service('DataService', function() {

	//Data that is shared between the dashboard and game controller
	var roomName;
	var socketId;
	var userName;
	var videoData;
	var size;

	this.setRoomName = function(name) {
		roomName = name;
	}

	this.getRoomName = function() {
		return roomName;
	}

	this.setRoomSize = function(size) {
		this.size = size
	}
	
	this.getRoomSize = function() {
		return size;
	}

	this.setSocketId = function(socket) {
		socketId = socket;
	}

	this.getSocketId = function() {
		return socketId;
	}

	this.setUserName = function(name) {
		userName = name;
	}

	this.getUserName = function() {
		return userName;
	}

	this.setVideoData = function(video) {
		videoData = video;
	}

	this.getVideoData = function() {
		return videoData;
	}
});