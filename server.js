var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/User');

var apiRoutes = express.Router();

var port = 8080;
mongoose.connect(config.database);
app.set('superSecret', config.secret);


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(morgan('dev'));

apiRoutes.use(function(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if(token){
		jwt.verify(token, app.get('superSecret'), function(err, decoded){
			if(err){
				return res.jsoN({
					success: false,
					message: 'Failed to Authenticate token'
				});
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}

});

apiRoutes.get('/', function(req, res){
	res.send('Hello! This is my API');
});

apiRoutes.get('/users', function(req, res){
	User.find({}, function(err, users){
		res.json(users);
	});
});
apiRoutes.post('/authenticate', function(req, res){
	console.log('POST');
	User.findOne({
		name: req.body.name
	}, function(err, user){
		if(err) throw err;
		if(!user){
			res.json({
				success:false,
				message: 'Authentication failed. Wrong password.'
			});
		} else {
			var token = jwt.sign(user, app.get('superSecret'), {
				expiresInMinutes: 1440 //24hours
			});
			res.json({
				succes: true,
				message: 'Token sent',
				token: token
			});
		}
	});
});

app.use('/api', apiRoutes);
app.listen(port);
console.log('Starting @port:' + port);


app.get('/setup', function(req, res){
	var admin = new User({
		name: 'admin', 
		password: 'admin1',
		admin: true
	});

	admin.save(function(err){
		if(err) throw err;
		console.log('User Saved');
		res.json({success: true});
	});
});