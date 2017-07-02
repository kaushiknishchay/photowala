var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.Promise = global.Promise;

var options = {
	useMongoClient: false,
	keepAlive: 1
	// user: 'theleo',
	// pass: 'th3l30'
};


var dbHostLocal = 'mongodb://localhost:27017/photography';

mongoose.connect(dbHost, options);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
	console.log('connected');
});

module.exports = db;
