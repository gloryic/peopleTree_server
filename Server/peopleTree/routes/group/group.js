/*
#자식 가져오기
#path : POST /ptree/group/children
#req : int groupMemberId
#res : {"state":200,"responseData":{"children":[27],"numberOfChildren":1}}
*/
var express = require('express');
var router = express.Router();

router.get('/children',function(req,res){

    var groupMemberId = req.query.groupMemberId;

    peopleTree.getChildren(groupMemberId,function(err,result,length){
        if(!err) res.json({status:200, responseData : {children : result, numberOfChildren : length}});
        else res.json({status:300, errorDesc : err});
    });
});

module.exports = router;