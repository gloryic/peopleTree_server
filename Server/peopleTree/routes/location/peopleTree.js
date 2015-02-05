var _     = require('lodash');
var async = require('async');
var request = require('request');
var url = require('url');
var gps = require('gps-util');

function PeopleTree(redisClient){}

//로그인시 첫 수행
PeopleTree.prototype.insertNode = function(userNumber, f) {

      var items={};
      async.waterfall([
        function (callback) {
          console.log('--- async.waterfall insertNode #1 ---');
          request( {
            method: 'GET',
            url: 'http://210.118.74.107:3000/ptree/_getinfo/group/member?userNumber='+userNumber,
          }, function(err, response) {
            if(!err){
              items = JSON.parse(response.body).responseData;
              //관리 인원의 초기화
              items.managingNumber = 0;
              items.managingTotalNumber = 0;
              console.log("insertNode_start_groupMemberId : "+items.groupMemberId);
              callback(null,items);
            }
            else
              callback(err,null);
          });
        },

        function (items, callback) {
          console.log('--- async.waterfall insertNode #2 ---');
          //이미 있는지 
          tree.llen("L/"+items.groupMemberId, function (err, length) {
            console.log("length / "+length);
            if (err) {
              console.log("err : "+err.message);
              return;
            }
            else{
              if(length == 0){
                callback(null, items.groupMemberId, 1);
              }
              else
                callback(null, items.groupMemberId, 0);
            }
          });
        },

        function (groupMemberId, flag, callback) {
          console.log('--- async.waterfall insertNode #3 ---');
          if(flag){
            //해시 테이블에는 노드에 대한 정보를 가지고 있다. //nested 구조가 되지 않아 
            tree.rpush("L/"+groupMemberId, groupMemberId);//0번 나
            tree.rpush("L/"+groupMemberId, groupMemberId);//1번 나의 부모, 여기선 첫 생성 이기에 나의 부모가 나다
            callback(null, groupMemberId, 1);
          }
          else{
            callback(null, groupMemberId, 0);
          }
        },

        function (groupMemberId, flag, callback) {
          console.log('--- async.waterfall insertNode #4 ---');
          if(flag){
            //tree.rpush("G/"+groupMemberId, items.manageMode);//0번 나의 관리모드
            tree.rpush("G/"+groupMemberId, items.managedLocationRadius, function(err,result){
              if(!err) callback(null, groupMemberId, 1);
              else callback(err.message,null);
            });
          }
          else{
            callback(null, groupMemberId, 0);
          }
        },

        function (groupMemberId, flag, callback) {
          console.log('--- async.waterfall insertNode #5 ---');
          if(flag){
              tree.hmset("H/"+groupMemberId, items, function (err,obj){
                if (!err)
                    callback(null, {userNumber : groupMemberId, desc : 'make hash and list'});
                else
                    callback(err.message,null);
              });
          }
          else{
              callback(null, {userNumber : groupMemberId, desc : 'already exist list'});
          }
        }
      ],

      function(err, results) {
        console.log('--- async.waterfall result insertNode #1 ---');
        if(!err)
          return f(null,results)
        else
          return f(err,null)
      });
};

PeopleTree.prototype.getItems = function(groupMemberId, f) {
    tree.hgetall("H/"+groupMemberId, function(err,obj){
        console.log("getItems_hgetall : " + JSON.stringify(obj));
        if(!err)
          return f(null,obj);
        else
          return f(err.message,null);
    });
}

PeopleTree.prototype.isExist = function(groupMemberId, f) {
    tree.hgetall("H/"+groupMemberId, function(err,obj){
        console.log("isExist "+groupMemberId+" : " + JSON.stringify(obj));
        if(!err){
          if(obj!=null)
            return f(null,true);
          else
            return f(null,false);
        }
        else
          return f(err.message,null);
    });
}

