var express = require('express');
var router = express.Router();

/*
#디바이스 상태 체크 및 위치 기록 및 위치 체크
#path : POST /ptree/location/checkMember
#req : int groupMemeberId, int statusCode, double latitude, double longtitude, int fpId
#res : 
#e.g : 
*/

router.get('/searchMember', function(req, res) {
	//userPhoneNumber, userName, userId
	var keyword = req.query.keyword;

	//groupMemberId 해쉬가 있느냐
	//userName, userId으로 groupMemberId 가져와 해쉬가 있느냐

	var searchArr = [keyword, keyword, keyword];
	var queryString='SELECT userId, userNumber, userPhoneNumber, userName FROM idinfo WHERE userId=? OR userPhoneNumber=? OR userName=?';
	console.log(queryString);

	var query = dbcon.query(queryString, function(err,rows){
		console.log("rows.length : "+rows.length);

		if (rows.length == 0){

			res.json({status:300, errorDesc : "SELECT FROM idinfo - Login FAIL"});
		}

		else{
			res.json({status:300, errorDesc : "SELECT FROM idinfo - Login FAIL"});
		}

	});



	peopleTree.isExist(groupMemberId,function(){



	});








});



/*
#디바이스 상태 체크 및 위치 기록 및 위치 체크
#path : POST /ptree/location/checkMember
#req : int groupMemeberId, int statusCode, double latitude, double longtitude, int fpId
#res : 
#e.g : 
*/
router.get('/showTree', function(req, res) {

	var rootGroupMemberId = req.query.rootGroupMemberId;
	peopleTree.isExist(rootGroupMemberId, function(err,flag){
		if(!err){
			if(flag){
				global.callNumber = 0;
				global.treeJson = [{id : parseInt(rootGroupMemberId), children:[]}];
				var position = treeJson;
				callNumber++;
				console.log("root callNumber1 : "+ callNumber);
				peopleTree.showTree(rootGroupMemberId ,position, 0, function(obj){
					console.log("root callNumber2 : "+ callNumber);
					if(callNumber==0) res.json(treeJson);
				});
			}
			else{
				res.json({status:200,errorDesc:"not exist groupMemberId"});
			}
		}
		else{
			res.json({status:500,errorDesc:"redis error"});
		}
	});
});