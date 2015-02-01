var express = require('express');
var router = express.Router();

router.get('/insertNode', function(req, res) {

	var userId = req.query.userId;
	peopleTree.insertNode(userId,function(res){
		console.log(res);
	});
    res.json("welcom to Location Compare API");
});

router.get('/getItems', function(req, res) {

	var groupId = req.query.groupId;
	var groupMemberId = req.query.groupMemberId;

	peopleTree.getItems(groupId,groupMemberId,function(err,obj){

		console.log(JSON.stringify(obj));
		
	});
    res.json("welcom to Location getItems API");
});


router.get('/updateLocation', function(req, res) {

	peopleTree.updateLocation(1,11,2.1111,3.1111,function(err,obj){

		console.log("/updateLocation : "+obj);
		
	});

    res.json("welcom to Location updateLocation API");
});


router.get('/deleteNode', function(req, res) {

	peopleTree.deleteNode(1,11,function(err,obj){

		console.log("/deleteNode : "+ obj);
		
	});

    res.json("welcom to Location updateLocation API");
});

router.get('/isRoot', function(req, res) {

	peopleTree.isRoot(1,11,function(err,obj){

		console.log("/isRoot : "+ obj);
		
	});

    res.json("welcom to Location updateLocation API");
});


router.get('/changeParent', function(req, res) {

	var myGroupId = req.query.myGroupId;
	var myGroupMemberId = req.query.myGroupMemberId;
	var parentGroupId = req.query.parentGroupId;
	var parentGroupMemberId = req.query.parentGroupMemberId;

	peopleTree.changeParent(myGroupId,myGroupMemberId,parentGroupId,parentGroupMemberId,function(err,obj){

		console.log("/changeParent : "+ JSON.stringify(obj));
		res.json(obj);
		
	});
});

router.get('/showTree', function(req, res) {

	var rootGroupId = req.query.rootGroupId;
	/*
	var Tree = {id : 1, children:[]};
	var position = Tree.children;

	position.push({id : 1, children:[]});

	console.log(position.length-1);

	position = position[position.length-1].children;

	position.push({id : 3, children:[]});

	position[this.length-1].children.push({id : 4, children:[]});
	*/

	global.callNumber = 0;

	global.treeJson = [{id : rootGroupId, children:[]}];

	var position = treeJson;

	callNumber++;
	console.log("root callNumber1 : "+ callNumber);

	peopleTree.showTree(rootGroupId ,position, 0, function(){

		console.log("root callNumber2 : "+ callNumber);
		if(callNumber==0) res.json(treeJson);
	});

});


module.exports = router;