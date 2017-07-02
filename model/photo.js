/**
 * Created by SHolmes on 01-Jul-17.
 */
var mongoose =  require('mongoose');
var Schema = mongoose.Schema;
mongoose.set('debug', true);

var photoSchema = new Schema({
	name: String,
	collectionName: String,
	url: String,
	thumb: String,
	camera: String,
	focal: String,
	aperture: String,
	exposure: String,
	iso: String,
	date: String

});

var Photo = mongoose.model('Photo', photoSchema, 'photos');

module.exports = Photo;