/*사용자 정보 가져오기
#path : GET /getinfo/group/member
#req : int userId, int groupId
#res : int userId, int userName, int userPhoneNumber, int edgeType, int edgeStatus, double longitude, double latitude
*/

var express = require('express');
var router = express.Router();

router.get('/group/member',function(req,res){

	var data, data2, longitude, latitude;
	var userId = req.query.userId;
    var userPhoneNumber = req.query.userPhoneNumber;
	var queryString="";

	if(userId == undefined && userPhoneNumber == undefined){
		res.json({"status":300});
	}
	else if(userPhoneNumber == undefined){
		queryString = 'SELECT userId, userNumber, userPhoneNumber, userName FROM idinfo WHERE userId='+"'"+userId+"'";
	}
	else if(userId == undefined){
		queryString = 'SELECT userId, userNumber, userPhoneNumber, userName FROM idinfo WHERE userPhoneNumber='+"'"+userPhoneNumber+"'";
	}
	else{
		queryString = 'SELECT userId, userNumber, userPhoneNumber, userName FROM idinfo WHERE userId='+"'"+userId+"'" + ' AND userPhoneNumber='+"'"+userPhoneNumber+"'";
	}

	console.log(queryString);

	var query = dbcon.query(queryString, function(err,rows){
		if(err){
            	console.log(err);
            	res.json({"status":400});
            }
            else{
                if(rows.length == 1){

                	data = rows[0];
                	console.log("userNumber: "+data.userNumber);

                	var query = dbcon.query('SELECT groupMemberId, groupId, userId, edgeStatus, parentGroupMemberId FROM groupmember WHERE userNumber=?', data.userNumber, function(err,rows){
			            console.log(err);
			            if(err){
			            	console.log(err);
			            	res.json({"status":400});
			            }
			            else{
			                if(rows.length == 1){
								data2 = rows[0];

								peopleTree.getItems(data2.groupId,data2.groupMemberId,function(err,obj){

									console.log("redis_obj : "+obj);

									if(obj!=null){
										latitude = obj.latitude;
					    	    		longitude = obj.longitude;
									}
									else{
										latitude = null;
					    	    		longitude = null;
										console.log("redis_err : "+ err);
									}

									console.log("location : "+latitude +"/"+ longitude);

				                    res.json({"status":200, responseData :  {
				                    											"userId":data.userId,
				                    											"userNumber":data.userNumber,
				                    											"groupMemberId":data2.groupMemberId,
				                    											"parentGroupMemberId":data2.parentGroupMemberId,
				                    											"userName":data.userName, 
				                    											"groupId":data2.groupId,
												                                "userPhoneNumber":data.userPhoneNumber,
												                                "edgeStatus":data2.edgeStatus, 
												                                "longitude" : longitude,
												                                "latitude" : latitude
												                            }
									});
								});
			                }
			                else{
			                     res.json({"status":401});
			                }
			            }
				    });
                }
                else{
			        res.json({"status":401});
			    }
            }
    });
});

module.exports = router;
