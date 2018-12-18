var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var fs = require('fs');
var Video = require('../models/videos');
var User = require('../models/users');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lost in Translation' });
});

router.get('/login', function(req, res, next) {
    res.render('login');
});


//Video Stream 
router.get('/video', function(req, res, next) {
    //Extract the video id from the clients request
    var videoId = req.query.id;

    //Video vlocation
    var location = "videos/"
    var videopath;

    console.log("From the client: " + videoId)

    //Find video by id
    Video.findOne({'_id': videoId}, function(err, video) {
        if(err) {
            res.send(err);
        } else {
            //Videos file path
            videopath = location + video.name + video.extension;
            const path  = videopath;

            //Get the file size
            const stat = fs.statSync(path);
            const fileSize = stat.size;

            //Set the range, when range is known
            const range = req.headers.range;

            if(range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1]
                    ? parseInt(parts[1], 10)
                    : fileSize-1
                const chunkSize = (end-start) + 1;

                //Read file again with the new ranges
                const file = fs.createReadStream(path, {start, end});   

                //Set the values in the header
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': 'video/mp4',
                }

                //partial content to continously feed the front end with chunks
                res.writeHead(206, head);   
                file.pipe(res); //Pipe the file
            } else {
                //Send the first few chunks
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head);
                fs.createReadStream(path).pipe(res);
                next();
            }
        }
    });
});

//Get the leaderboard data
router.get('/leaderboard', function(req, res, next) {
    //Get all the users and order them is rank based on wins
    User.find({}, { _id: 0, username: 1, wins: 1, games_played: 1 }).sort({wins: -1}).limit(20).exec( 
        function(err, user) {
            if(err)
                res.send(err);
            res.json(user);
    });
});

//Get all users that are online
router.get('/playersOnline', function(req, res, next) {
    //Find all users whose attribute online is true
    User.find({online: {$eq: true}}, {_id: 0, password: 0}, function(err, user) {
            if(err)
                res.send(err);
            res.json(user);
    });
});

//Add video to users favourites
router.post('/addFavourite', function(req, res, next) {
    console.log(req.body);

    //Extract the data from the request
    var id = req.body.videoId;
    var sub = req.body.subtitle;
    var videoName = req.body.name;

    //Create a video object
    var videoObj = {
        videoId: id,
        name: videoName,
        subtitle: sub,
    }
    try {
        //Check access token for authorisation 
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            User.findOne({'access_token': jwtString}, function(err, user) {
               if(err) {
                   res.send(err);
               } else {
                    //Place video object in the users favourites
                    user.favourites.push(videoObj);
                    user.save();
                    console.log("Favourite added");
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

//Get the users favourite videos
router.get('/getFavourites', function(req, res, next){
    try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            User.findOne({'access_token': jwtString}, function(err, user) {
               if(err) {
                    res.send(err);
               } else {
                    res.send(user.favourites);
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

router.get('/getVideoData', function(req, res, next) {
    var id = req.query.id;
    
    
    try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            Video.findOne({'_id': id}, function(err, video) {
                if(err)
                    res.send(err);
                res.send(video)
            });
        }
        
    }catch (err) {
            /*res.json({
                "status": "error",
                "body": [
                    "You are not logged in."
                ]
            });*/
            res.render('unAuth');
    }
    

});

router.get('/home', function(req, res, next) {
	try {
        var jwtString = req.cookies.Authorization.split(" ");
        var profile = verifyJwt(jwtString[1]);
        if (profile) {
            res.render('home');
        }
        
    }catch (err) {
            /*res.json({
                "status": "error",
                "body": [
                    "You are not logged in."
                ]
            });*/
            res.render('unAuth');
    }
});




module.exports = router;

/*
 Verifies a JWT
 */
 
function verifyJwt(jwtString) {

    var value = jwt.verify(jwtString, 'HomerSimpson');
    return value;
}

