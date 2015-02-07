var express = require('express');
var router = express.Router();

//안드로이드로부터 이벤트 발생시 요청오는 URI들

//관계 요청 메세지 410, 420 
//410 - 내 밑으로 들어와라 , 420 - 저를 받아주세요

/*
#연결관계 요청하기
#path : POST /ptree/request/edge
#req : int from, int to, int statusCode
#res : int from, int to, int statusCode, string message
#e.g : {"status":200,"responseData":{"from":"26","to":"27","statusCode":"410","message":"send requset"}}
*/
//410 - 아래, 내 밑으로 들어와라, edgeType(100), 420 - 내 밑으로 들어와라 edgeType(200)
//510 - 위, 저를 받아주세요, edgeType(100), 520 - 저를 받아주세요 edgeType(200)

var requestMessage = {410 : "아래, 정보보고관계요청.", 420 : "아래, 위치관리관계요청.", 510 : "위, 정보보고관계요청.", 520 : "위, 위치관리관계요청."}
var confirmMessage = {410 : "아래, 정보보고관계요청 확인.", 420 : "아래, 위치관리관계요청 확인.", 510 : "위, 정보보고관계요청 확인.", 520 : "위, 위치관리관계요청 확인."}

router.get('/request/edge',function(req,res){

    var from = req.query.from; // 요청자
	var to = req.query.to; // 기대확인자
	var statusCode = req.query.statusCode;
	if(from&&to&&statusCode){
	    peopleTree.push(from, to, requestMessage[statusCode], statusCode, function(err,result){
	      if(err || !result) console.log("ERR /request/edge : "+err+"/"+result);
	    });
	    res.json({status:200, responseData : { from : from, to : to, statusCode: statusCode, message :"send requset" } });
	}
	else res.json({status:300, errorDesc : "parameter Error" });
});

/*
#연결관계 확인하기
#path : POST /ptree/make/edge
#req : int groupMemberId
#res : {"status":200,"responseData":{"children":[27],"numberOfChildren":1}}
*/
router.get('/make/edge',function(req,res){

    var from = req.query.from; // 확인자
	var to = req.query.to; // 요청자
	var statusCode = req.query.statusCode;
	var groupMemberId;
	var parentGroupMemberId;
	var edgeType;
	//410 - 아래, 내 밑으로 들어와라, edgeType(100), 420 - 내 밑으로 들어와라 edgeType(200)
	//510 - 위, 저를 받아주세요, edgeType(100), 520 - 저를 받아주세요 edgeType(200)
	//변경되는 것, changeParent, to의 changeEdgeType을 변경한다.
	if(from&&to&&statusCode){

		if(statusCode==410 || statusCode==420){
			//확인자가 아래로 들어가는 것을 확인
			groupMemberId = from;
			parentGroupMemberId= to;
			statusCode == 410 ? edgeType = 100 :edgeType = 200;
		}
		else if (statusCode==510 || statusCode==520){
			//확인자가 위로 들어가는 것을 확인
			groupMemberId = to;
			parentGroupMemberId= from;
			statusCode == 410 ? edgeType = 100 :edgeType = 200;	
		}

		peopleTree.changeParent(groupMemberId,parentGroupMemberId,function(err,result){
			if(!err&&result.status==200){
				peopleTree.changeEdgeType(groupMemberId, edgeType, function(err, result){
				    peopleTree.push(from, to, confirmMessage[statusCode], statusCode, function(err,result){
				      if(err || !result) console.log("ERR /make/edge : "+err+"/"+result);
				    });
				    res.json({status:200, responseData : { from : from, to : to, statusCode: statusCode, message :"confirm requset" } });
				});
			}
			else
			  res.json({status:300, errorDesc : err.errorDesc });
		});
	}
	else res.json({status:300, errorDesc : "parameter Error" });
});

module.exports = router;