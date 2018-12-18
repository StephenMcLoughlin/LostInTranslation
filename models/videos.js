var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new Schema({
    videoNo: Number,
    name: {type: String},
    extension: {type: String},
    initText: {type: String},
    initCue: [Number],
    responseCue: [Number]	
});


module.exports = mongoose.model('Video', videoSchema);