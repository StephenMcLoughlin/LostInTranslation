var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
require('./config');

var usersSchema = new Schema({
        email: {type: String},
        username: String,
        password: String,
        access_token: String,
        socketId: String,
        isPlaying: {type: Boolean, default: false},
        favourites: [],
        games_played: {type: Number, default: 0},
        wins: {type: Number, default: 0},
        online: {type: Boolean, default: false} 
});

/*
 * Hashes the password for storage in the DB
 */
usersSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// Compares passwords to determine if the user is who they say they are
usersSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', usersSchema);