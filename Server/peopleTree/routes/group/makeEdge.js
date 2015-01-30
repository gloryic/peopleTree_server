/*
#연결신청
#path : POST /ptree/make/group
#req : int ownPhoneNumber, int edgeType, int userId
#res : int status, int edgeType, int radius, int groupId, int groupMemberId 
*/
var express = require('express');
var router = express.Router();

router.get('/',function(req,res){

	var ownPhoneNumber = req.body.ownPhoneNumber;	
    var edgeType =req.body.edgeType;
    var userId = req.body.userId;
    
	var post=[ownPhoneNumber,edgeType,userId];
    
    var query = dbcon.query('INSERT INTO groupmember(ownPhoneNumber, edgeType, userId) VALUES(?,?,?)',post, function(err,rows){
            
            console.log(rows);
            console.log(err);
            console.log(query);

            if(err) throw err;
            else{
                if(rows.affectedRows==1){
                     res.json({"userId": userid,"contactName":contactName, "contactLevel":contactLevel, 
                                "contactEmail":contactEmail, "contactPhone":contactPhone, 
                                "companyname":companyname, "link":link});
                }
                else{
                     res.json({"error":"Not complete insert"});
                }
            }
        });
});

module.exports = router;