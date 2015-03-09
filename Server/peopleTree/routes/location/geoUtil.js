var express = require('express');
var async = require('async');
var router = express.Router();

/*
#참조 지역 정보 입력하기
#path : POST /ptree/geoutil/setGeoPoint
#req : int groupMemberId, double radius, Obj[] points
#res : int status, string responseData
#e.g : {"status":200,"responseData":"points's length * 2 + 1 = 5"}
*/
router.get('/setGeoPoint', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var radius = req.query.radius;
	var points = JSON.parse(req.query.points);// [{lat:7,lng:4}];
	var manageMode = 0;

	console.log("points : "+JSON.stringify(points));
	console.log("points.length : "+points.length);

	if(points.length == 0){
	    if(radius == 0)
			manageMode = 200;
		else
			manageMode = 210;
	}
	else if(points.length == 1)
		manageMode = 220;
	else
		manageMode = 230;

	console.log("manageMode : "+manageMode);

	async.waterfall([

        function (callback) {
          console.log('--- async.waterfall setGeoPoint #1 ---');
      	   peopleTree.isExist(groupMemberId, function(err, isExist){
			  if(!err){
				  if(isExist) callback(null);
				  else callback("is not exist groupMemberId",null);
			  }
			  else callback(err,null);
		  });
        },
        function (callback) {
          console.log('--- async.waterfall setGeoPoint #2 ---');
          	peopleTree.changeManageMode(groupMemberId, manageMode, function(err,result){
				if(!err){
					if(result) callback(null);
					else callback("change fail");
				}
				else callback(err,null);
			});
        },
        function (callback) {
          console.log('--- async.waterfall setGeoPoint #2 ---');
          	peopleTree.getChildren(groupMemberId, function(err, children, length){
				if(!err){
				  children.forEach(function (childGroupMemberId) {
				        peopleTree.push(groupMemberId, childGroupMemberId, "부모의 관리모드가 변경되었습니다.", manageMode, function(err,result){
				          if(err) console.log(err.message);
				        });
			      });
			      callback(null);
				}
				else callback(err,null);
			});
        },
        function (callback) {
        	console.log('--- async.waterfall setGeoPoint #3 ---');

				peopleTree.setGeoPoint(groupMemberId, radius, points, function(err,obj){
					if(!err){
						console.log("/setGeoPoint : "+ JSON.stringify(obj));
						callback(null)//res.json({status:200, responseData : "points's length * 2 + 1 = "+ obj });
					}
					else{
						callback(err.message,null);//res.json({status:300, errorDesc : err.message });
					}
				});
        }

      ],
      function(err) {
        console.log('--- async.waterfall result setGeoPoint #1 ---');
        if(!err)
          res.json({status:200, reponseData : manageMode+" manageMode change success"});
        else
          res.json({status:300, reponseData : err});
	});

});


/*
#참조 지역 정보 가져오기
#path : POST /ptree/geoutil/getGeoPoint
#req : int groupMemberId, double radius, Obj[] points
#res : int status, string responseData
#e.g : {"status":200,"responseData":[0, 1.1111, 1.1111 ]}
*/
router.get('/getGeoPoint', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var radius = req.query.radius;
	var points = [{lat:7,lng:4}];//req.query.points;//[{}]

	peopleTree.getGeoPoint(groupMemberId, function(err,obj){
		if(!err){
			console.log("/getGeoPoint : "+ JSON.stringify(obj));
			res.json({status:200, responseData : obj });
		}
		else{
			res.json({status:300, errorDesc : err.message });
		}
	});
});

/*
#현 위치 정보 가져오기
#path : POST /ptree/geoutil/getLocation
#req : int groupMemberId
#res : int status, string responseData
#e.g : {"status":200,"responseData":{"latitude":123,"longitude":123}}
*/
router.get('/getLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;

	peopleTree.getLocation(groupMemberId, function(err,obj){
		if(!err){
			console.log("/getLocation : "+ JSON.stringify(obj));
			res.json({status:200, responseData:obj});
		}
		else{
			res.json(err);
		}
	});
});


