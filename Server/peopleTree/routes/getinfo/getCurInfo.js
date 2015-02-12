var express = require('express');
var router = express.Router();

/*
#사용자 정보 가져오기
#path : GET /getinfo/group/member
#req : int userNumber
#res : int userId, string userNumber, int groupMemberId, int parentGroupMemberId, string userName, 
	   int groupId, string userPhoneNumber, int edgeStatus, int edgeType, int manageMode, 
	   double managedLocationRadius, double latitude, double longitude, int managingTotalNumber,
	   int managingNumber, int accumulateWarning
#e.g :
		{			
			"userId":"glory1",
			"userNumber":1,
			"groupMemberId":11,
			"parentGroupMemberId":1,
			"userName":"영광",
			"groupId":1,
			"userPhoneNumber":1028791924,
			"edgeStatus":200, // 200 - 정상, 300 - 비정상
			"edgeType" : 100, // 100 - 정보 보고 관계, 200 - 위치 관리 관계 
			"manageMode":200, // 200 - nothing 모드, 210 - 트레킹 모드, 220 - 지역모드, 230 - 지오펜스모드
		    "managedLocationRadius":0,
		    "latitude": null,
		    "longitude": null,
			"managingTotalNumber":0,
		    "managingNumber":0,
		    "accumulateWarning":0
		}
*/

router.get('/group/member',function(req,res){

	console.log("##getCurInfo##");

	var data, data2, longitude, latitude;
	var queryString="";
	
	var groupMemberId = req.query.groupMemberId;

	if(groupMemberId == undefined){
		res.json({status:300});
	}
	else{
		queryString = 'SELECT 1 FROM idinfo WHERE userNumber='+"'"+groupMemberId+"'";
	}

	console.log(queryString);

	var query = dbcon.query(queryString, function(err,rows){
		if(err){
            	console.log(err);
            	res.json({status:500, errorDesc : "RDBMS error"});
        }
        else{
            if(rows.length == 1){
            	//로그인 상태라면 메모리에서 값을 읽어온다.
				peopleTree.getItems(groupMemberId,function(err,obj){
					if(!err){
						if(obj){
							console.log(obj.userName);
				                    res.json({status:200, responseData :  {
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
												                                "accumulateWarning" : parseInt(obj.accumulateWarning),
												                                "fpId" : parseInt(obj.fpId)
												                            }
											});
						}
						else
							res.json({status:404, responseData : "not login user"});
					}
					else
						res.json({status:500, responseData : err.message});
				});
            }
            else{
		        res.json({status:401});
		    }
        }
    });
	
});

module.exports = router;
