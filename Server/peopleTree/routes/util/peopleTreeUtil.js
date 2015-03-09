var express = require('express');
var router = express.Router();

/*
#userPhoneNumber, userName, userId 중 하나를 통해서 로그인 된 유저의 정보 가져오기
#path : GET /util/searchMember
#req : String keyword
#res : {"status":200,"responseData":{"groupMembersNumber":3,"groupMembersInfo":[{...},{...},{...}]}}
#e.g : 
*/

router.get('/searchMember', function(req, res) {
	//userPhoneNumber, userName, userId
	var keyword = req.query.keyword;

	//groupMemberId 해쉬가 있느냐
	//userName, userId으로 groupMemberId 가져와 해쉬가 있느냐
	var curInfo={};
	var arrInfo=[];
	var groupMemberId;
	var searchArr = [keyword, keyword, keyword];
	var queryString='SELECT userNumber FROM idinfo WHERE userId=? OR userPhoneNumber=? OR userName=?';

	console.log(queryString+"/"+keyword);

	var query = dbcon.query(queryString, searchArr, function(err,rows){
		//console.log("rows.length : "+rows.length);
		if(!err){
			if (rows.length == 0)
				res.json({status:200, responseData : {groupMembersNumber : arrInfo.length, groupMembersInfo : arrInfo} });
			else{	
				
				var length = rows.length;
                var count = length-1;

                rows.forEach(function (row) {
                	groupMemberId = row.userNumber;
                	console.log("groupMemberId : "+groupMemberId);

					peopleTree.getItems(groupMemberId,function(err,obj){

						if(!err){
							if(obj){
								console.log(obj.userName);
			                    arrInfo.push({
        											"userId":obj.userId,
        											"userNumber":parseInt(obj.userNumber),
        											"groupMemberId":parseInt(obj.groupMemberId),
        											"parentGroupMemberId":parseInt(obj.parentGroupMemberId),
        											"userName":obj.userName,
        											"groupId":parseInt(obj.groupId),
					                                "userPhoneNumber": obj.userPhoneNumber,
					                                "edgeStatus":parseInt(obj.edgeStatus),
					                                "edgeType" : parseInt(obj.edgeType),
					                                "manageMode":parseInt(obj.manageMode),
					                                "managedLocationRadius":parseFloat(obj.managedLocationRadius),
					                                "latitude" : parseFloat(obj.latitude),
					                                "longitude" : parseFloat(obj.longitude),
					                                "managingTotalNumber" : parseInt(obj.managingTotalNumber),
					                                "managingNumber" : parseInt(obj.managingNumber),
					                                "accumulateWarning" : parseInt(obj.accumulateWarning)
					                            });
							}
							if(!count--) res.json({status:200, responseData : {groupMembersNumber : arrInfo.length, groupMembersInfo : arrInfo} });
						}
						else
							res.json({status:404, errorDesc : err});			
					});
	
				});
				if(!length) res.json({status:200, responseData : {groupMembersNumber : arrInfo.length, groupMembersInfo : arrInfo} });
			}
		}
		else 
			res.json({status:500, responseData : err.message});
	});
});


/*
#트리구조 가져오기
#path : POST  /util/showTree
#req : int groupMemeberId
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


router.get('/showTreeV2', function(req, res) {

	var rootGroupMemberId = req.query.rootGroupMemberId;
	peopleTree.isExist(rootGroupMemberId, function(err,flag){
		if(!err){
			if(flag){
				peopleTree.showTreeV2(rootGroupMemberId, function(err,obj){
					res.jsonp(obj);
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

router.get('/getUserNameFromID',function(req,res){

	var userName = req.query.userName;
	var queryString = 'SELECT userNumber FROM idinfo WHERE userName=?';

	var query = dbcon.query(queryString,userName,function(err,rows){
		if(err){
            	console.log(err);
            	res.json({status:500, errorDesc : "RDBMS error"});
        }
        else
        	res.json(rows[0].userNumber);
    });
});

module.exports = router;