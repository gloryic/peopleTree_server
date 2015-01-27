var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.jsonp("welcom to API affiliates JSON");
});

router.get('/test',function(req,res){
    
    var query = dbcon.query('SELECT id FROM test', function(err,rows){
        console.log(rows);
        res.json(rows);
    });
});

module.exports = router;
