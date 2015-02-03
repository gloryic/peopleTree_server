/*사용자 정보 가져오기
#path : GET /getinfo/group/member
#req : int userId, int groupId
#res : int userId, int userName, int userPhoneNumber, int edgeType, int edgeStatus, double longitude, double latitude
*/

var express = require('express');
var router = express.Router();

router.get('/group/member',function(req,res){

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

                	var query = dbcon.query('SELECT groupMemberId, groupId, userId, edgeStatus, parentGroupMemberId,' 
                								+ 'manageMode, managedLocationRadius FROM groupmember WHERE userNumber=?', data.userNumber, function(err,rows){
			            console.log(err);
			            if(err){
			            	console.log(err);
			            	res.json({status:400});
			            }
			            else{
			                if(rows.length == 1){
								data2 = rows[0];

								peopleTree.getItems(data2.groupMemberId,function(err,obj){

									//로그인 상태라면 메모리에서 값을 읽어온다.
									if(obj!=null){
										latitude = obj.latitude;
					    	    		longitude = obj.longitude;
					    	    		managingTotalNumber = obj.managingTotalNumber;
					    	    		managingNumber = obj.managingNumber;
									}
									else{
										latitude = null;
					    	    		longitude = null;
					    	    		managingNumber = 0;
					    	    		managingTotalNumber = 0;
										console.log("redis_err : "+ err);
									}

									console.log("location : "+latitude +"/"+ longitude);

				                    res.json({status:200, responseData :  {
				                    											"userId":data.userId,
				                    											"userNumber":data.userNumber,
				                    											"groupMemberId":data2.groupMemberId,
				                    											"parentGroupMemberId":data2.parentGroupMemberId,
				                    											"userName":data.userName, 
				                    											"groupId":data2.groupId,
												                                "userPhoneNumber":data.userPhoneNumber,
												                                "edgeStatus":data2.edgeStatus,
												                                "manageMode":data2.manageMode,
												                                "managedLocationRadius":data2.managedLocationRadius,
												                                "longitude" : parseFloat(longitude),
												                                "latitude" : parseFloat(latitude),
												                                "managingTotalNumber" : parseInt(managingTotalNumber),
												                                "managingNumber" : parseInt(managingNumber)
												                            }
									});
								});
			                }
			                else{
			                     res.json({status:401});
			                }
			            }
				    });
                }
                else{
			        res.json({status:401});
			    }
            }
    });
});

module.exports = router;
