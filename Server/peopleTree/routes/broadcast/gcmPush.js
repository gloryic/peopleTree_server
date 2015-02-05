var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');

router.get('/', function(req, res) {

		// create a message with default values
		var message = new gcm.Message();

		// or with object values
		var message = new gcm.Message({
		    collapseKey: 'demo',
		    delayWhileIdle: true,
		    timeToLive: 3,
		    data: {
		        key1: '안녕하세요.',
		        key2: 'saltfactory push demo'
		    }
		});

		var server_access_key = 'AIzaSyBat2HmYVaQGWNhWLhicAAAxl_KY3uxcSE';
		var sender = new gcm.Sender(server_access_key);
		var registrationIds = [];

		var registration_id = 'APA91bG07qBtbF-GYR3M7lGWdEv0SkAvc-4raywm9i0xByjnpBOHYvlKIGLbkkFezGUGCnT7uRFuEdoGNio2G1cyLVR6M2TXxwsdC59nsiWU-WHB--TAzZXyyOZV4_IxXDltIo-3DgBUYQ3QXfof_IepU-_hJYOazA';
		// At least one required

		console.log(registration_id.length);

		registrationIds.push(registration_id);

		/**
		 * Params: message-literal, registrationIds-array, No. of retries, callback-function
		 **/
		sender.send(message, registrationIds, 4, function (err, result) {
		    console.log(result);
		    res.json(result);
		});



});


module.exports = router;