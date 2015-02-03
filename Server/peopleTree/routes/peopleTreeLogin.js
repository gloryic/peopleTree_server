var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');
var async = require('async');

router.get('/', function(req, res) {

	var userPhoneNumber = req.query.userPhoneNumber;
    var userId = req.query.userId;
    var password = req.query.password;

	if( password == undefined || (userId == undefined && userPhoneNumber == undefined)){
		res.json({status:300, errorDesc : "parameter Error"});
	}
	else if(userPhoneNumber == undefined){
		userPhoneNumber = 0;
	}
	else if(userId == undefined){
		userId = 0;
	}

    var loginData = [userId,userPhoneNumber,password];
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