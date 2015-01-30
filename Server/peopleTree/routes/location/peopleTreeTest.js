var express = require('express');
var router = express.Router();

router.get('/insertNode', function(req, res) {

	peopleTree.insertNode('glory1',function(res){
		console.log(res);
	});
    res.json("welcom to Location Compare API");
});

router.get('/getItems', function(req, res) {

	peopleTree.getItems(1,11,function(err,obj){

		console.log(obj);
		
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

module.exports = router;