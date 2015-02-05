var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.json("welcom to Location Location API");
});

/*
#path : POST /check/location/member
#req : userId, manageMode, edgeStatus, deviceStatus, latitude, longitude, fpId.
#res : status, vaildUserNumber, edgeStatus, parentId, groupCode.
*/
router.get('/location/member',function(req,res){

    //redis에 저장하고
	//자신의 위치 정보를 보내고, 부모의 위치와 비교한다.
	var userNumber = req.query.userId;
	var manageMode = req.query.manageMode;
	var edgeStatus = req.query.edgeStatus;
	var deviceStatus = req.query.deviceStatus;
	var latitude = req.query.latitude;
	var longitude = req.query.longitude;

	//위치 갱신
	var userLocation={
		latitude : latitude,
		longitude : longitude
	};

	client.hmset(userNumber, userLocation);

    var query = dbcon.query('SELECT id FROM test', function(err,rows){
        console.log(rows);
        res.json(rows);
    });
});

/*
// 값을 저장 (일반, 해쉬 테이블 저장)
client.set('String Key', 'String Value', redis.print);
client.hset('Hash Key', 'HashTest 1', '1', redis.print);
client.hset(['Hash Key', 'HashTest 2', '2'], redis.print);

// 값을 가져옴
client.get('String Key', function (err, reply) {
   console.log(reply.toString());
});

// 해시 테이블의 값을 가져옴
client.hkeys('Hash Key', function (err, replies) {
   console.log(replies.length + ' replies:');
   replies.forEach(function (reply, i) {
      console.log('  ' + i + ': ' + reply);
   });
});

// 키값으로 배열 형태로 얻음.
client.hgetall('Hash Key', function (err, obj) {
   console.dir(obj);
});

*/

module.exports = router;