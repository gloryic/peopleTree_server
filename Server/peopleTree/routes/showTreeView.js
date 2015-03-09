var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  
  var userName = req.query.userName;

  res.render('showTree', {
			title : "peopleTree Viewer",
			userName : "'"+userName+"'"
	});
});	

module.exports = router;