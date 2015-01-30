(function() {
	var express = require('express');
	var router = express.Router();

	router.get('/', function(req, res) {
		res.json("welcom to Membership JSON");
	});

	/*
	#맴버 리스트를 받아온다.
	#doamin : manage.daumtools.com
	#path : GET /rest/members?size={int}
	#req : N/A
	#res : Member Information
	*/
	router.get('/members',function(req,res){
		var size = req.query.size;
		console.log(size);
		if(size==undefined)
			res.json({error : 'GET /rest/members?size={int}'});
		var query = dbcon.query('SELECT * FROM membership_members ORDER BY createdate DESC Limit ?', [parseInt(size)] ,function(err,rows){
			console.log(rows);
			res.json(rows);
		});
	});


	/*
	#Member INFO
	#doamin : manage.daumtools.com
	#path : POST /member/member/insert_from_api
	#req : N/A
	#res : Member Information
	*/
	router.get('/insert_from_api',function(req,res){
	var query = dbcon.query('INSERT INTO membership_members(userid,createdate,joinpath,point) SELECT DISTINCT userid,(SELECT issuedate FROM api_key AS B WHERE B.userid = api_key.userid ORDER BY issuedate LIMIT 1) AS createdate,"openapi",10 FROM api_key WHERE issuedate > ifnull((SELECT createdate FROM membership_members WHERE joinpath = "openapi" ORDER BY createdate DESC LIMIT 1),date(0000-00-00))AND userid NOT IN (SELECT userid FROM membership_members )',function(err,rows){
		console.log(rows);
		console.log(err);
		res.json(rows);
		});
	});
	module.exports = router;

}).call(this);
