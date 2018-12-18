/*var room = {
	name: "",
	players: [],
}

module.exports = room;*/
class Room {
	constructor(name) {
		this.players = [];
		this.name = name;
	}
}

module.exports = Room