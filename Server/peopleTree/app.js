var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var mysql = require('mysql');
var redis = require('redis');

var PeopleTree = require('./routes/location/peopleTree');

var index = require('./routes/index');
var ptreeLogin = require('./routes/peopleTreeLogin');
var ptreeLogout = require('./routes/peopleTreeLogout');

var makeEdge = require('./routes/group/makeEdge');
var makeGroup = require('./routes/group/makeGroup');

var getCurInfo = require('./routes/getinfo/getCurInfo');
var getInfo = require('./routes/getinfo/getInfo');

var treeTest = require('./routes/location/peopleTreeTest');

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

app.use('/ptree/make/edge', makeEdge);
app.use('/ptree/make/group', makeGroup);
app.use('/ptree/getinfo', getCurInfo);//get from redis and RDB
app.use('/ptree/_getinfo', getInfo);//get from RDB
app.use('/ptree/test', treeTest);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

var dbConfig = {
  host:'210.118.74.107',
  port: 3306,
  user: 'root',
  password:'1234',
  database:'peopletree'
};

global.dbcon = mysql.createConnection(dbConfig);

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


