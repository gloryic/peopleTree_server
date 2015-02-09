var express = require('express');
var router = express.Router();

/*
#위쪽으로, 관리자에게 푸시 보내기(이탈자 알림용, 내부용)
#path : POST /ptree/broadcast/up
#req : int groupMemberId, int accumulateWarning, string message
#res : int[] parents
#e.g : {"status":200,"responseData":{"parents":[27,20]}}
*/
router.get('/up',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var accumulateWarning = req.query.accumulateWarning;
    var message = req.query.message;

    peopleTree.broadcastUp(groupMemberId, accumulateWarning, message, function(err,result){
        if(!err) res.json({status:200, responseData : {parents : result}});
        else res.json({status:300, errorDesc : err});
    });
});

/*
#아래쪽으로, 관리대상에게 푸시 보내기(공지사항 알림용)
#path : POST /ptree/broadcast/down
#req : int groupMemberId, int depth, string message
#res : int[] child
#e.g : {"status":200,"responseData":{"children":[26,27]}}
*/
router.get('/down',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var depth = req.query.depth;
    var message = req.query.message;
    
    peopleTree.broadcastDown(groupMemberId, depth, message, function(err){
        if(!err) res.json({status:200, responseData : {children : gatherArr}});
        else res.json({status:300, errorDesc : err});
    });
});

/*
#쪽지 보내기
#path : POST /ptree/broadcast/message
#req : int from, int to, string message
#res : int from, int to, int statusCode, string message
#e.g : {"status":200,"responseData":{"from":26,"to":27,"statusCode":410,"message":"send requset"}}
*/
router.get('/message',function(req,res){

    var from = req.query.from;
	var to = req.query.to;
	var message = req.query.message;
	var statusCode = 600;

    peopleTree.push(from, to, message, statusCode, function(err,result){
        if(!err) res.json({status:200, responseData : { from : parseInt(from), to : parseInt(to), statusCode: parseInt(statusCode), message :message } });
        else res.json({status:300, errorDesc : err});
    });
});

module.exports = router;