var express = require('express');
var router = express.Router();

router.get('/Up',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var accumulateWarning = req.query.accumulateWarning;
    
    peopleTree.broadcastUp(groupMemberId, accumulateWarning, function(err,result){
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