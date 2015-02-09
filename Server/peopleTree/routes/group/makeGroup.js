var express = require('express');
var router = express.Router();
var async = require('async');
var mysql = require('mysql');
/*
첫 가입시에는 사용자가 첫 로그인 및 가입을 하게되면 유저는 일인 일 그룹원의 그룹장이 되며 시작된다.
즉 그룹테이블에도 하나의 그룹이 새로 추가되며, 그룹멤버 테이블에도 하나의 그룹원으로 추가가 된다.
*/

/*
#그룹 생성 하기
#path : POST /ptree/make/group
#req : string userPhoneNumber, int userId, int password, string userName, string groupName
#res : int userNumber, int groupId
#e.g : {"status":200,"responseData":{"userNumber":45,"message":"make group success"}}
*/
router.get('/',function(req,res){
    
	var userPhoneNumber = mysql.escape(req.query.userPhoneNumber).replace(/'/g,'');
    var userId = mysql.escape(req.query.userId).replace(/'/g,'');
    var password = mysql.escape(req.query.password).replace(/'/g,'');
    var userName = mysql.escape(req.query.userName).replace(/'/g,'');
    var groupName = mysql.escape(req.query.groupName).replace(/'/g,'');

    if(userPhoneNumber && userId && password && userName && groupName){

	    var idInfoData = [userPhoneNumber,userId,password,userName];
	    var checkData = [userId,userPhoneNumber];
	    console.log("makegroup parameter : " + idInfoData+"/"+groupName);


		async.waterfall([

		  function(callback) {
			console.log('--- async.waterfall joinin #0 ---');
			  dbcon.beginTransaction(function(err) {
			  	if(!err) callback(null);
			  	else callback(err.message);
			});
		  },

		  function(callback) {
		    console.log('--- async.waterfall joinin #1 ---');
		    var query = dbcon.query('SELECT 1 FROM idinfo WHERE userId=? AND userPhoneNumber=?',checkData,function(err,rows){
	        	console.log("rows.length : "+rows.length);
	        	if(!err){
			    	if (rows.length == 1) callback("joinin FAIL - already join in member",null);
			    	else callback(null);
			    }
			    else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});
			    }
	    	});
		  },

		  function(callback) {
		    console.log('--- async.waterfall joinin #2 ---');
		    var query = dbcon.query('INSERT INTO idinfo(userPhoneNumber,userId,password,userName) VALUES(?,?,?,?)',idInfoData,function(err,rows){
		    	if(!err){
		    		console.log("INSERT INTO idinfo : "+rows.affectedRows);
		    		callback(null, userId);
		    	}
		    	else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});
		    	}
	    	});
		  },

		  function(userId, callback) {
		    console.log('--- async.waterfall joinin #3 ---');
		    var query = dbcon.query('SELECT userNumber FROM idinfo WHERE userId=?',userId,function(err,rows){
		    	if(!err){
		        	if (rows.length == 0){
			    		callback("SELECT userNumber - FAIL",null);
			    	}
			    	else{
			        	console.log("SELECT userNumber : "+rows[0].userNumber);
			        	callback(null, rows[0].userNumber);
			    	}
			    }
			    else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});
			    }
	    	});
		  },

		  function(userNumber, callback) {
		    console.log('--- async.waterfall joinin #4 ---');
	        var groupRoot = userNumber
	        var groupData = [groupRoot,groupName];
    		console.log("INSERT INTO group parameter : " + groupData);
	        
	        var query = dbcon.query('INSERT INTO grouplist(groupRoot,groupName) VALUES(?,?)',groupData,function(err,rows){
		        if (!err){
			        console.log("INSERT INTO grouplist : "+rows.affectedRows);
			        callback(null, userNumber);		        	
		    	}
		    	else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});
		    	}
		  	});
		  },

		  function(userNumber, callback) {
		    console.log('--- async.waterfall joinin #5 ---');
		    var query = dbcon.query('SELECT groupId FROM grouplist WHERE groupRoot=?',userNumber,function(err,rows){
		    	if(!err){
		        	if (rows.length == 0){
			    		callback("SELECT groupId - FAIL",null);
			    	}
			    	else{
			        	console.log("SELECT groupId : "+rows[0].groupId);
			        	callback(null, rows[0].groupId, userNumber);
			    	}
			    }
			    else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});
			    }
	    	});
		  },

		  function(groupId, userNumber, callback) {
		    console.log('--- async.waterfall joinin #6 ---');
	        var groupMemberId = userNumber;
	        var parentGroupMemberId = userNumber;// 첫 그룹은 자기 자신이 부모다

	        var groupMemberData = [groupMemberId,groupId,userNumber,parentGroupMemberId,userId];
	        console.log("INSERT INTO groupmember parameter : " + groupMemberData);
	        //step 5. groupmember에 저장 한다 
	        var query = dbcon.query('INSERT INTO groupmember(groupMemberId,groupId,userNumber,parentGroupMemberId,userId) VALUES(?,?,?,?,?)',groupMemberData,function(err,rows){

		        if (!err){
		        	console.log("INSERT INTO groupmember : "+rows.affectedRows);
			        callback(null);
		    	}
		    	else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});	
		    	}
		    });
	      },

		  function(callback) {
		    console.log('--- async.waterfall joinin #7 ---');
		    var query = dbcon.query('SELECT userNumber FROM idinfo WHERE userId=? AND userPhoneNumber=?',checkData, function(err,rows){
	        	console.log("rows.length : "+rows.length);

	        	if(!err){
			    	if (rows.length == 0){
			    		callback("SELECT FROM idinfo - joinin FAIL",null);
			    	}
			    	else{
			    		console.log("SELECT FROM idinfo : "+ rows[0].userNumber);
			    		callback(null, rows[0].userNumber);
			    	}
			    }
			    else{
			      	dbcon.rollback(function () {
                    	console.error('rollback error');
                    	callback(err.message);
                  	});	
			    }
	    	});
		  },

		  function(userNumber, callback){
		  	console.log('--- async.waterfall joinin #8 ---');
            dbcon.commit(function (err) {
                if(err){
                    dbcon.rollback(function () {
                    	console.error('rollback error');
                        callback(err.message,null);
                    });
                }
                else callback(null, userNumber);
			 });
		  }
		],

		function(err, userNumber) {
		  console.log('--- async.waterfall result #1 ---');
		  console.log(arguments);
		  if(!err)
		  	res.json({status:200, responseData : {userNumber:userNumber, message:"make group success"}});
		  else
		  	res.json({status:300, errorDesc :err});
		});
	}
	else{
		res.json({status:300, errorDesc : "parameter Error"});
	}
});

module.exports = router;
