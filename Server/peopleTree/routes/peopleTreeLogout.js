var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');
var async = require('async');

router.get('/', function(req, res) {

	var userPhoneNumber = req.query.userPhoneNumber;
    var userId = req.query.userId;

	if(userId == undefined && userPhoneNumber == undefined){
		res.json({"status":300, errorDesc : "parameter Error"});
	}
	else if(userPhoneNumber == undefined){
		userPhoneNumber = 0;
	}
	else if(userId == undefined){
		userId = 0;
	}

    var logoutData = [userPhoneNumber,userId];
    console.log("logoutData : " + logoutData);

    async.waterfall([

    	/*
		  function(callback) {
		    console.log('--- async.waterfall #1 ---');
		    var query = dbcon.query('SELECT 1 FROM idinfo WHERE	(userId=? OR userPhoneNumber=?) AND password=?',loginData,function(err,rows){
	        	console.log("rows.length : "+rows.length);
		    	if (rows.length == 0){
		    		res.json({status:300, errorDesc : "SELECT FROM idinfo - Login FAIL"});
		    	}
		    	else{
		    		console.log("SELECT FROM idinfo : "+ rows[0]);
		    		callback(null, userId);
		    	}
	    	});
		  },
		  */

		  function(userId,callback) {
		    console.log('--- async.waterfall insertNode #1 ---');
			peopleTree.insertNode(userId,function(res){
				console.log("insertNode : "+JSON.stringify(res));
				callback(null, 'login-Success');
			});
		  }
		],
		function(err, results) {
		  console.log('--- async.waterfall result #1 ---');
		  console.log(arguments);
		  res.json({status:'200', responseData : results});
		});
});

module.exports = router;