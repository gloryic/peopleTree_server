/*
#그룹 생성 하기
#path : POST /ptree/make/group
#req : int ownPhoneNumber
#res : int status, int groupId
*/

var express = require('express');
var router = express.Router();
var async = require('async');
/*
첫 가입시에는 사용자가 첫 로그인 및 가입을 하게되면 유저는 일인 일 그룹원의 그룹장이 되며 시작된다.
즉 그룹테이블에도 하나의 그룹이 새로 추가되며, 그룹멤버 테이블에도 하나의 그룹원으로 추가가 된다.
*/
router.get('/',function(req,res){
    
	var userPhoneNumber = req.query.userPhoneNumber;
    var userId = req.query.userId;
    var password = req.query.password;
    var userName = req.query.userName;
    var groupName = req.query.groupName;

    if(userPhoneNumber && userId && password && userName && groupName){

	    var idInfoData = [userPhoneNumber,userId,password,userName];
	    console.log("makegroup parameter : " + idInfoData+"/"+groupName);

		async.waterfall([

		  function(callback) {
		    console.log('--- async.waterfall #1 ---');
		    var query = dbcon.query('INSERT INTO idinfo(userPhoneNumber,userId,password,userName) VALUES(?,?,?,?)',idInfoData,function(err,rows){
	        	
		    	if (typeof rows === 'undefined'){
		    		res.json({status :300, errorDesc : "INSERT INTO idinfo - FAIL"});
		    	}
		    	else{
		    		console.log("INSERT INTO idinfo : "+rows.affectedRows);
		    		callback(null, userId);
		    	}
	    	});
		  },

		  function(userId, callback) {
		    console.log('--- async.waterfall #2 ---');
		    var query = dbcon.query('SELECT userNumber FROM idinfo WHERE userId=?',userId,function(err,rows){

	        	if (rows.length == 0){
		    		res.json({status: 300, errorDesc : "SELECT userNumber - FAIL"});
		    	}
		    	else{
		        	console.log("SELECT userNumber : "+rows[0].userNumber);
		        	callback(null, rows[0].userNumber);
		    	}

	    	});
		  },

		  function(userNumber, callback) {
		    console.log('--- async.waterfall #3 ---');
	        var groupRoot = userNumber
	        var groupData = [groupRoot,groupName];
    		console.log("INSERT INTO group parameter : " + groupData);
	        
	        var query = dbcon.query('INSERT INTO grouplist(groupRoot,groupName) VALUES(?,?)',groupData,function(err,rows){
		        
		        if (typeof rows === 'undefined'){
		    		res.json({status: 300, errorDesc : "INSERT INTO grouplist - FAIL"});
		    	}
		    	else{
			        console.log("INSERT INTO grouplist : "+rows.affectedRows);
			        callback(null, userNumber);
		    	}
		  	});
		  },

		  function(userNumber, callback) {
		    console.log('--- async.waterfall #4 ---');
		    var query = dbcon.query('SELECT groupId FROM grouplist WHERE groupRoot=?',userNumber,function(err,rows){

	        	if (rows.length == 0){
		    		res.json({status:300, errorDesc : "SELECT groupId - FAIL"});
		    	}
		    	else{
		        	console.log("SELECT groupId : "+rows[0].groupId);
		        	callback(null, rows[0].groupId, userNumber);
		    	}
	    	});
		  },

		  function(groupId, userNumber, callback) {
		    console.log('--- async.waterfall #5 ---');
	        var groupMemberId = userNumber;
	        var parentGroupMemberId = userNumber;// 첫 그룹은 자기 자신이 부모다

	        var groupMemberData = [groupMemberId,groupId,userNumber,parentGroupMemberId,userId];
	        console.log("INSERT INTO groupmember parameter : " + groupMemberData);
	        //step 5. groupmember에 저장 한다 
	        var query = dbcon.query('INSERT INTO groupmember(groupMemberId,groupId,userNumber,parentGroupMemberId,userId) VALUES(?,?,?,?,?)',groupMemberData,function(err,rows){

		        if (typeof rows === 'undefined'){
		    		res.json({status:300, errorDesc : "INSERT INTO groupmember - FAIL"});
		    	}
		    	else{
			        console.log("INSERT INTO groupmember : "+rows.affectedRows);
			        callback(null, 'done');
		    	}
		    });
	      }
		],

		function(err, results) {
		  console.log('--- async.waterfall result #1 ---');
		  console.log(arguments);
		  if(!err)
		  	res.json({status:200, responseData :"make group success"});
		  else
		  	res.json({status:500, responseData :"make group failed"});
		});
	}
	else{
		res.json({status:300, errorDesc : "parameter Error"});
	}
});

module.exports = router;
