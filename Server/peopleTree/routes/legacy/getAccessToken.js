var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');

router.get('/', function(req, res) {

	var grant_type = 'authorization_code';
	var authcode = req.cookies.auth_code;
	var client_id = '1234567890';
	var client_secret = '75fba1';

	request( {
		method: 'POST',
		url: 'https://apis.daum.net/oauth2/token',
		form: {
			grant_type: grant_type,
			code: authcode,
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