router.get('/setLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var longitude = req.query.longitude;
	var latitude = req.query.latitude;

	peopleTree.setLocation(groupMemberId, latitude, longitude, function(err,obj){

		if(!err){
			console.log("/setLocation : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});

router.get('/checkLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;
	var manageMode = req.query.manageMode;

	peopleTree.checkLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,obj){
		if(!err){
			console.log("/checkLocation : "+ JSON.stringify(obj));
			res.json({status:200, responseData:obj});
		}
		else{
			res.json(err);
		}
	});
});


/*
#디바이스 상태 체크 및 위치 기록 및 위치 체크
#path : POST /ptree/geoutil/checkMember
#req : int groupMemeberId, int statusCode, double latitude, double longtitude, int fpId, int parentGroupMemberId, int parentManageMode, int edgyType
#res : 
#e.g : {"status":200,"reponseData":{"radius":4,"distance":220732.02658609525,"edgeStatus":300,"validation":false,"accumulateWarning":1}}

statusCode
공지메세지 - 100
상태변화 메세지 - 210//gps끄기, 220//wifi 끄기, 230//배터리 부족
이탈자 발생 메세지 - 300
관계 요청 메세지 - 410, 420, 510, 520 
					//410 - 내 밑으로 들어와라, edgeType(100), 420 - 내 밑으로 들어와라 edgeType(200)
					//510 - 저를 받아주세요, edgeType(100), 520 - 저를 받아주세요 edgeType(200)
일반메시지 - 600

*/
router.get('/checkMember', function(req, res) {

//1. setLocation과 2. checkLocation를 사용
//statusCode에 따라서 디바이스 상태를 알고 부모에게 푸시를 준다.
//http://210.118.74.107:3000/ptree/geoutil/checkMember?groupMemberId=20&statusCode=&latitude=7&longitude=2&parentGroupMemberId=41&parentManageMode=210&edgeType=200&fpId=0
var groupMemberId = req.query.groupMemberId;
var latitude = req.query.latitude;
var longitude = req.query.longitude;
var parentGroupMemberId = req.query.parentGroupMemberId;
var manageMode = req.query.parentManageMode;

var statusCode = req.query.statusCode;
var edgeType = req.query.edgeType;
var fpId = req.query.fpId;

// 0 실외모드 ,(1 핑거프린트 사용 불가), 
// 2번 부터는 해당 아이디

//parentGroupMemberId, 부모의 manageMode, 나의 edgyType?
/*
2048 정상
2049 무효값

2050 gps꺼짐
2052 wifi 꺼짐

2056 배터리부족
2064 전원 꺼짐
*/
//정보보고관계라 하여도 디바이스 상태는 파악하나? 위 디바이스 상태가 위치 정보를 줄 수 있느냐를 파악 하는 거라
//정보보고관계는 이 프로토콜을 사용하지 않는다.
var message = '';
var isCheckLocation = true;
var isLocationInvaild = false;
var isFingerPrint = false;

	async.waterfall([
		
		function (callback) {
          console.log('--- async.waterfall checkMember #1 ---');
          //기기의 statusCode에 따라 프로세스가 진행되고 부모에게 알림이 간다.
          //나의 부모의 관리모드가 200인것과 나의 엣지타입이 100인 것은 위치 검사를 안한다는 것이다.

          //TODO
          if(fpId == null)
          	fpId = 1;
          else if(fpId >= 2)
          	isFingerPrint = true;
          

          if(edgeType==100 || manageMode==200)
          	isCheckLocation = false;

          if (statusCode == 2048){
          	//noting
          }
          else{
          	if(parseInt(statusCode&2049) == 2049){
          		console.log(statusCode&2049);
          		message += '(gps 오차 큼)';
          		isLocationInvaild = true;
          	}
          	if(parseInt(statusCode&2050) == 2050){
          		console.log(statusCode&2050);
          		message += '(gps 꺼짐)';
          		isLocationInvaild = true;
          	}
          	if(parseInt(statusCode&2052) == 2052){
          		message += '(wifi 꺼짐)';
          		//isLocationInvaild = true;
          	}
          	if(parseInt(statusCode&2056) == 2056){
          		message += '(배터리 부족)';
          	}
          	if(parseInt(statusCode&2064) == 2064){
          		message += '(전원 끔)';
          	}
          }
          
          if(groupMemberId == parentGroupMemberId){
          	console.log("N."+groupMemberId+" send checkmember - not have parent user");
          	isCheckLocation = false;
          }
          	
          if( manageMode!=200 && (statusCode!=2048) && (groupMemberId != parentGroupMemberId) ){
			    peopleTree.push(groupMemberId, parentGroupMemberId, {parentManageMode: manageMode, radius: -1, distance: -1, edgeStatus: 300, validation : false, accumulateWarning : 0}, statusCode, function(err,result){
			    	if(err) console.log(err);
		        });
		  }
		  console.log("device status : " + message);
		  callback(null);
        },

        function (callback) {
          if(!isLocationInvaild){
          	  console.log('--- async.waterfall checkMember #2 ---');
	      	  peopleTree.setLocation(groupMemberId, latitude, longitude, fpId, function(err,result){
				  if(!err){
					  console.log("/setLocation : "+ result);
					  if(result) callback(null);
					  else callback({status:400, errorDesc:"location update failed"});
				  }
				  else
					  callback(err);
			  });
	      }
	      else
	      	callback(null);
        },

        function (callback) {
        	console.log('--- async.waterfall checkMember #3 ---');
          	//관리자의 설정이 관리가 아니거나, 부모가 없는 경우 isCheckLocation가 false가 된다.
          	if(isCheckLocation)
		      	callback(null);
	      	else
	      		callback({status:300, errorDesc:"parentManageMode is 200 or not have parent"});
        },

        function (callback) {
          //핑거프린터를 사용할때
          if(isFingerPrint){
          		console.log('--- async.waterfall checkMember #4-1, fingerprint ---');
	          	peopleTree.getLocationForFp(groupMemberId, function(err, myData){
		          	peopleTree.getLocationForFp(parentGroupMemberId, function(err, parentData){
		          		//나와 부모의 fpId를 가져와 비교한다.
		          		console.log("myData.fpId / parentData.fpId -> "+ myData.fpId + "/" + parentData.fpId);

		          		if(myData.fpId != parentData.fpId){
		          			 //다르다면 바로 비유효 판정
	          				 peopleTree.checkInvalidLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,result){
								  if(!err){
									  console.log("/checkInvalidLocation : "+ result);
									  if(result) callback(null,result);
									  else callback({status:400, errorDesc:"Invalid Location process failed"},null);
								  }
								  else
									  callback(err,null);
							 });
		          		}
		          		else{
		          			//fpID를 같다, 하지만 유효 거리에 있는지 판정.

	          				var myFpFirstNum = parseInt(myData.latitude/100);
	          				var parentFpFirstNum =  parseInt(parentData.latitude/100);

	          				console.log("myFpFirstNum / parentFpFirstNum ->" + myFpFirstNum + " / " + parentFpFirstNum);

		          			if (myFpFirstNum != parentFpFirstNum ){
		          				//실내모드에서 같은 fpId를 같지만 거리가 멀리 떨어졌을때
		          				peopleTree.checkInvalidLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,result){
									  if(!err){
										  console.log("/checkInvalidLocation : "+ result);
										  if(result) callback(null,result);
										  else callback({status:400, errorDesc:"Invalid Location process failed"},null);
									  }
									  else
										  callback(err,null);
								 });
		          			}
		          			else{
		          				//같은 fpId를 갖으며, 거리 내에도 있다. 즉 정상.
		          				peopleTree.setNormal(groupMemberId, parentGroupMemberId, function(err,result){
		          					if(!err)
		          						callback(null, {parentManageMode: manageMode, radius: -1, distance: -1, edgeStatus: 200, validation : true, accumulateWarning : 0});
		          					else
		          						callback(err,null);
								 });
		          			}
		          		}
		          	});

	          	});
	      }
	      else
	      	callback(null, null);
     	},

        function (result, callback) {
        	//핑거프린트가 아닌 gps를 통한 유효성 체크
        	if(!isFingerPrint) {
	          if(!isLocationInvaild) {
	          	console.log('--- async.waterfall checkMember #4-2 ---');
	          	peopleTree.checkLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,result){
					if(!err){
						console.log("/checkLocation : "+ JSON.stringify(result));
						callback(null,result);
					}
					else
						callback(err,null);
				});
	          }
	          else {
	          	  console.log('--- async.waterfall checkMember #4-3 ---');
		      	  peopleTree.checkInvalidLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,result){
					  if(!err){
						  console.log("/checkInvalidLocation : "+ result);
						  if(result) callback(null,result);
						  else callback({status:400, errorDesc:"Invalid Location process failed"},null);
					  }
					  else
						  callback(err,null);
				  });
	          }
	        }
	        else 
	      	  callback(null,result);//핑거프린트의 결과를 넘긴다.
        },
        
        function (result, callback) {
          
          	//관리대상의 엣지타입이 위치관리 관계일때 검사를 하고 이탈자일때 푸시를 보낸다.
	        //{manageMode: 210, "radius":4,"distance":220732.02658609525,"edgeStatus":300,"validation":false,"accumulateWarning":1}}
	        //{manageMode: 220, "radius":4,"distance":220732.02658609525,"edgeStatus":300,"validation":false,"accumulateWarning":1}}
	        //{manageMode: 230, "edgeStatus":300,"validation":false,"accumulateWarning":1}}
	        // reponseData.validation 이 false 이면 reponseData를 푸시알림으로 부모에게 보낸다.

      		if(!result.validation){
      			console.log('--- async.waterfall checkMember #5 ---');
	      		peopleTree.push(groupMemberId, parentGroupMemberId, result, statusCode, function(err,result){
		          if(err) console.log(err.message);
		        });
	      	}
	      	callback(null,result);
        }

      ],

      function(err, results) {
        console.log('--- async.waterfall result checkMember #1 ---');
        if(!err)
          res.json({status:200, reponseData : results});
        else
          res.json(err);
	});
});

