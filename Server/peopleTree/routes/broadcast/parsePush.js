var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {

	var notification = {

	  where : {
	  			"deviceType": "android",
	  			"groupMemberId": 26
	  		  },

	  data : {
	    		"alert": "공지사항",
	    		"message":"가나다라",
	    		"stateCode":300
	  		 }
	};

	parse.sendPush(notification, function(err, resp){
	  console.log(resp.result);
	  res.json(resp.result);
	});
});

router.get('/Up',function(req,res){

    var groupMemberId = req.query.groupMemberId;

    peopleTree.broadcastUp(groupMemberId, 2, function(err,result){
        if(!err) res.json({status:200, responseData : {parents : result}});
        else res.json({status:300, errorDesc : err});
    });
});

router.get('/Down',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var depth = req.query.depth;
    
    peopleTree.broadcastDown(groupMemberId, depth, function(err){
        if(!err) res.json({status:200, responseData : {child : gatherArr}});
        else res.json({status:300, errorDesc : err});
    });
});


module.exports = router;