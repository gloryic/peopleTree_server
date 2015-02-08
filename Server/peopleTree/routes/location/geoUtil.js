var express = require('express');
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
#req : int groupMemeberId, int statusCode, double latitude, double longtitude, int fpId
#res : 
#e.g : 
*/

router.get('/checkMember', function(req, res) {

//1. setLocation과 2. checkLocation를 사용
//statusCode에 따라서 디바이스 상태를 알고 부모에게 푸시를 준다.




});

module.exports = router;