/*
#모드변경 프로토콜, 직계자식들에게 모두 푸시 알림
#path : GET /ptree/geoutil/changeManageMode
#req : int groupMemberId, int manageMode
#res : 
#e.g : {"status":200,"reponseData":"210 manageMode change success"}
*/

router.get('/changeManageMode',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var manageMode = req.query.manageMode;
	var edgeType = 100;
	async.waterfall([

        function (callback) {
          console.log('--- async.waterfall changeManageMode #1 ---');
      	   peopleTree.isExist(groupMemberId, function(err, isExist){
			  if(!err){
				  if(isExist) callback(null);
				  else callback("is not exist groupMemberId",null);
			  }
			  else callback(err,null);
		  });
        },
        function (callback) {
          console.log('--- async.waterfall changeManageMode #2 ---');
          	peopleTree.changeManageMode(groupMemberId, manageMode, function(err,result){
				if(!err){
					if(result) callback(null);
					else callback("change fail");
				}
				else callback(err,null);
			});
        },
        function (callback) {
          console.log('--- async.waterfall changeManageMode #2 ---');
          	peopleTree.getChildren(groupMemberId, function(err, children, length){
				if(!err){

					//부모의 모드가 210, 220, 230 이면 자식의 edgeType을 200으로 변경한다. 
					//아니라면 100으로 변경한다.
					
					if(manageMode > 200)
						edgeType = 200;
					else 
						edgeType = 100;

				  children.forEach(function (childGroupMemberId) {

					peopleTree.changeEdgeType(groupMemberId, edgeType, function(err,result){
						if(err) console.log(err);
						if(result){
							peopleTree.push(groupMemberId, childGroupMemberId, "부모의 관리모드가 변경되었습니다.", manageMode, function(err,result){
					          if(err) console.log(err.message);
					        });
						}
					});

			      });
			      callback(null);
				}
				else callback(err,null);
			});
        }
      ],
      function(err) {
        console.log('--- async.waterfall result checkMember #1 ---');
        if(!err)
          res.json({status:200, reponseData : manageMode+" manageMode change success"});
        else
          res.json({status:300, reponseData : err});
	});

});

module.exports = router;