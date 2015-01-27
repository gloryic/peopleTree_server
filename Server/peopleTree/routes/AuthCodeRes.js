var express = require('express');
var router = express.Router();//Create a new router with express.Router():
var request = require('request');
var url = require('url');
var http = require('http');

var header_res = '';
var r = request.get('https://apis.daum.net/oauth2/authorize', function(err, res, body) {
	//console.log('RES');
	//console.log(res);
	//header_res += res.uri.href;
	//출력할때 undefined...!!!!!!!

	//console.log("RESPONSE!");
	//console.log(res.info);
	//console.log(res.reasonPhrase);
	header_res += res.protocol+"/"+res.httpVersion + "  " + res.statusCode + '\n';
	for(var header in res.headers) {
		header_res += (header+ " : " + res.headers[header] + '\n');
	}
});

router.get('/', function(req, res) {
	/* Query값 갖고오기 */
	var authcode = req.query.code;
	//var data = { 'code' : authcode };
	//var authcode = JSON.parse(data);
	var oauth_parameter = '';
	var header_req = '';
	var value = JSON.stringify({'code' : authcode}, null, 4);

	//console.log("???????/");
	//console.log(res.protocol+"/"+res.httpVersion + "  " + res.statusCode + " " + res.reasonPhrase);
	//oauth parameter
	var parameter = {
		client_id : '1234567890',
		redirect_uri : '/',
		response_type : 'code',
	};	
	oauth_parameter = JSON.stringify(parameter, null, 4);

	// request url, method
	header_req += req.method + ' ' + req.url + ' ' + req.protocol+'/'+req.httpVersion + '\n';

	//request header 목록 출력
	for(var header in req.headers) {
		header_req += (header+ ' : ' + req.headers[header] + '\n');
	}

	res.render('step_all', {
			title: 'OAuth2 Playground',
			value : value,
			oauth_parameter : oauth_parameter,
			header_req : header_req,
			header_res : header_res,
			authcode : authcode,
	});
});	

module.exports = router;//모듈화