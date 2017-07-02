var express = require('express');
var router = express.Router();
var Photo = require('../model/photo');
var mongoose = require('mongoose');

var dbHost = 'mongodb://theleo:th3l30@ds143532.mlab.com:43532/photography';
var db = mongoose.createConnection(dbHost, {useMongoClient: false});


// function Photo() {
// 	this.name = '';
// 	this.url = '';
// 	this.date= '';
// 	this.camera = '';
// 	this.focal = '';
// 	this.aperture = '';
// 	this.exposure = '';
// 	this.iso = '';
//
// }

/* GET home page. */
router.get('/', function (req, res, next) {

	// console.log(Photo);
	//
	// Photo.find({}, function (err, docs) {
	// 	console.log('a'+docs);
	// });

	var p = new Photo();
	p.name = 'Test';
	p.url = "http://lorempixel.com/640/480/nature/1";
	p.date = '30/06/2017';
	p.camera = 'DSLR';
	p.focal = '22.5mm';
	p.aperture = '51.6';
	p.exposure = '1/1000';
	p.iso = '80';



	var photos1 =[];
	// console.log(p);

	var photos = {
		"Nature": [
			p,
			{name: 'Test', url: "http://lorempixel.com/640/480/nature/2"},
			{name: 'Test', url: "http://lorempixel.com/640/480/nature/3"},
			{name: 'Test', url: "http://lorempixel.com/640/480/nature/4"},

		],
		"Sports": [
			{name: 'Test 1', url: "http://lorempixel.com/640/480/sports/1"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/sports/2"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/sports/3"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/sports/4"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/sports/5"},
		],
		"Fashion": [
			{name: 'Test 1', url: "http://lorempixel.com/640/480/fashion/1"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/fashion/2"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/fashion/3"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/fashion/4"},
			{name: 'Test 1', url: "http://lorempixel.com/640/480/fashion/5"},
		]
	};

	var collectionArray = [];

	db.collection('photos').distinct('collectionName', function (error, names) {
		names.forEach(function (name) {
			collectionArray.push(name);
		});

		var itemA = 1;
		for (var i = 0; i < collectionArray.length; i++) {
			let name = collectionArray[i];
			console.log(name);

			var colPhotos = [];
			db.collection('photos').find({collectionName: name}).forEach(function (photo) {
				colPhotos.push(photo);
			}, function callback() {
				itemA++;
				photos1[name] = colPhotos;
				console.log(name);
				console.log(colPhotos);
				console.log(photos1);
				colPhotos = [];
				if (itemA > collectionArray.length) {
					//render
					console.log(collectionArray);
					console.log(photos1);
					res.render('index', {title: 'Nayak', photos: photos1});
				}
			});
		}
	});
});

module.exports = router;
