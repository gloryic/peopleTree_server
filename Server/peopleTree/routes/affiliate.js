var express = require('express');
var router = express.Router();

//파일 업로드를 위한 require
var formidable = require('formidable');
var fs =require('fs-extra')

/* GET home page. */
router.get('/', function(req, res) {
    res.jsonp("welcom to API affiliates JSON");
});

router.get('/test',function(req,res){
    var userId = req.params.userId; 

    var query = dbcon.query('select affiliate_expect_limitdate,appname,company_contact_name,affiliate_type,service_url,service_desc,status,affiliate_expect_traffic from api_affiliates where id= ?',userId, function(err,rows){
        console.log(rows);
        res.jsonp(rows);
    });
});

/*
#제휴 회사 및 담당자 정보 추가
#doamin : manage.daumtools.com
#path : POST /rest/affiliate/company?userid={userid}&link={link}&contactName={contactName}&contactLevel={contactLevel}&contactEmail={contactEmail}&contactPhone={contactPhone}
#req : userId,link,contactName,contactLevel,contactEmail,contactPhone
#res : changed company info 
*/
router.post('/company',function(req,res){

    var userid=req.body.userid;	
    var contactName=req.body.contactName;
    var contactLevel=req.body.contactLevel;
    var contactEmail=req.body.contactEmail;
    var contactPhone=req.body.contactPhone;
    var companyname=req.body.companyname;
    var link=req.body.link;

    var post=[contactName,contactEmail,contactPhone,companyname,link];
    
    var query = dbcon.query('INSERT INTO affiliates(company_contact_name,company_contact_email,company_contact_phone,company_name,link) VALUES(?,?,?,?,?)',post, function(err,rows){
            //console.log(rows);
            //console.log(err);
            //console.log(query);
            if(err) throw err;
            else{
                if(rows.affectedRows==1){
                     res.jsonp({"userid": userid,"contactName":contactName, "contactLevel":contactLevel, 
                                "contactEmail":contactEmail, "contactPhone":contactPhone, 
                                "companyname":companyname, "link":link});
                }
                else{
                     res.jsonp({"error":"Not complete insert"});
                }
            }
        });
});


/*
#제휴기능 신청 목록
#doamin : manage.daumtools.com
#path : POST /rest/affiliate/{userId}/feature
#req : userId
#res : list[app, feature, featureState]
*/
        
//API북을 사용하여 실질적 앱의 소유주와 컨탠츠 내용을 로드할 필요가 있음. 완성이 된 후에 추가적으로 수정예정임.

router.get('/:userId/feature',function(req,res){
    var userId = req.params.userId;	

	var query = dbcon.query('select affiliate_expect_limitdate,appname,company_contact_name,affiliate_type,service_url,service_desc,status,affiliate_expect_traffic from api_affiliates where id= ?',userId, function(err,rows){
        console.log(rows);
        res.jsonp(rows);
    });
});


/*
#제휴기능 신청
#doamin : manage.daumtools.com
#path : POST /rest/affiliate/affiliate/{userId}/feature/{featureId}?reason={reason}
#req : userId, featureId, reason
#res : list[app, feature, featureState]
*/
router.post('/affiliate/:userId/feature/:featureId',function(req,res){
    var userId = req.params.userId;	
    var featureId = req.params.featureId;
    var reason=req.body.reason;
    var post=[userId,featureId,reason];

    var query = dbcon.query('INSERT INTO api_affiliates(company_contact_name,company_contact_email,company_contact_phone,company_name) VALUES(?,?,?,?)',post, function(err,rows){
            console.log(rows);
            console.log(err);
            console.log(query);
            res.jsonp({"app": app, "feature":feature, "featureState":featureState });
    });
});

/*
#제휴관련 대화 조회(최근 30개만 보임)
#doamin : manage.daumtools.com
#path : GET /rest/affiliate/{userId}/chat
#req : userId
#res : list[Sender, message, messageType, created]
*/
//TODO : Sender - 보낸 사람,  messageType - 메세지가 시스템적인 메세지인지, 개인이 입력 메세지 인지 
router.get('/:userId/chat',function(req,res){
    var userId = req.params.userId;
    console.log(userId);
    var query = dbcon.query('select receiver,sender, message, created from chat_table where sender = ? or receiver=?limit 30',[userId,userId] ,function(err,rows){
        console.log(rows);
        res.jsonp(rows);
    });
});

/*
#제휴관련 대화 전송
#doamin : manage.daumtools.com
#path : POST /rest/affiliate/chat?userId={userId}&message={message}&attachFile={attachFile}
#req : userId, message, attachFile
#res : list[Sender, message, messageType, created]
*/
router.post('/chat',function(req,res){

    fileUpload(req);//병령로 수행되며, 파일저장이름은 본파일 이름과 같고 덮어쓰기 된다.
    var userId = req.body.userId;
    var message = req.body.message;
    var attachFile = req.body.attachFile;
    console.log(userId+"/"+message+"/"+attachFile);
    var query = dbcon.query('insert userid, message, attachFile from api_affiliates_comment', function(err,rows){
        query = dbcon.query('select Sender, message, messageType, created from api_affiliates_comment where member_id = ? order by badge_id;', function(err,rows){
            res.jsonp({"Sender": rows[0].Sender, "message": rows[0].message,"messageType": rows[0].messageType,"created": rows[0].created});
        });
    });
});

