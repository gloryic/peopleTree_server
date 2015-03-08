var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  
  var groupMemberId = req.query.groupMemberId;

  res.render('showTree', {
			title : "peopleTree Viewer",
			id : groupMemberId
	});
});	

module.exports = router;