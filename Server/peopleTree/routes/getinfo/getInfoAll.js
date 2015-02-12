var express = require('express');
var async = require('async');
var router = express.Router();

/*
#부모, 자식들, 나 정보 가져오기
#path : GET /getinfoall/group/member
#req : int userNumber
#res : int userId, int userNumber, int groupMemberId, int parentGroupMemberId, string userName, 
	   int groupId, string userPhoneNumber, int edgeStatus, int edgeType, int manageMode, 
	   double managedLocationRadius, double latitude, double longitude, int managingTotalNumber,
	   int managingNumber, int accumulateWarning
*/

router.get('/group/member',function(req,res){

	console.log("##getInfoAll##");

	var queryString="";
	var groupMemberId = req.query.groupMemberId;
	var myGroupMemberId = req.query.myGroupMemberId;

	var parentMemberId;

	var parentInfo={};
	var curInfo={};
	var childrenInfo=[];

	if(groupMemberId == undefined){
		res.json({status:300, errorDesc :"parameter Error"});
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

            	peopleTree.isValidChange(myGroupMemberId,groupMemberId, function(err,valid){
            		console.log("Authorized : "+!valid);
            		if(!err){
	            		if(!valid){
	            			console.log("Authorized");
			            	async.waterfall([
							  function (callback) {
						          console.log('--- async.waterfall getInfoAll Node #1 ---');

									peopleTree.getItems(groupMemberId,function(err,obj){
										if(!err){
											if(obj){
												console.log(obj.userName);
							                    curInfo = {
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
							                            };

												parentMemberId = curInfo.parentGroupMemberId;
												callback(null,parentMemberId);
											}
											else
												callback({status:404, errorDesc : "not login user"},null);
										}
										else
											callback({status:500, responseData : err.message},null);
									});
						      },

							  function (parentMemberId, callback) {
						          console.log('--- async.waterfall getInfoAll Node #2 ---');
						          	//부모 정보 가져오기
						          	if(parentMemberId!=groupMemberId){
										peopleTree.getItems(parentMemberId,function(err,obj){
											if(!err){
												if(obj){
													console.log(obj.userName);
								                    parentInfo = {
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
								                            };
													callback(null);
												}
												else
													callback({status:404, errorDesc : "not login user"},null);
											}
											else
												callback({status:500, responseData : err.message},null);
										});
									}
									else
										callback(null);
						      },

						      function (callback) {
						          console.log('--- async.waterfall getInfoAll Node #3 ---');
					            	peopleTree.getChildren(groupMemberId,function(err,children,length){

						                if (!err){
							                var length = children.length;
							                console.log('item.length!! : '+length);
							                var count = length-1;

							                children.forEach(function (childGroupMemberid) {
												peopleTree.getItems(childGroupMemberid,function(err,obj){
													if(!err){
														if(obj){
															console.log(obj.userName);
										                    childrenInfo.push({
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
										                  	if(!count--)
										                      callback(null);
														}
														else
															callback({status:404, errorDesc : "exist child that logout failed"},null);
													}
													else
														callback({status:500, responseData : err.message},null);
												});
							                });
							                if(!length) callback(null);
							              }
							            else
							              callback(err.message, null);
								    });
					          	}
						    ],
						    function(err) {
						      console.log('--- async.waterfall result getInfoAll Node #1 ---');
						      if(!err)
						        return res.json({status:200, responseData : { parentInfo : parentInfo, curInfo : curInfo,  childrenInfo : childrenInfo }});
						      else{
						        return res.json({status:401, errorDesc : err});
						      }
						  });
	            		}
	            		else
	            			res.json({status:300, errorDesc : "not authorize"});
	            	}
	            	else
	            		res.json({status:300, errorDesc : err});
            	});
            }
            else	        
              res.json({status:401});
        }
    });
	
});

module.exports = router;
