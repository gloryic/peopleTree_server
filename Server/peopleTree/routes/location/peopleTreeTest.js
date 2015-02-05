var express = require('express');
var router = express.Router();

router.get('/insertNode', function(req, res) {

	var userNumber = req.query.userNumber;
	peopleTree.insertNode(userNumber,function(res){
		console.log(res);
	});
    res.json("welcom to Location insertNode API");
});

router.get('/getItems', function(req, res) {

	var groupMemberId = req.query.groupMemberId;

	peopleTree.getItems(groupMemberId,function(err,obj){

		console.log(JSON.stringify(obj));
		res.json(obj);
		
	});
   
});

router.get('/deleteNode', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	peopleTree.deleteNode(userNumber,function(err,obj){

		if(!err){
			res.json(obj);
		}
		else{
			console.log("err");
			res.json(err);
		}
	});
});

router.get('/isRoot', function(req, res) {

	peopleTree.isRoot(11,function(err,obj){

		console.log("/isRoot : "+ obj);
		
	});

    res.json("welcom to Location isRoot API");
});


router.get('/changeParent', function(req, res) {

	var myGroupMemberId = req.query.myGroupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;

	peopleTree.changeParent(myGroupMemberId,parentGroupMemberId,function(err,obj){

		if(!err){
			console.log("/changeParent : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});

router.get('/showTree', function(req, res) {

	var rootGroupMemberId = req.query.rootGroupMemberId;
	/*
	var Tree = {id : 1, children:[]};
	var position = Tree.children;
	position.push({id : 1, children:[]});
	console.log(position.length-1);
	position = position[position.length-1].children;
	position.push({id : 3, children:[]});
	position[this.length-1].children.push({id : 4, children:[]});
	*/
	peopleTree.isExist(rootGroupMemberId, function(err,flag){
		if(!err){
			if(flag){
				global.callNumber = 0;
				global.treeJson = [{id : rootGroupMemberId, children:[]}];
				var position = treeJson;
				callNumber++;
				console.log("root callNumber1 : "+ callNumber);
				peopleTree.showTree(rootGroupMemberId ,position, 0, function(obj){
					console.log("root callNumber2 : "+ callNumber);
					if(callNumber==0) res.json(treeJson);
				});
			}
			else{
				res.json({state:200,errorDesc:"not exist groupMemberId"});
			}
		}
		else{
			res.json({state:500,errorDesc:"redis error"});
		}
	});
});

router.get('/isValidChange', function(req, res) {

	var myGroupMemberId = req.query.myGroupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;

	peopleTree.isValidChange(myGroupMemberId,parentGroupMemberId,function(err,obj){

		if(!err){
			console.log("/isValidChange : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});


router.get('/setLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var longitude = req.query.longitude;
	var latitude = req.query.latitude;

	peopleTree.setLocation(groupMemberId, latitude, longitude, function(err,obj){

		if(!err){
			console.log("/setLocation : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});


router.get('/getLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;

	peopleTree.getLocation(groupMemberId, function(err,obj){

		if(!err){
			console.log("/getLocation : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});


router.get('/checkTrackingModeAndAreaMode', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;
	var manageMode = req.query.manageMode;

	peopleTree.checkTrackingModeAndAreaMode(groupMemberId, parentGroupMemberId, manageMode, function(err,obj){

		if(!err){
			console.log("/checkTrackingModeAndAreaMode : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});

router.get('/checkLocation', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;
	var manageMode = req.query.manageMode;

	peopleTree.checkLocation(groupMemberId, parentGroupMemberId, manageMode, function(err,obj){

		console.log(err);

		if(!err){
			console.log("/checkLocation : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});


router.get('/checkGeofencingMode', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var parentGroupMemberId = req.query.parentGroupMemberId;

	peopleTree.checkGeofencingMode(groupMemberId, parentGroupMemberId, function(err,obj){

		console.log(err);

		if(!err){
			console.log("/checkGeofencingMode : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});


router.get('/isPointOnLine', function(req, res) {

	var A={lat : 0, lng : 3};
	var B={lat : 0, lng : 0};
	var P={lat : 0, lng : -2};

	res.json(peopleTree.isPointOnLine(A,B,P));

});


router.get('/setGeoPoint', function(req, res) {

	var groupMemberId = req.query.groupMemberId;
	var radius = req.query.radius;
	var points;// = [{lat:3,lng:1},{lat:2,lng:5}];//req.query.points;//[{}]

	peopleTree.setGeoPoint(groupMemberId, radius, points, function(err,obj){

		if(!err){
			console.log("/setGeoPoint : "+ JSON.stringify(obj));
			res.json(obj);
		}
		else{
			res.json(err);
		}
	});
});

module.exports = router;