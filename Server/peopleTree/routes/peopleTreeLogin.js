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
		res.json({"status":300});
	}
	else if(userPhoneNumber == undefined){
		userPhoneNumber = 0;
	}
	else if(userId == undefined){
		userId = 0;
	}

    var loginData = [userPhoneNumber,userId,password];
    console.log("loginData : " + loginData);
    async.waterfall([

		  function(callback) {
		    console.log('--- async.waterfall #1 ---');
		    var query = dbcon.query('SELECT 1 FROM idinfo WHERE	(userId=? OR userPhoneNumber=?) AND password=?',loginData,function(err,rows){
	        	console.log("rows.length : "+rows.length);
		    	if (rows.length == 0){
		    		res.json({"status":"SELECT FROM idinfo - Login FAIL"});
		    	}
		    	else{
		    		console.log("SELECT FROM idinfo : "+ rows[0]);
		    		callback(null, userId);
		    	}
	    	});
		  },

		  function(userId,callback) {
		    console.log('--- async.waterfall insertNode #2 ---');
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