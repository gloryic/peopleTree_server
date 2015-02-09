var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');
var async = require('async');

/*
#로그인하기
#path : GET /ptree/login
#req : string userId, string password
#res : int userNumber
#e.g : {"status":200,"responseData":{"userNumber":42,"desc":"make hash and list"}}
*/

router.get('/', function(req, res) {

	var userIdOrPhone = req.query.userIdOrPhone;
    var password = req.query.password;

	if( password == undefined || userIdOrPhone == undefined){
		res.json({status:300, errorDesc : "parameter Error"});
	}

    var loginData = [userIdOrPhone,userIdOrPhone,password];
    console.log("loginData : " + loginData);
    async.waterfall([
		  function(callback) {
		    console.log('--- async.waterfall login #1 ---');
		    var query = dbcon.query('SELECT userNumber FROM idinfo WHERE (userId=? OR userPhoneNumber=?) AND password=?',loginData,function(err,rows){
	        	console.log("rows.length : "+rows.length);
		    	if (rows.length == 0){
		    		res.json({status:300, errorDesc : "SELECT FROM idinfo - Login FAIL"});
		    	}
		    	else{
		    		console.log("SELECT FROM idinfo : "+ rows[0].userNumber);
		    		callback(null, rows[0].userNumber);
		    	}
	    	});
		  },
		  function(userNumber,callback) {
		    console.log('--- async.waterfall login #2 ---');
			peopleTree.insertNode(userNumber,function(err,res){
				if(!err)
					callback(null, res);
				else
					callback(err, 'login-fail');
			});
		  }
		],
		function(err, results) {
		  console.log('--- async.waterfall result login #1 ---');
		  if(!err)
		  	res.json({status:200, responseData : results});
		  else
		  	res.json({status:400, errorDesc : err});
		});
});

module.exports = router;