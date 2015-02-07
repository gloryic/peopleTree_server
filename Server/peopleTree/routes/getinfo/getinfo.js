var express = require('express');
var router = express.Router();

/*
# RDB만을 참조해서 사용자 정보 가져오기
#path : GET /_getinfo/group/member
#req : int userNumber
#res : int userId, int userNumber, int groupMemberId, int parentGroupMemberId, string userName, 
	   int groupId, int userPhoneNumber, int edgeStatus, int edgeType, int manageMode, 
	   double managedLocationRadius, double latitude, double longitude, int managingTotalNumber,
	   int managingNumber, int accumulateWarning
*/

router.get('/group/member',function(req,res){

	console.log("##_getInfo##");
	var data, data2, longitude, latitude;
	var queryString="";
	
	var userNumber = req.query.userNumber;

	if(userNumber == undefined){
		res.json({status:300});
	}
	else{
		queryString = 'SELECT userId, userNumber, userPhoneNumber, userName FROM idinfo WHERE userNumber='+"'"+userNumber+"'";
	}

	console.log(queryString);

	var query = dbcon.query(queryString, function(err,rows){
		if(err){
            	console.log(err);
            	res.json({status:500, errorDesc : "RDBMS error"});
            }
            else{
                if(rows.length == 1){

                	data = rows[0];
                	console.log("userNumber: "+data.userNumber);

                	var query = dbcon.query('SELECT groupId FROM groupmember WHERE userNumber=?', data.userNumber, function(err,rows){
			            console.log(err);
			            if(err){
			            	console.log(err);
			            	res.json({status:400, errDesc:"RDBMS error"});
			            }
			            else{
			                if(rows.length == 1){
								data2 = rows[0];

				                    res.json({status:200, responseData :  {
				                    											"userId":data.userId,
				                    											"userNumber":data.userNumber,
				                    											"groupMemberId":data.userNumber,//data2.groupMemberId,
				                    											"parentGroupMemberId":data.userNumber,//data2.groupMemberId,//data2.parentGroupMemberId,
				                    											"userName":data.userName,
				                    											"groupId":data2.groupId,
												                                "userPhoneNumber":data.userPhoneNumber,
												                                "edgeStatus": 100,//data2.edgeStatus, 100 - nothing, 200 - 정상상태, 300- 비정상 
												                                "edgeType" : 100,//100 혼자니까 정보 보고관계 
												                                "manageMode" : 200,//data2.manageMode,  관리자로 시작
												                                "managedLocationRadius": 0,//data2.managedLocationRadius,
												                                "latitude" : null,
												                                "longitude" : null,
												                                "managingTotalNumber" : 0,
												                                "managingNumber" : 0,
												                                "accumulateWarning" : 0
												                            }
									});
			                }
			                else{
			                     res.json({status:401, errDesc:"RDBMS error"});
			                }
			            }
				    });
                }
                else{
			        res.json({status:401, errDesc:"RDBMS error"});
			    }
            }
    });
});

module.exports = router;
