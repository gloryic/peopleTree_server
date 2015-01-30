var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	var authcode = req.query.code;
	console.log(authcode);
	res.render('oauth2_Code', {
			authcode : authcode
	});
});	

module.exports = router;