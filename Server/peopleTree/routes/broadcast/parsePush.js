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


module.exports = router;