var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.set('debug', true);

var userSchema = new Schema({
	username: String,
	password: String
});

var User = mongoose.model('User', userSchema, 'users');

module.exports = User;