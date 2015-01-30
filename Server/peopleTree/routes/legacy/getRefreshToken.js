var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');

router.post('/', function(req, res) {

	var grant_type = 'refresh_token';
	var refresh_token = req.body.refresh_token;
	var client_id = '1234567890';
	var client_secret = '75fba1';
	
	request( {
		method: 'POST',
		url: 'https://apis.daum.net/oauth2/token',
		form: {
			grant_type: grant_type,
			refresh_token: refresh_token,
			client_id: client_id,
			client_secret: client_secret,
			redirect_uri : 'http://127.0.0.1:3000/tools/oauth2/oauth_Code'
		}
	}, function(err, response) {
		var value = {"response":response};
		res.send(JSON.stringify(value));
	});

});

module.exports = router;