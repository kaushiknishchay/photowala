var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;

// define the schema for our user model
var userSchema = new Schema({

	username: {
		type: String
	},
	password: {
		type: String
	}

});

// create the model for users and expose it to our app
var User = module.exports = mongoose.model('User', userSchema);


module.exports.createUser = function (newUser, call) {
	bcrypt.genSalt(10, function (err, salt) {
		bcrypt.hash(newUser.password, salt, function (err, hash) {
			newUser.password = hash;
			newUser.save(call);
		});
	});
};