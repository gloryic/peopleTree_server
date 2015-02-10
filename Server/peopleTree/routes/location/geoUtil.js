var express = require('express');
var async = require('async');
var router = express.Router();

/*
#참조 지역 정보 입력하기
#path : POST /ptree/location/setGeoPoint
#req : int groupMemberId, double radius, Obj[] points
#res : int status, string responseData
#e.g : {"status":200,"responseData":"points's length * 2 + 1 = 5"}
*/
router.get('/setGeoPoint', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var radius = req.query.radius;
	var points = req.query.points;// [{lat:7,lng:4}];

	peopleTree.setGeoPoint(groupMemberId, radius, points, function(err,obj){
		if(!err){
			console.log("/setGeoPoint : "+ JSON.stringify(obj));
			res.json({status:200, responseData : "points's length * 2 + 1 = "+ obj });
		}
		else{
			res.json({status:300, errorDesc : err.message });
		}
	});
});


/*
#참조 지역 정보 가져오기
#path : POST /ptree/location/getGeoPoint
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
#path : POST /ptree/location/getLocation
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
#path : POST /ptree/location/checkMember
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

//1. setLocation과 2. checkLocation를 사용http://210.118.74.107:3000/ptree/location/checkMember?groupMemberId=20&statusCode=&latitude=7&longitude=2&parentGroupMemberId=41&parentManageMode=210&edgeType=200
//statusCode에 따라서 디바이스 상태를 알고 부모에게 푸시를 준다.

var groupMemberId = req.query.groupMemberId;
var latitude = req.query.latitude;
var longitude = req.query.longitude;
var parentGroupMemberId = req.query.parentGroupMemberId;
var manageMode = req.query.parentManageMode;


var statusCode = req.query.statusCode;
var edgeType = req.query.edgeType;

//var fpId = req.query.fpId;
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

	async.waterfall([
		
		function (callback) {
          console.log('--- async.waterfall checkMember #1 ---');
          //기기의 statusCode에 따라 프로세스가 진행되고 부모에게 알림이 간다.

          if(edgeType==100){
          	isCheckLocation = false;
          }

          if (statusCode == 2048)
          	callback(null);
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
          		isLocationInvaild = true;
          	}
          	if(parseInt(statusCode&2056) == 2056){
          		message += '(배터리 부족)';
          	}
          	if(parseInt(statusCode&2064) == 2064){
          		message += '(전원 끔)';
          	}
          }
          
          if(statusCode!=2048){
			    peopleTree.push(groupMemberId, parentGroupMemberId, message, statusCode, function(err,result){
			    	if(!err) console.log(err);
		        });
		  }
		  console.log("device status : " + message);
		  callback(null);
        },

        function (callback) {
          console.log('--- async.waterfall checkMember #2 ---');
          //setLocation
          if(isCheckLocation && !isLocationInvaild){

	      	  peopleTree.setLocation(groupMemberId, latitude, longitude, function(err,result){
				  if(!err){
					  console.log("/setLocation : "+ result);
					  if(result) callback(null);
					  else callback({status:400, errorDesc:"location update failed"},null);
				  }
				  else
					  callback(err,null);
			  });
	      	}
	      else{
	      	callback(null);
	      }
        },
        function (callback) {
          console.log('--- async.waterfall checkMember #3 ---');
          //checkLocation
          if(isCheckLocation && !isLocationInvaild){
          	peopleTree.checkLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,result){
				if(!err){
					console.log("/checkLocation : "+ JSON.stringify(result));
					callback(null,result);
				}
				else{
					callback(err,null);
				}
			});
          }
          else if(isCheckLocation) {
	      	  peopleTree.checkInvalidLocation(groupMemberId, parentGroupMemberId, function(err,result){
				  if(!err){
					  console.log("/checkInvalidLocation : "+ result);
					  if(result) callback(null,result);
					  else callback({status:400, errorDesc:"Invalid Location process failed"},null);
				  }
				  else
					  callback(err,null);
			  });
          }
          else
          	callback(null, null);
        },
        function (result, callback) {
          console.log('--- async.waterfall checkMember #4 ---');
          	//관리대상의 엣지타입이 위치관리 관계일때 검사를 하고 이탈자일때 푸시를 보낸다.
	        //{"status":200,"reponseData":{"radius":4,"distance":220732.02658609525,"edgeStatus":300,"validation":false,"accumulateWarning":1}}
	        // reponseData.validation 이 false 이면 reponseData를 푸시알림으로 부모에게 보낸다.
          	if(isCheckLocation){
          		if(!result.validation){
		      		peopleTree.push(groupMemberId, parentGroupMemberId, result, statusCode, function(err,result){
			          if(err) console.log(err.message);
			        });
		      	}
		      	callback(null,result);
	      	}
	      	else
	      		callback(null,{reponseData:{edgeStatus:100}});
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
				  children.forEach(function (childGroupMemberId) {
				        peopleTree.push(groupMemberId, childGroupMemberId, "부모의 관리모드가 변경되었습니다.", manageMode, function(err,result){
				          if(err) console.log(err.message);
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