PeopleTree.prototype.isValidChange = function(groupMemberId, parentGroupMemberId, f) {

  var curParent = parentGroupMemberId;
  var pastParent = -1;
  var valid = true;

  async.whilst(function () {

    console.log(curParent+"=="+groupMemberId);
    if(curParent==groupMemberId)
      valid=false;

    return curParent!=pastParent && valid;
  },
  function (next) {
      tree.lindex("L/"+curParent,1,function(err,parentId){
        console.log("curParent : "+parentId);

        pastParent = curParent;
        curParent = parentId;

        next();
      });
  },
  function (err) {
    return f(null,valid);
  });
}

PeopleTree.prototype.changeParent = function(groupMemberId, parentGroupMemberId, f) {

  peopleTree.isValidChange(groupMemberId,parentGroupMemberId, function(err,valid){

    if(valid){
      async.waterfall([

        function (callback) {
          console.log('--- async.waterfall changeParent #1 ---');
            tree.hgetall("H/"+groupMemberId, function(err,myData){
              console.log("myData : " + JSON.stringify(myData));
              if(!err){
                if(myData!=null){
                  callback(null,myData);
                }
                else
                  callback({state:404, errorDesc:"not found that Data about groupMemberId"},null);
              }
              else
                callback({state:300, errorDesc:error.message},null);
            });
        },

        function (myData, callback) {
          console.log('--- async.waterfall changeParent #2 ---');
          //붙을려는 부모가 이미 내 부모인지 
          tree.hgetall("H/"+parentGroupMemberId, function(err,parentData){
            console.log("parentData : " + JSON.stringify(parentData));
            if(!err){
                if(parentData!=null){

                  if(myData.parentGroupMemberId == parentData.groupMemberId) 
                    callback({state:303, errorDesc:"already setting that parentId "},null);//이미 변경 하려는 부모가 내 부모
                  else
                    callback(null,myData,parentData);
                }
                else
                  return callback({state:404, errorDesc:"not found that Data about ParentGroupMemberId"},null);
            }
            else
              return callback({state:300, errorDesc:error.message},null);
          });
        },

        function (myData, parentData, callback) {
          console.log('--- async.waterfall changeParent #3 ---');
           //원래 부모에서 나를 제거한다.
          if(groupMemberId != myData.parentGroupMemberId){
            tree.lrem("L/"+myData.parentGroupMemberId, -1, groupMemberId, function(err, deleteNumber){
              if(!err)
                callback(null,myData,parentData);
              else
                callback({state:300, errorDesc:""},null);
            });
          }
          else
            callback(null,myData,parentData);
        },

        function (myData, parentData, callback) {
          console.log('--- async.waterfall changeParent #4 ---');
          //1. 나의 부모를 변경
          //2. 나의 그룹 아이디를 변경
          var items = {groupId:parentData.groupId, parentGroupMemberId:parentGroupMemberId};
          console.log("myChangeParent : "+JSON.stringify(items));
          tree.hmset("H/"+groupMemberId, items, function(err,obj){
            if(!err)
              callback(null,myData, parentData);
            else
              callback(err.message,null);
          });
        },

        function (myData, parentData, callback) {
          console.log('--- async.waterfall changeParent #5 ---');
          //부모의 관리 인원 정보를 업데이트. 내가 관리 하고 있는 인원 + 1(나)
          var parentitems = {
                              managingTotalNumber: parseInt(parentData.managingTotalNumber,10)+parseInt(myData.managingTotalNumber,10)+1, 
                              managingNumber:parseInt(parentData.managingTotalNumber,10)+parseInt(myData.managingTotalNumber,10)+1
                            };
          console.log("parentChangeParent : "+JSON.stringify(parentitems));

          tree.hmset("H/"+parentGroupMemberId, parentitems,function(err,obj){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        },

        function (callback) {
          console.log('--- async.waterfall changeParent #6 ---');
          //리스트에서 나의 부모를 변경
          tree.lset("L/"+groupMemberId,1,parentGroupMemberId,function(err,obj){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        },

        function (callback) {
          console.log('--- async.waterfall changeParent #7 ---');
          //리스트에서 부모의 자식에게 나를 추가한다.
          tree.rpush("L/"+parentGroupMemberId,groupMemberId,function(err,obj){
            if(!err)
              callback(null,{state:200, responseData : "success change parent"});
            else
              callback(err.message,null);
          });
        }
      ],

      function(err, results) {
        console.log('--- async.waterfall result insertNode #1 ---');
        if(!err)
          return f(null,results)
        else
          return f(err,null)
      });

    }
    else
      return f({state:300, errorDesc:"not allow this change"},null)
  });
}

PeopleTree.prototype.setManageNumber = function(groupMemberId, managingTotalNumber,managingNumber, f) {

  peopleTree.isExist(groupMemberId, function(err,exist){

    var items = {
                  managingTotalNumber:managingTotalNumber,
                  managingNumber:managingNumber
                };

    console.log("setManageNumber : "+JSON.stringify(items));

    if(exist){
      tree.hmset("H/"+groupMemberId, items);
      return f(null);
    }
    else
      return f(err);
  });
}

PeopleTree.prototype.deleteNode = function(groupMemberId, f) {

  async.waterfall([
      //부모 아이디 가져오기
      function (callback) {
          console.log('--- async.waterfall delete Node #1 ---');

            tree.lindex("L/"+groupMemberId,1,function(err,parentGroupMemberId){
              console.log("parentGroupMemberId : "+parentGroupMemberId);//값 하나만 가져온다. 키 없이 값만

              if(!err){
                //parentGroupMemberId is null
                if(parentGroupMemberId)
                    callback(null,parentGroupMemberId);
                else{
                  callback({status:300, errorDesc : "not have node data"},null);
                }
              }
              else
              callback(err.message,null)
            });
      },
      //부모에서 자식인 나 지우기
      function (parentGroupMemberId, callback) {
          console.log('--- async.waterfall delete Node #2 ---');
          //나의 부모가 있을때
          if(groupMemberId != parentGroupMemberId){
            tree.lrem("L/"+parentGroupMemberId, -1, groupMemberId , function(err,deleteNumber){
              console.log("delete myId from parent L : "+deleteNumber);

              if(!err){
                if(deleteNumber != 1)
                  callback({status:500, errorDesc : "my parent is not real parent"}, null);
                else
                  callback(null, parentGroupMemberId, deleteNumber);
              }
              else
                callback(err.message, null);
            });
          }
          else{
            callback(null, parentGroupMemberId, 0);
          }
      },
      //나의 자식들 나의 부모에게 위임하기
      function (parentGroupMemberId, deleteNumber, callback) {
          console.log('--- async.waterfall delete Node #3 ---');
          if(deleteNumber){
            tree.lrange('L/'+groupMemberId, 2, -1, function (err, items) {
              if (!err){
                console.log('item.length : '+items.length);
                var count = items.length-1;
                items.forEach(function (childGroupid) {
                  tree.rpush("L/"+parentGroupMemberId, childGroupid, function(err,obj){
                    console.log("count"+count);
                    if(!count--)
                      callback(null,deleteNumber);
                  });
                });
              }
              else
                callback(err.message,null);
            });
          }
          else
            callback(null,deleteNumber);
      },
      //나의 해시테이블 지우기
      function (parentDeleteNumber, callback) {
          console.log('--- async.waterfall delete Node #4 ---');

          tree.del("H/"+groupMemberId, function(err,deleteNumber){

          console.log("H deleteNode : "+deleteNumber);

          if(!err)
            callback(null, deleteNumber+parentDeleteNumber);
          else
            callback(err.message, null);
          });
      },
      //나의 트리를 위한 리스트 지우기
      function (hashDeleteNumber, callback) {
        console.log('--- async.waterfall delete Node #5--');

          tree.del("L/"+groupMemberId, function(err,deleteNumber){

          console.log("L deleteNode : "+deleteNumber);

          if(!err)
            callback(null, deleteNumber+hashDeleteNumber);
          else
            callback(err.message, null);
          });
      },
      //나의 위치를 위한 리스트 지우기
      function (listDeleteNumber, callback) {
        console.log('--- async.waterfall delete Node #5--');

          tree.del("G/"+groupMemberId, function(err,deleteNumber){

          console.log("G deleteNode : "+deleteNumber);

          if(!err)
            callback(null, deleteNumber+listDeleteNumber);
          else
            callback(err.message, null);
          });
      }      
    ],

    function(err, results) {
      console.log('--- async.waterfall result delete Node #1 ---');
      console.log(arguments);
      if(!err)
        return f(null,results)
      else{
        return f(err, null)
      }
  });
}

PeopleTree.prototype.isRoot = function(groupMemberId, f) {

  tree.hget("H/"+groupMemberId,'parentGroupMemberId',function(err,parentGroupMemberId){
    console.log("parentGroupMemberId : "+parentGroupMemberId);//값 하나만 가져온다. 키 없이 값만

    if(!err){
      if(groupMemberId == parentGroupMemberId) return f(null,true);
      else return f(null,false);
    }
    else
      return f(err.message,null);
  });
}

//부모가 정한 유효 범위에 있는지 체크한다.
//manageMode는 
//100은 관리대상
//200은 관리자
//210은 트레킹 모드. 참조값 : 관리자의 위치, 반경
//220 지역모드 : 중심 위치, 반경
//230은 지오펜스모드
//230이면 managedlocationpoint 테이블을 참조한다.

//G/{groupMemberId} : 0번 반경, 
PeopleTree.prototype.changeManageMode = function(groupMemberId, manageMode, f) {
  tree.hset('H/'+groupMemberId, 'manageMode', manageMode, function(err, updateNumber){
    if(!err){
      if(updateNumber==1)
        return f(null, 1);
      else
        return f(null, 0);
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.changeEdgeStatus = function(groupMemberId, edgeStatus, f) {
  tree.hset('H/'+groupMemberId, 'edgeStatus', edgeStatus, function(err, updateNumber){
    if(!err){
      if(updateNumber==1)
        return f(null, 1);
      else
        return f(null, 0);
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.changeRadius = function(groupMemberId, changeRadius, f) {
  //해쉬태입블의 반경을 수정한다.
  tree.hset('H/'+groupMemberId, 'managedLocationRadius', changeRadius, function(err, updateNumber){
    if(!err){
      if(updateNumber==1){
        //리스트의 반경을 수정한다.
        tree.lset("G/"+groupMemberId,0,changeRadius, function(err,updateNumber){
          if(!err){
            if(updateNumber==1)
              return f(null, 1);
            else
              return f(null, 0);
          }
          else
            f(err.message, null);
        });
      }
      else
        return f(null, 0);
    }
    else
      return f(err.message, null);
  });
}

//위치 유효성 검사에 사용될 포인트를 세팅한다.
//points=[{lat:0,lng:0},{lat:0,lng:0},{lat:0,lng:0},{lat:0,lng:0}]
PeopleTree.prototype.setGeoPoint = function(groupMemberId, radius, points, f) {
// 0 기본
// "G/" 지우고 다시 만들자.
// 있다면->지운다. -> 다시 만들기
// "G/"의 길이는 1+2*points.length
//TODO

  var length = 0;
  if(points) length = points.length;

  console.log("setGeo Points length : "+length);

  async.waterfall([

      function(callback){
         console.log('--- async.waterfall setGeoPoint Node #1 ---');
         tree.exists("G/"+groupMemberId, function(err, exist){
          if(!err){
              callback(null,exist);
          }
          else callback(err.message,null);
         });
      },

      function(exist, callback){
         console.log('--- async.waterfall setGeoPoint Node #2 ---');
         if(exist){
          tree.del("G/"+groupMemberId, function(err,deleteNumber){
            console.log("G deleteNode : "+deleteNumber);
            if(!err)
              callback(null);
            else
              callback(err.message, null);
          });
         }
         else callback(null);
      },

      function(callback){
        console.log('--- async.waterfall setGeoPoint Node #3 ---');
        tree.rpush("G/"+groupMemberId, radius, function(err,result){
          if(!err) callback(null);
          else callback(err.message,null);
        });
      },

      function(callback){
        console.log('--- async.waterfall setGeoPoint Node #4 ---');
        var count = 0;
        var lat, lng;

        async.whilst(function () {
          return length > count;
        },
        function (next) {

          lat = points[count].lat;
          lng = points[count].lng;

          tree.rpush("G/"+groupMemberId, lat, function(err,listLength){
            console.log("listLength : "+JSON.stringify(listLength));
            tree.rpush("G/"+groupMemberId, lng, function(err,listLength){
              console.log("listLength : "+JSON.stringify(listLength));
              count++;
              next();
            });
          });
        },
        function (err) {
          callback(null, count*2+1);
        });
      }
  ],

  function(err, results) {
    console.log('--- async.waterfall result setGeoPoint Node #1 ---');
    console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }
  });
}

//해쉬에 현 위치를 업데이트한다.
PeopleTree.prototype.setLocation = function(groupMemberId, latitude, longitude, f) {

  peopleTree.isExist(groupMemberId, function(err,exist){

    var items = {
                  longitude:longitude,
                  latitude:latitude
                };

    console.log("setLocation : "+JSON.stringify(items));
    console.log("exist : "+exist);

    if(exist){
      tree.hmset("H/"+groupMemberId, items, function(err, updateNumber){
        if(!err)
          if(updateNumber == 'OK') return f(null,1);
          else return f(null,0);
        else
          return f(err.message,null);
      });
    }
    else
      return f({state:404, errorDesc:"not exist"},null);
  });
}

PeopleTree.prototype.getLocation = function(groupMemberId, f){
  tree.hmget('H/'+groupMemberId, 'latitude', 'longitude', function(err,obj){
    console.log(obj.length);
    if(!err){
      if(obj.length==2) return f(null, {latitude:parseFloat(obj[0]), longitude:parseFloat(obj[1])} );
      else return f({state:400, errorDesc : "not pair location"}, null);
    }
    else return f(err.message, null);
  });
}

PeopleTree.prototype.checkLocation = function(groupMemberId, parentGroupMemberId, manageMode, f) {
   console.log("checkLocation"); 
  //210 - 트레킹 모드 //220 - 지역모드
  if(manageMode==210 || manageMode==220){
    peopleTree.checkTrackingModeAndAreaMode(groupMemberId,parentGroupMemberId, manageMode, function(err, result){
      if(!err){
        if(result) return f(null, result);
        else return f({state:400, errorDesc : "error checkLocation"}, null);
      }
      else
        return f(err, null);
    });
  }
  //지오펜스 모드
  else if(manageMode==230){
    peopleTree.checkGeofencingMode(groupMemberId,parentGroupMemberId, function(err, result){
      if(!err){
        if(result) return f(null, result);
        else return f({state:400, errorDesc : "error checkLocation"}, null);
      }
      else
        return f(err, null);
    });
  }
}

PeopleTree.prototype.checkTrackingModeAndAreaMode = function(groupMemberId, parentGroupMemberId, manageMode, f) {
  console.log("checkTrackingMode");
  //부모의 현재 위치와 나의 위치 거리가 부모가 설정한 반경 안에 있어야한다.

  var validation = true;
  var points=[{lat: 0, lng: 0 },{ lat: 0, lng: 0 }]; //위도(lat), 경도(lng)
  //37.556346, 126.946067 // 37.554399, 126.946035
  async.waterfall([

      function(callback){
         console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #1 ---');
         peopleTree.getLocation(groupMemberId, function(err, obj){
          if(!err){
            if(obj.longitude && obj.latitude){
              points[0].lng = obj.longitude;
              points[0].lat = obj.latitude;
              callback(null);
            }
            else callback({state:400, errorDesc:"your location is null"},null);
          }
          else callback(err.message,null);
         });
      },

      function(callback){

        if(manageMode==210){

          console.log("##TrackingMode##");
          console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #2 ---');

          peopleTree.getLocation(parentGroupMemberId, function(err, obj){
            if(!err){
              if(obj.longitude && obj.latitude){
                points[1].lat = obj.latitude;
                points[1].lng = obj.longitude;
                callback(null);
              }
              else callback({state:400, errorDesc:"parent location is null"},null);
            }
            else callback(err.message,null);
          });
        }
        else if(manageMode==220){
          console.log("##AreaMode##");
            tree.lrange('G/'+parentGroupMemberId, 1, 2, function (err, items) {

              if(!err){
                if(items.length==2){
                  points[1].lat = items[0];
                  points[1].lng = items[1];
                  callback(null);
                }
                else callback({state:400, errorDesc:"parent location is null"},null);
              }
              else callback(err.message,null);              

            });
         }
         else
          callback({state:400, errorDesc:"invaild mode"},null);
      },

      function(callback){
        //부모가 설정한 반경을 가져온다.
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #3 ---');
        tree.lindex("G/"+parentGroupMemberId,0,function(err,_radius){
          var radius = parseFloat(_radius);
          console.log("Parent radius : "+radius);
          if(!err){
            callback(null,radius);
          }
          else
            callback(err.message,null);
        });
      },

      function(radius, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #4 ---');
        var distance = gps.getTotalDistance(points);
        console.log("distance : " + distance);

        if(radius < distance) validation = false;

        //validation==false 면 edgeStatus를 300으로 변경
        if(!validation){
          peopleTree.changeEdgeStatus(groupMemberId, 300, function(err, updateNumber){
            if(!err){
              if(updateNumber==0) callback(null, {radius: radius, distance: distance, edgeStatus: "change 300", validation : validation});
              else callback({state:300,errorDesc:"not exist edgeStatus"},null);
            }
            else
              callback(err.message, null);
          });
        }
        else{
          peopleTree.changeEdgeStatus(groupMemberId, 200, function(err, updateNumber){
            if(!err){
              if(updateNumber==0) callback(null, {radius: radius, distance: distance, edgeStatus: "change 200", validation : validation});
              else callback({state:300,errorDesc:"not exist edgeStatus"},null);
            }
            else
              callback(err.message, null);
          });
        }
      }
  ],

  function(err, results) {
    console.log('--- async.waterfall result checkTrackingModeAndAreaMode Node #1 ---');
    console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }

  });
}

//A(x1, y1), B(x2, y2), P(x3, y3)
PeopleTree.prototype.isPointOnLine = function(A, B, P){

  var validation = true;
  var x1, y1, x2, y2, x3, y3, xk, yk, k;
  x1=A.lat; y1=A.lng; x2=B.lat; y2=B.lng; x3=P.lat; y3=P.lng;

  var a = (y2-y1);
  var b = -1*(x2-x1);
  var c = (y1*(x2-x1) - (a*x1));

  console.log("a = "+a);
   console.log("b = "+b);
    console.log("c = "+c);

  k = ((-1)*(a*x3+b*y3+c)/(a*a + b*b));
  xk = x3 + a*k;
  yk = y3 + b*k;

  console.log("xk : "+ xk);
  console.log("yk : "+ yk);

  var max_X = x1 > x2 ? x1 : x2;
  var min_X = x1 < x2 ? x1 : x2;

  var max_Y = y1 > y2 ? y1 : y2;
  var min_Y = y1 < y2 ? y1 : y2;

  console.log("yk < min_Y : "+yk+"<"+min_Y);

  if(xk > max_X) validation = false;
  if(xk < min_X) validation = false;
  if(yk > max_Y) validation = false;
  if(yk < min_Y) validation = false;

  return validation;
}

PeopleTree.prototype.checkGeofencingMode = function(groupMemberId, parentGroupMemberId, f) {
  console.log("checkGeofencingMode");

  var validation = true;
  var point={lat: 0, lng: 0}; //위도(lat), 경도(lng)

  async.waterfall([

      function(callback){
         console.log('--- async.waterfall checkGeofencingMode Node #1 ---');
         peopleTree.getLocation(groupMemberId, function(err, obj){
          if(!err){
            if(obj.longitude && obj.latitude){
              point.lat = obj.latitude;
              point.lng = obj.longitude;
              callback(null);
            }
            else callback({state:400, errorDesc:"your location is null"},null);
          }
          else callback(err.message,null);
         });
      },

      function(callback){
         console.log('--- async.waterfall checkGeofencingMode Node #2 ---');
          tree.lrange('G/'+parentGroupMemberId, 1, -1, function (err, items) {
            console.log('item.length : '+items.length);
            console.log('item.length : '+JSON.stringify(items));

            if (!err){
              var length = items.length;
              var past={lat:0, lng:0};
              var cur={lat:0, lng:0};
              var first={lat:0, lng:0};

              if(length < 8) callback({state:300,errorDesc:"not enough point, more than triangle"},null);

              cur.lat = items[0];
              cur.lng = items[1];

              first.lat = items[0];
              first.lng = items[1];
              var flag = true;

              for (i = 2; i < length; i++) { 

                past.lat = cur.lat;
                past.lng = cur.lng;
                cur.lat = items[i];
                cur.lng = items[++i];

                console.log("past : "+JSON.stringify(past));
                console.log("cur : "+JSON.stringify(cur));

                flag = peopleTree.isPointOnLine(past,cur,point);

                if(!flag)
                  break;
              }

              if(!flag)
                callback(null,false);
              else{
                console.log("first : "+JSON.stringify(first));
                console.log("cur : "+JSON.stringify(cur));
                if(!peopleTree.isPointOnLine(first,cur,point))
                    callback(null,false);
                else
                  callback(null,true);
              }
            }
            else
              callback(err.message,null);
          });
      },

      function(validation, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #4 ---');
        //validation==false 면 edgeStatus를 300으로 변경
        if(!validation){
          peopleTree.changeEdgeStatus(groupMemberId, 300, function(err, updateNumber){
            if(!err){
              if(updateNumber==0) callback(null, {edgeStatus: "change 300", validation : validation});
              else callback({state:300,errorDesc:"not exist edgeStatus"},null);
            }
            else
              callback(err.message, null);
          });
        }
        else{
          peopleTree.changeEdgeStatus(groupMemberId, 200, function(err, updateNumber){
            if(!err){
              if(updateNumber==0) callback(null, {edgeStatus: "change 200", validation : validation});
               else callback({state:300,errorDesc:"not exist edgeStatus"},null);
            }
            else
              callback(err.message, null);
          });
        }
      }
  ],

  function(err, results) {
    console.log('--- async.waterfall result checkGeofencingMode Node #1 ---');
    console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }
  });
}

PeopleTree.prototype.broadcast = function(groupMemberId, depth, f) {

}


PeopleTree.prototype.showTree = function(rootGroupMemberId, position, index, f) {

    async.waterfall([

      function(callback) {
        console.log('--- async.waterfall #1 ---');
        console.log(JSON.stringify(treeJson));

        console.log("callNumber : "+ callNumber);

        position = position[index].children;
        callback(null, position, rootGroupMemberId, f);
      },

      function(position, popGroupId, f, callback) {

        console.log('--- async.waterfall #2 ---');

        tree.lrange('L/'+popGroupId, 2, -1, function (err, items) {

          if (err) console.log("err : "+err.message);

          var count = 0;
          console.log('item.length : '+items.length);
          items.forEach(function (childGroupid) {

            console.log("items.length : "+items.length);
            console.log("childGroupid "+count+" : "+childGroupid);
           
            position.push({id : childGroupid, children:[]});

            callNumber++;

            peopleTree.showTree(childGroupid, position, count, f);

            count++;
          });
          callback(null, f);
        });
      }
    ],

    function(err, f) {
      console.log('--- async.waterfall result #1 ---');
      callNumber--;

      console.log("result callNumber : "+ callNumber);

      if(callNumber==0) return f("test");
    });
}

/*
deleteNode할때 처리함
PeopleTree.prototype.saveInDataBase = function(f) {

}
*/

module.exports = PeopleTree;