/*사용자 정보 가져오기
#path : GET /getinfo/group/member
#req : int userId, int groupId
#res : int userId, int userName, int userPhoneNumber, int edgeType, int edgeStatus, double longitude, double latitude
*/

var express = require('express');
var router = express.Router();

router.get('/group/member',function(req,res){

	console.log("##getCurInfo##");

	var data, data2, longitude, latitude;
	var queryString="";
	
	var userNumber = req.query.userNumber;

	if(userNumber == undefined){
		res.json({status:300});
	}
	else{
		queryString = 'SELECT 1 FROM idinfo WHERE userNumber='+"'"+userNumber+"'";
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
				peopleTree.getItems(userNumber,function(err,obj){

					if(!err){
						if(obj){
				                    res.json({status:200, responseData :  {
				                    											"userId":obj.userId,
				                    											"userNumber":parseInt(obj.userNumber),
				                    											"groupMemberId":parseInt(obj.groupMemberId),
				                    											"parentGroupMemberId":parseInt(obj.parentGroupMemberId),
				                    											"userName":obj.userName, 
				                    											"groupId":parseInt(obj.groupId),
												                                "userPhoneNumber":parseInt(obj.userPhoneNumber),
												                                "edgeStatus":parseInt(obj.edgeStatus),
												                                "manageMode":parseInt(obj.manageMode),
												                                "managedLocationRadius":parseFloat(obj.managedLocationRadius),
												                                "latitude" : parseFloat(obj.latitude),
												                                "longitude" : parseFloat(obj.longitude),
												                                "managingTotalNumber" : parseInt(obj.managingTotalNumber),
												                                "managingNumber" : parseInt(obj.managingNumber)
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
