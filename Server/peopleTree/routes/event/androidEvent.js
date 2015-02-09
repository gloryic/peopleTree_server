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
#e.g : {"status":200,"responseData":{"from":26,"to":27,"statusCode":410,"message":"send requset"}}
*/
//410 - 아래, 내 밑으로 들어와라, edgeType(100), 420 - 내 밑으로 들어와라 edgeType(200)
//510 - 위, 저를 받아주세요, edgeType(100), 520 - 저를 받아주세요 edgeType(200)

var requestMessage = {410 : "아래, 정보보고 관계를 요청이 왔습니다..", 420 : "아래, 위치관리관계 요청이 왔습니다.", 510 : "위, 정보보고관계 요청이 왔습니다.", 520 : "위, 위치관리관계 요청이 왔습니다."}

var confirmMessage = {415 : "아래, 정보보고 관계를 수락하셨습니다.", 425 : "아래, 위치관리관계 확인하셨습니다.", 515 : "위, 정보보고관계 확인하셨습니다.", 525 : "위, 위치관리관계 확인하셨습니다."}
var infoMessage = {417 : "관리자가 변동 되었습니다.", 427 : "관리자가 변동 되었습니다.", 517 : "관리대상이 추가되었습니다.", 527 : "관리대상이 추가되었습니다."}

router.get('/request/edge',function(req,res){

    var from = req.query.from; // 요청자
	var to = req.query.to; // 기대확인자
	var statusCode = req.query.statusCode;

	if(from&&to&&statusCode){
	    peopleTree.push(from, to, requestMessage[statusCode], statusCode, function(err,result){
	      if(err || !result) console.log("ERR /request/edge : "+err+"/"+result);
	    });
	    res.json({status:200, responseData : { from : parseInt(from), to : parseInt(to), statusCode: parseInt(statusCode), message :"send requset" } });
	}
	else res.json({status:300, errorDesc : "parameter Error" });
});

/*
#연결관계 확인하기
#path : POST /ptree/make/edge
#req : int groupMemberId
#res :  int from, int to, int statusCode, string message
#e.g : {"status":200,"responseData":{"from":20,"to":41,"statusCode":420,"message":"confirm requset"}}
*/

global.adminGroupMemberId = 26;

router.get('/make/edge',function(req,res){

    var from = parseInt(req.query.from); // 확인자
	var to = parseInt(req.query.to); // 요청자
	var statusCode = parseInt(req.query.statusCode)

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
			statusCode += 5;
		}
		else if (statusCode==510 || statusCode==520){
			//확인자가 위로 들어가는 것을 확인
			groupMemberId = to;
			parentGroupMemberId= from;
			statusCode == 410 ? edgeType = 100 :edgeType = 200;
			statusCode += 5;
		}

		peopleTree.changeParent(groupMemberId, parentGroupMemberId, function(err,result){
			if(!err&&result.status==200){
				peopleTree.changeEdgeType(groupMemberId, edgeType, function(err, result){

				    peopleTree.push(from, to, confirmMessage[statusCode], statusCode, function(err,result){
				      if(err || !result) console.log("ERR /make/edge : "+err+"/"+result);
				    });
				    res.json({status:200, responseData : { from : parseInt(from), to : parseInt(to), statusCode: parseInt(statusCode), message :"confirm requset" } });

				    //피플트리가 확인자에게도 푸시를 준다.
				    peopleTree.push(adminGroupMemberId, from, infoMessage[statusCode+2], statusCode+2, function(err,result){
				      if(err || !result) console.log("ERR /make/edge : "+err+"/"+result);
				    });
				    res.json({status:200, responseData : { from : parseInt(from), to : parseInt(to), statusCode: parseInt(statusCode), message :"confirm requset" } });
				
				});
			}
			else
			  res.json({status:300, errorDesc : err.errorDesc });
		});
	}
	else res.json({status:300, errorDesc : "parameter Error" });
});

module.exports = router;