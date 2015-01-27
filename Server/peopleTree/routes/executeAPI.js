var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');

router.post('/', function(req, res) {

	var userAgent = req.body.userAgent;
	var URI = req.body.URI;

	request( {
		method: 'GET',
		url: URI,
		headers: {'userAgent': userAgent},
	}, function(err, response) {
		var value = {"response":response};
		res.send(JSON.stringify(value));
	});
});

module.exports = router;