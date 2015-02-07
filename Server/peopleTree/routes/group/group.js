var express = require('express');
var router = express.Router();

/*
#직계 자식 가져오기
#path : GET /ptree/group/children
#req : int groupMemberId
#res : int[] children, int numberOfChildren
#e.g : {"status":200,"responseData":{"children":[27],"numberOfChildren":1}}
*/
router.get('/children',function(req,res){

    var groupMemberId = req.query.groupMemberId;

    peopleTree.getChildren(groupMemberId,function(err,result,length){
        if(!err) res.json({status:200, responseData : {children : result, numberOfChildren : length}});
        else res.json({status:300, errorDesc : err});
    });
});

/*
#모든 자식만을 가져온다.
#path : GET /ptree/group/allChildren
#req : int groupMemberId
#res : int[] allChildren, int numberOfAllChildren
#e.g : {"status":200,"responseData":{"allChildren":[35,27,20],"numberOfAllChildren":3}}
*/
router.get('/allChildren',function(req,res){

    var groupMemberId = req.query.groupMemberId;
    var MAX = 1000;//최대 ㄴ깊이 1000까지 들어간다.

    peopleTree.gatherChildren(groupMemberId, MAX, function(err,children){
        if(!err) res.json({status:200, responseData : {allChildren : children, numberOfAllChildren : children.length}});
        else res.json({status:300, errorDesc : err});
    });
});

module.exports = router;