var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var mysql = require('mysql');
var redis = require('redis');
var Parse = require('node-parse-api').Parse;

var PeopleTree = require('./routes/location/peopleTree');

var index = require('./routes/index');
var ptreeLogin = require('./routes/peopleTreeLogin');
var ptreeLogout = require('./routes/peopleTreeLogout');

var makeGroup = require('./routes/group/makeGroup');

var getCurInfo = require('./routes/getinfo/getCurInfo');
var getInfo = require('./routes/getinfo/getInfo');
var getInfoAll = require('./routes/getinfo/getInfoAll');

var broadcast = require('./routes/broadcast/parsePush');
var group = require('./routes/group/group');
var androidEvent = require('./routes/event/androidEvent');
var util = require('./routes/util/peopleTreeUtil');
var geoUtil = require('./routes/location/geoUtil');

var treeTest = require('./routes/location/peopleTreeTest');

var showTreeView = require('./routes/showTreeView');

var app = express();
// view engine setup

app.disable('etag');//not 304

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/main', index);
app.use('/ptree/login', ptreeLogin);
app.use('/ptree/logout', ptreeLogout);

app.use('/ptree/group', group);
app.use('/ptree/make/group', makeGroup);
app.use('/ptree/getinfo', getCurInfo);//get from redis and RDB
app.use('/ptree/_getinfo', getInfo);//get from RDB
app.use('/ptree/getinfoall', getInfoAll);

app.use('/ptree/test', treeTest);
app.use('/ptree/broadcast', broadcast);
app.use('/ptree/event', androidEvent);
app.use('/ptree/util', util);
app.use('/ptree/geoutil', geoUtil);

app.use('/ptree/showTreeView', showTreeView);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

global.baseURL = '210.118.74.107:3000';
//global.baseURL = '210.118.74.230:5033';
//JUYOUNGKWANG-PC

//host:'210.118.74.107',
var dbConfig = {
  host:'210.118.74.107',
  port: 3306,
  user: 'root',
  password:'1234',
  database:'peopletree'
};

var APP_ID = 'sDGocHwgCiClL6qWbc2sOZzDbHtg6JCWWmhGZWIj';
var MASTER_KEY = 'yyF56vK3wjZIyAEEZCzaYZ85COUdbaeHQwRQsFwM';
global.parse = new Parse(APP_ID, MASTER_KEY);
global.dbcon;

function handleDisconnect() {

  dbcon = mysql.createConnection(dbConfig);// Recreate the connection, since
                                                  // the old one cannot be reused.                                         
  dbcon.connect(function(err) {                   // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  dbcon.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// 클라이언트 객체 생성
global.tree = redis.createClient();

tree.on('error', function (err) {
   console.log('redis_Error ' + err);
});

global.peopleTree = new PeopleTree(tree);

// 클라이언트 빠져나오기
//client.quit();

module.exports = app;

//socket
/*
// upgrade http server to socket.io server
var io = require('socket.io').listen(httpServer);

io.sockets.on('connection',function(socket){ //클라이언트가 io.connect('http://localhost') // socket.io 채널로 접속이 되었을때에 대한 이벤트를 정의한다.
   //socket에는 자기자신 클라이언트의 에대한 객체이다
   socket.emit('toclient',{msg:'Welcome'});

   socket.on('fromclient',function(data){
       //tag를 보고 emit 한다.
       socket.broadcast.emit('toclient',data); // 자신을 제외하고 다른 클라이언트에게 보냄
       socket.emit('toclient',data); // 해당 클라이언트에게만 보냄. 다른 클라이언트에 보낼려면?
       //모든 클라이언트에게 메세지를 보낸다.
       console.log('Message from client :'+data.msg);
   })
});

var socket_ids = [];
var count = 0;

io.sockets.on('connection',function(socket){

    socket.on('main',function(data){
            
            console.log("main-socket.id : " + socket.id);

            socket_ids["main"] = socket.id;
            console.log({users:Object.keys(socket_ids)});

            socket.emit('userlist',{users:Object.keys(socket_ids)});
            //socket.emit('userlist',{users:"welcome"});                    
    });

    socket.on('join',function(data){
            
            console.log("nickname0 : " + data.nickname + " socket.id : " + socket.id);

            socket_ids[data.nickname] = socket.id;

            console.log({users:Object.keys(socket_ids)});

            socket.broadcast.emit('userlist',{users:Object.keys(socket_ids)});
            socket.broadcast.emit('setBall',{nickname:data.nickname});                   
    });

    socket.on('disconnect',function(data){
        
            if(data.nickname != undefined){
                delete socket_ids[data.nickname];
                socket.broadcast.emit('userlist',{users:Object.keys(socket_ids)});                   
            }
     });

    socket.on('send_msg',function(data){

          console.log("nickname1 : " + data.nickname );
          console.log("type : " + data.type + " x : " + socket.x+ " y : " + socket.y);

          socket.broadcast.emit('send_msg',data); 

    });
});
*/


