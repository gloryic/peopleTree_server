var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');
var async = require('async');

router.get('/', function(req, res) {

    var userNumber = req.query.userNumber;

	if(userNumber == undefined){
		res.json({status:300, errorDesc : "parameter Error"});
	}

    async.waterfall([

    	  //DB에 반영하고 로그 아웃한다.
    	  //반영 될거, groupmember 테이블의 groupId, edgeStatus, parentGroupMemberId, manageMode, managedLocationRadius
    	  function(callback) {
		    console.log('--- async.waterfall logout #1 ---');

	        tree.hgetall("H/"+userNumber, function(err,obj){

		        if(!err){
		        	if(obj!=null){
		        		var logoutData=[obj.groupId, obj.edgeStatus, obj.parentGroupMemberId, obj.manageMode, obj.managedLocationRadius, userNumber];
						console.log("logoutData : " + logoutData);
						callback(null, logoutData);
					}
					else{
						callback({state:400, errDesc : "not loging User"}, null);
					}
		      	}
		        else
		          callback(err, null);
		    });
		  },

		  function(logoutData,callback) {
		    console.log('--- async.waterfall logout #2 ---');
		    var query = dbcon.query('UPDATE groupmember SET groupId=?, edgeStatus=?, parentGroupMemberId=?, '
		    							+ 'manageMode=?, managedLocationRadius=? WHERE userNumber=?',logoutData,function(err,rows){
	        	
	        	console.log("rows.affectedRows : "+rows.affectedRows);
		    	if (rows.affectedRows == 0){
		    		res.json({status:300, errorDesc : "UPDATE groupmember - update FAIL"});
		    	}
		    	else{
		    		console.log("UPDATE groupmemberId : " + logoutData[5]);
		    		callback(null, logoutData[5]);
		    	}
	    	});
		  },

		  function(userNumber,callback) {
		    console.log('--- async.waterfall logout #2 ---');
			peopleTree.deleteNode(userNumber,function(err,deleteNumber){

				if(deleteNumber==4)
					//내부모의 자식에서 나를 지우고, 나의 해시랑 리스트를 지운다.
					console.log("4 means that parent's child, hash and 2 list is deleted : "+deleteNumber);
				else
					console.log("3 means that hash and 2 list is deleted : "+deleteNumber);

				if(!err)
					callback(null, 'logout-Success');
				else
					callback(null, 'logout-NotSuccess');
			});
		  }
		],
		function(err, results) {
		  console.log('--- async.waterfall logout result #1 ---');
		  console.log(arguments);
		  if(!err)
		  	res.json({status:200, responseData : results});
		  else
		  	res.json(err);
		});
});

module.exports = router;