/*
#사용자 멤버쉽 정보
#doamin : manage.daumtools.com
#path : GET /rest/membership/{userId}
#req : userId
#res : level, badges
*/
router.get('/membership/:userId',function(req,res){
	var userId = req.params.userId;
    var badges = new Array();
	var level;
	var query = dbcon.query('select grade, id from membership_members where userid = ?', [userId], function(err,rows){
        
        if(err) throw err;
        if(rows.length == 0){
            res.json({"Error": "No such a User" });
            return;
        }
        console.log("grade : "+rows[0].grade);
        console.log("id : "+rows[0].id);
        level = rows[0].grade;
        query = dbcon.query('select badge_id from membership_badge_grant where member_id = ? order by badge_id;', [rows[0].id], function(err,rows){
	        rows.forEach(function(element, index, array){
	        	badges.push(rows[index].badge_id);
	        	console.log(rows[index].badge_id);
	        });
	        res.jsonp({"level": level,"badges":badges});
    	});
    });
});

function fileUpload(req) {
    var form = new formidable.IncomingForm();
    form.uploadDir = "./attachFiles";
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {
        console.log("file size: "+JSON.stringify(files.fileUploaded.size));
        console.log("file path: "+JSON.stringify(files.fileUploaded.path));
        console.log("file name: "+JSON.stringify(files.fileUploaded.name));
        console.log("file type: "+JSON.stringify(files.fileUploaded.type));
        console.log("astModifiedDate: "+JSON.stringify(files.fileUploaded.lastModifiedDate));

        //Formidable은 파일 이름을 바꾸기 때문에, 원래의 이름으로 돌리는 작업을 아래에서 수행한다.
        fs.rename(files.fileUploaded.path, './attachFiles/'+files.fileUploaded.name, function(err) {
        if (err) throw err;
            console.log('renamed complete');
        });
    });
}

router.get('/getDataForTable',function(req,res){

    var checkIndex = req.param("checkIndex");
    var tableIndex = req.param("tableIndex");
    var default_sql;

    if(tableIndex=='1'){          
        default_sql = "select id, company_name, company_contact_name, writedate, service_platform, affiliate_type, "
                                +"approval_traffic, approval_limitdate, service_desc, status from api_affiliates where 1=1";
    }
    else{
        default_sql = 'select id, company_name, company_contact_name, company_contact_phone, writedate, '
                            +'service_desc from api_affiliates Where status="제휴접수" ';
    }

    //선택 사항이 있으면 아래에서 수행된다.
    if(checkIndex!=""){
        var arr = checkIndex.split("%");
        console.log(arr);
        var count = 0;

        var length = arr.length-1;
        var result = [];

        console.log("length : "+length);

        arr.forEach(function(element, index, array){
            console.log("arr[index] : "+arr[index]);
            switch(arr[index]) {
                case '1'://statusRequest10
                    var Sql = default_sql+' and status="제휴접수" Order By writedate DESC Limit 10';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++; 
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '2'://statusApprove10
                    var Sql = default_sql+' and status="OpenAPI사용" Order By writedate DESC Limit 10';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '3'://statusReject10
                    var Sql = default_sql+' and status="제휴거절" Order By writedate DESC Limit 10';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '4'://today5
                    var Sql = default_sql+' and writedate BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 day) AND CURDATE()';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '5'://yesterday5
                    var Sql = default_sql+' and writedate BETWEEN DATE_ADD(CURDATE(), INTERVAL -1 day) AND CURDATE()';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '6'://afewDaysAgo5
                    var Sql = default_sql+' and writedate BETWEEN DATE_ADD(CURDATE(), INTERVAL -5 day) AND CURDATE()';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '7'://dueDay10
                    var Sql = default_sql+' and affiliate_expect_limitdate BETWEEN DATE_SUB(CURDATE(),INTERVAL (DAY(CURDATE())-1) DAY) AND LAST_DAY(NOW())';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
                case '8'://expire3
                    var Sql = default_sql+' and status="제휴만료" Order By writedate DESC Limit 10';
                    var query = dbcon.query(Sql, function(err,rows){
                        count++;
                        result.push.apply(result, rows);
                        if(count==length)
                            res.json(result);
                    });
                    break;
            }
        });
    }
    else{
        //선택 사항이 없으면 기본적으로 보든 리스트를 보낸다.
        console.log("default");
        var query = dbcon.query(default_sql, function(err,rows){
            //console.log(rows);
            res.json(rows);
        });
    }
});

module.exports = router;
/*
use openapi;
select id, company_name, company_contact_phone, writedate, service_platform, affiliate_type, approval_traffic, approval_limitdate, service_desc, status from api_affiliate limit 100;
*/
