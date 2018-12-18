var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Video = require('../models/videos');
var User = require('../models/users');
var app = require('../app');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lost in Translation' });
});


// the important parts of echo server
app.io.on("connection", function (socket) {
	console.log('a client connected');
	console.log(socket.id)
	socket.emit('test', 'test');
});
module.exports = router;


