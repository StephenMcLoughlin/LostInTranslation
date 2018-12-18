var express = require('express');
var router = express.Router();
var User = require('../models/users');
var Video = require('../models/videos');
var jwt = require('jsonwebtoken');
var app = require('../app');
var dash = require('../dashboard');
const fs = require('fs-extra');


//API to handle user login
router.post('/login', function(req, res, next){

    //Extract the parameters from the users POST
    var email = req.body.email;
    var password = req.body.password;

    //Check find email on the database
    User.findOne({'email': email}, function (err, user) {
        // if there are any errors, return the error
        if (err)
            res.send(err);
        // If user account found then check the password
        if (user) {
          // Compare passwords
            if (user.validPassword(password)) {
                // Success : Assign new access token for the session
                user.access_token = createJwt({email: email});
                user.online = true;
                user.save();
                res.cookie('Authorization', 'Bearer ' + user.access_token); 
                res.json({'success' : 'loggedIn'});
                app.io.emit("apply-updates"); 
            }
            else {
                res.status(401).send({
                    "status": "error",
                    "body": "Email or password does not match"
                });
            }
        }
        else
        {
            res.status(401).send({
                "status": "error",
                "body": "Username not found"
            });
        } 
    }); 
});

//API to handle user signup
router.post('/register', function(req, res, next) {

    //Extract data from the users POST
	var email = req.body.email;
	var password = req.body.password;
    var username = req.body.username;
    
    //Check database if document has the same email or username
	User.findOne({$or:[{ 'email' : email },{'username' : username}]}, function(err, user) {
		if(err)
			res.send(err);
        if(user) {
            if(user.email == email) {
                res.status(401).json({
                    'status': 'info',
                    'body': 'Email already registered'
                });
            } else if(user.username == username) {
                res.status(401).json({
                    'status': 'info',
                    'body': 'Username already taken'
                });
            }
        }else {

            //Create new user profile
			var newUser =new User();
		
			newUser.email = email;
            newUser.username = username;
			newUser.password = newUser.generateHash(password);
			newUser.access_token = createJwt({email: email});
			newUser.save(function(err, user) {
				if(err)
					throw err;
				res.cookie('Authorisation', 'Bearer' + user.access_token);
				res.json({'success' : 'account created'});
                createProfileDirectory(user.username);      //Create users profile folder
			});
		}
	});

});

//User home page
router.get('/home', function(req, res, next) {    
    try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            res.render('home');
        }
    }catch (err) {
        /*
            res.json({
                "status": "error",
                "body": "You are not logged in."
            });
            */
            res.render('unAuth');
        }
});

//Handle user logout
router.post('/logout', function(req, res, next) {
    var status = req.body.loggedIn;
    try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            User.findOne({'access_token': jwtString}, function(err, user) {
               if(err) {
                    res.send(err);
               } else {
                    user.online = status;
                    user.save();
                    app.io.emit("apply-updates");   //Inform others that user is no longer online
                    res.json({
                        "body": "you are logged out"
                    });  
               }
            });
        }
        
    }catch (err) {
           /* res.json({
                "status": "error",
                "body": [
                    "You are not logged in."
                ]
            });*/
            res.render('unAuth');
    }
});

//Display registeration page
router.get('/register', function(req, res, next) {
		res.render('register');
});

//Display login page
router.get('/login', function(req, res, next) {
    res.render('login');
});

//Increment the games played
router.put('/incrementGamesPlayed', function(req, res, next) {
    try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            //Update winners data
            User.update({ 'access_token' :  jwtString }, {$inc: {games_played: 1}}, function(err, user) {
                if(err) {
                    res.send(err);
                } else {
                    res.send({status: 'games_played incremented'});
                }
      });
        }
    }catch (err) {
        /*
            res.json({
                "status": "error",
                "body":"You are not logged in."
            });
            */
            res.render('unAuth');
    }
});


//Handle connection to socket
app.io.on('connection', function(socket) {
    console.log("A client connected");

    
    //Get users access token
    var cookie = socket.handshake.headers.cookie;
    var auth = cookie.split('Authorization=Bearer%20');
    var token = auth[1].split(';');


    dash.init(app.io, socket, token[0]);    //Initialise the users dashboard


    //Socket Event to handle file uploads
    app.ss(socket).on('profile-image', function(stream, data) {
        var fileType = data.fileType;
        var ext = fileType.split('/');
        console.log(ext[1]);

        //Check the file type
        if(ext[1] == "jpeg") {
            //Write file to the users profile
        	stream.pipe(fs.createWriteStream('./public/users/' + data.username 
				+ '/profileImage.jpg'));
        } else if(ext[1] == "mp4") {
            console.log("Video")
            var extension = '.'+ ext[1];

            //Write file to the videos folder
        	stream.pipe(fs.createWriteStream('./videos/' + data.name 
				+ '.' + ext[1]));
         
            //Store video data on the database
            Video.count({}, function(err, count) {
                if(err) {
                    console.log(err);
                } else {
                   
                    var video = new Video({videoNo: count+1, name: data.name, 
                                        extension: extension, initText: data.initText,
                                        initCue: [data.initCueStart, data.initCueEnd], 
										responseCue:[data.responseCueStart, data.responseCueEnd]});
                    video.save(function(err, savedVideo) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log("Saved");
                        }
                    })
                }
            }); 
        }
        
    });

});

/*
 Verifies a JWT
 */
 
function verifyJwt(jwtString) {
    var value = jwt.verify(jwtString, 'HomerSimpson');
    return value;
}

function createJwt(profile) {
	return jwt.sign(profile, 'HomerSimpson', {
		expiresIn: '10d'
	});
}


function createProfileDirectory(username) {
    var path = './public/users/' + username + '/profileImage.jpg';
        setUserDefaultImage(path);
}

//Copy default image and place it in the users profile folder
function setUserDefaultImage(dest) {
    fs.copy('./public/profileImage.jpg', dest)
    .then(function() {
        console.log('success!');
    }).catch(function(err) {
        console.error(err);
    });
}

module.exports = router;
