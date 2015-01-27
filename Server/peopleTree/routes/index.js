var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  
  res.render('index', {
			baseURL : "http://192.168.0.254:3000" 
	});
});	

module.exports = router;