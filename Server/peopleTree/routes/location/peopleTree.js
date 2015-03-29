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
            url: 'http://127.0.0.1:5050/ptree/_getinfo/group/member?userNumber='+userNumber
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
              callback({userNumber : groupMemberId, desc : 'already exist list'},null);
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
        if(!err)
          return f(null,obj);
        else
          return f(err.message,null);
    });
}

PeopleTree.prototype.isExist = function(groupMemberId, f) {
    tree.exists("H/"+groupMemberId, function(err,result){
        console.log("isExist "+groupMemberId+" : " + result);
        if(!err){
          if(result)
            return f(null,true);
          else
            return f(null,false);
        }
        else
          return f(err.message,null);
    });
}

//븉으려고 하는 노드의 부모중에 내가 있으면 안된다. 이걸 체크
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
  var managingNumber = 0;
  peopleTree.isValidChange(groupMemberId,parentGroupMemberId, function(err,valid){

    if(valid){
      async.waterfall([

        function (callback) {
          console.log('--- async.waterfall changeParent #1 ---');
            tree.hgetall("H/"+groupMemberId, function(err,myData){
              if(!err){
                if(myData!=null){
                  callback(null,myData);
                }
                else
                  callback({status:404, errorDesc:"not found that Data about groupMemberId"},null);
              }
              else
                callback({status:300, errorDesc:error.message},null);
            });
        },

        function (myData, callback) {
          console.log('--- async.waterfall changeParent #2 ---');
          //붙을려는 부모가 이미 내 부모인지 
          tree.hgetall("H/"+parentGroupMemberId, function(err,parentData){
            if(!err){
                if(parentData!=null){

                  if(myData.parentGroupMemberId == parentData.groupMemberId) 
                    callback({status:303, errorDesc:"already setting that parentId "},null);//이미 변경 하려는 부모가 내 부모
                  else
                    callback(null,myData,parentData);
                }
                else
                  return callback({status:404, errorDesc:"not found that Data about ParentGroupMemberId"},null);
            }
            else
              return callback({status:300, errorDesc:error.message},null);
          });
        },

        function (myData, parentData, callback) {
          console.log('--- async.waterfall changeParent #3 ---');
           //원래 부모에서 나를 제거한다.
           console.log("groupMemberId != myData.parentGroupMemberId / "+ groupMemberId +" != "+ myData.parentGroupMemberId);
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
          //부모가 바뀌기전 부모의 관리 인원 정보를 업데이트.
          //내가 관리하고 있는 전체 인원(totalManageMember)의 수+1(자기 자신 포함)을 뺀다.
          if(groupMemberId != myData.parentGroupMemberId){

            managingNumber = parseInt(myData.edgeStatus) == 200 ? -1*(parseInt(myData.managingNumber)+1) : -1*(parseInt(myData.managingNumber));

            peopleTree.affectAllParents(groupMemberId, -1*(parseInt(myData.managingTotalNumber)+1), managingNumber, function(err,result){
              if(!err)
                callback(null,myData,parentData);
              else
                callback(err.message,null);
            });
          }
          else
            callback(null,myData,parentData);
        },

        function (myData, parentData, callback) {
          console.log('--- async.waterfall changeParent #5 ---');
          //1. 나의 부모를 변경
          //2. 나의 그룹 아이디를 변경
          //3. 초기화
          var items = {groupId:parentData.groupId, parentGroupMemberId:parentGroupMemberId, edgeStatus:200, accumulateWarning : 0};
          console.log("myChangeParent : "+JSON.stringify(items));
          tree.hmset("H/"+groupMemberId, items, function(err,obj){
            if(!err)
              callback(null, myData);
            else
              callback(err.message,null);
          });
        },

        function (myData, callback) {
          console.log('--- async.waterfall changeParent #7 ---');
          //리스트에서 나의 부모를 변경
          tree.lset("L/"+groupMemberId,1,parentGroupMemberId,function(err,obj){
            if(!err)
              callback(null, myData);
            else
              callback(err.message,null);
          });
        },

        function (myData, callback) {
          console.log('--- async.waterfall changeParent #6 ---');
          //부모가 변경되고 부모의 관리 인원 정보를 업데이트.
          //내가 관리하고 있는 전체 인원의 수+1을 더한다.  
          peopleTree.affectAllParents(groupMemberId, parseInt(myData.managingTotalNumber)+1, parseInt(myData.managingNumber)+1, function(err,result){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        },

        function (callback) {
          console.log('--- async.waterfall changeParent #8 ---');
          //리스트에서 부모의 자식에게 나를 추가한다.
          tree.rpush("L/"+parentGroupMemberId,groupMemberId,function(err,obj){
            if(!err)
              callback(null,{status:200, responseData : "success change parent"});
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
      return f({status:300, errorDesc:"not allow this change"},null)
  });
}

PeopleTree.prototype.affectAllParents = function(groupMemberId, totalNumber, number, f) {

  //부모의 관리 인원 정보를 업데이트. 내가 관리 하고 있는 인원 + 1(나)
  //groupMemberId의 부모로 시작해서 (accumulWarning-1) 위의 부모 만큼 푸시를 준다.
 
  var curParent = groupMemberId;
  var pastParent = -1;
  var valid = true;
  var pushArray = [];

  async.whilst(function () {
    console.log(curParent+"=="+pastParent);
    if(curParent==pastParent)
      valid=false;

    return valid;
  },
  function (next) {
      tree.lindex("L/"+curParent,1,function(err,parentId){

        pastParent = curParent;
        curParent = parentId;

        if(curParent!=pastParent){
          console.log("curParent : "+curParent);
          pushArray.push(parseInt(curParent));
          
          tree.hget("H/"+curParent,'managingNumber',function(err,managingNumber){
              managingNumber = parseInt(managingNumber);
              if(managingNumber > -1 && managingNumber + number > -1){
                tree.hincrby("H/"+curParent, "managingNumber", number, function(err,obj){
                   if(err) console.log(err.message);
                });
              }
          });

          tree.hget("H/"+curParent,'managingTotalNumber',function(err,managingTotalNumber){
              managingTotalNumber = parseInt(managingTotalNumber);
              if(managingTotalNumber > -1 && managingTotalNumber + totalNumber > -1){
                tree.hincrby("H/"+curParent, "managingTotalNumber", totalNumber, function(err,obj){
                   if(err) console.log(err.message);
                });
              }
          });
        }
        next();
      });
  },
  function (err) {
    console.log(pushArray.length);
    return f(err,pushArray);
  });
}

PeopleTree.prototype.affectAllParentsAboutManagingNumber = function(groupMemberId, number, f) {

  //부모의 관리 인원 정보를 업데이트. 내가 관리 하고 있는 인원 + 1(나)
  //groupMemberId의 부모로 시작해서 (accumulWarning-1) 위의 부모 만큼 푸시를 준다.

  var curParent = groupMemberId;
  var pastParent = -1;
  var valid = true;
  var pushArray = [];

  async.whilst(function () {
    console.log(curParent+"=="+pastParent);
    if(curParent==pastParent)
      valid=false;

    return valid;
  },
  function (next) {
      tree.lindex("L/"+curParent,1,function(err,parentId){

        pastParent = curParent;
        curParent = parentId;

        if(curParent!=pastParent){
          pushArray.push(parseInt(curParent));

          console.log("curParent : "+curParent);

          tree.hget("H/"+curParent,'managingTotalNumber',function(err,managingTotalNumber){
            managingTotalNumber = parseInt(managingTotalNumber);

            tree.hget("H/"+curParent,'managingNumber',function(err,managingNumber){
                managingNumber = parseInt(managingNumber);
                if(managingNumber > -1 && managingTotalNumber >= managingNumber + number && managingNumber + number > -1){
                  tree.hincrby("H/"+curParent, "managingNumber", number, function(err,obj){
                     if(err) console.log(err.message);
                  });
                }
            });
          });
        }
        next();
      });
  },
  function (err) {
    console.log(pushArray.length);
    return f(err,pushArray);
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

PeopleTree.prototype.updateManageNumber = function(groupMemberId, number, f) {

  peopleTree.isExist(groupMemberId, function(err,exist){

    if(exist){
      tree.hincrby("H/"+groupMemberId, "managingNumber", number, function(err,obj){
         if(err) console.log(err.message);
      });
      return f(null);
    }
    else
      return f(err);
  });
}

PeopleTree.prototype.outGroup = function(groupMemberId, f) {
      var managingNumber = 0;
      async.waterfall([

        function (callback) {
          console.log('--- async.waterfall outGroup #1 ---');
          //내 정보가져오기
            tree.hgetall("H/"+groupMemberId, function(err,myData){
              if(!err){
                if(myData!=null){
                  callback(null,myData);
                }
                else
                  callback("not found that Data about groupMemberId",null);
              }
              else
                callback(error.message,null);
            });
        },

        function (myData, callback) {
          console.log('--- async.waterfall outGroup #2 ---');
          console.log("groupMemberId != myData.parentGroupMemberId / "+ groupMemberId +" != "+ myData.parentGroupMemberId);
          //부모가 있다면 원래 부모에서 나를 제거한다.
          if(groupMemberId != myData.parentGroupMemberId){
            tree.lrem("L/"+myData.parentGroupMemberId, -1, groupMemberId, function(err, deleteNumber){
              //PUSH
              peopleTree.push(groupMemberId, myData.parentGroupMemberId, "그룹을 나갔습니다.", 700, function(err,result){
                if(err) console.log(err.message);
              });

              if(!err)
                callback(null,myData);
              else
                callback(err.message,null);
            });
          }
          else//부모가 없다면 안한다.
            callback("iam not have parent",null);
        },

        function (myData, callback) {
          console.log('--- async.waterfall outGroup #3 ---');
          //부모가 바뀌기전 부모의 관리 인원 정보를 업데이트.
          //내가 관리하고 있는 전체 인원의 수+1을 뺀다 
          managingNumber = parseInt(myData.edgeStatus) == 200 ? -1*(parseInt(myData.managingNumber)+1) : -1*(parseInt(myData.managingNumber));
          peopleTree.affectAllParents(groupMemberId, -1*(parseInt(myData.managingTotalNumber)+1), managingNumber, function(err,result){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        },

        function (callback) {
          console.log('--- async.waterfall outGroup #4 ---');
          //나의 해시 테이블 수정
          //1. 나의 부모를 변경
          //2. 나의 그룹 아이디를 변경
          //3. 초기화 
          var items = {groupId:0, parentGroupMemberId:groupMemberId, edgeStatus:200, accumulateWarning : 0};
          tree.hmset("H/"+groupMemberId, items, function(err,obj){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        },

        function (callback) {
          console.log('--- async.waterfall outGroup #5 ---');
          //리스트에서 나의 부모를 나로 변경
          tree.lset("L/"+groupMemberId,1,groupMemberId,function(err,obj){
            if(!err)
              callback(null);
            else
              callback(err.message,null);
          });
        }
      ],

      function(err) {
        console.log('--- async.waterfall result insertNode #1 ---');
        if(!err)
          return f(null)
        else
          return f(err,null)
      });
}

PeopleTree.prototype.deleteNode = function(groupMemberId, f) {
  var managingNumber = 0;
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

              //PUSH
              peopleTree.push(groupMemberId, parentGroupMemberId, "로그아웃 했습니다.", 710, function(err,result){
                if(err) console.log(err.message);
              });

            tree.lrem("L/"+parentGroupMemberId, -1, groupMemberId , function(err,deleteNumber){
              console.log("delete myId from parent L : "+deleteNumber);

              if(!err){
                if(deleteNumber != 1)
                  callback({status:500, errorDesc : "my parent is not real parent"}, null);
                else
                  callback(null, parentGroupMemberId, deleteNumber);//내 부모가 있다면 deleteNumber is 1
              }
              else
                callback(err.message, null);
            });
          }
          else{
            callback(null, parentGroupMemberId, 0);//내 부모가 없다면 deleteNumber is 0
          }
      },
      //나의 자식들 나의 부모에게 위임하기
      //deleteNumber is 0, 루트다
      function (parentGroupMemberId, deleteNumber, callback) {
          console.log('--- async.waterfall delete Node #3 ---');
          if(deleteNumber){
            tree.lrange('L/'+groupMemberId, 2, -1, function (err, items) {
              if (!err){
                var length = items.length;
                console.log('item.length : '+length);
                var count = length-1;

                items.forEach(function (childGroupMemberId) {
                  tree.rpush("L/"+parentGroupMemberId, childGroupMemberId, function(err,obj){
                    console.log("count"+count);
                    if(!count--)
                      callback(null, parentGroupMemberId, deleteNumber);
                  });
                });
                if(!length) callback(null,parentGroupMemberId, deleteNumber);
              }
              else
                callback(err.message,null);
            });
          }
          else
            callback(null, parentGroupMemberId, deleteNumber);
      },
      function (parentGroupMemberId, deleteNumber, callback) {
          console.log('--- async.waterfall delete Node #4 ---');
          //내 자식의 부모를 나의 부모로 한다.
          if(deleteNumber){
            tree.lrange('L/'+groupMemberId, 2, -1, function (err, items) {
              if (!err){
                var length = items.length;
                console.log('item.length : '+length);
                var count = length-1;

                items.forEach(function (childGroupMemberId) {
                  tree.lset("L/"+childGroupMemberId, 1, parentGroupMemberId, function(err,obj){
                    tree.hset('H/'+childGroupMemberId, 'parentGroupMemberId', parentGroupMemberId, function(err, obj){
                      console.log("count"+count);
                      if(!count--)
                        callback(null,deleteNumber);
                    });
                  });
                });
                if(!length) callback(null,deleteNumber);
              }
              else
                callback(err.message,null);
            });
          }
          else{
            //내가 루트일때, 나의 자식들 부모를 자기 자신으로 변경한다.
            tree.lrange('L/'+groupMemberId, 2, -1, function (err, items) {
              if (!err){
                var length = items.length;
                console.log('item.length : '+length);
                var count = length-1;

                items.forEach(function (childGroupMemberId) {
                  tree.lset("L/"+childGroupMemberId, 1, childGroupMemberId, function(err,obj){
                    tree.hset('H/'+childGroupMemberId, 'parentGroupMemberId', childGroupMemberId, function(err, obj){
                      console.log("count"+count);
                      if(!count--)
                        callback(null,deleteNumber);
                    });
                  });
                });
                if(!length) callback(null,deleteNumber);
              }
              else
                callback(err.message,null);
            });
          }
      },

      function (deleteNumber, callback) {
        console.log('--- async.waterfall delete Node #5 ---');
        //부모가 바뀌기전 부모의 관리 인원 정보를 업데이트.
        if(deleteNumber){
          tree.hget("H/"+groupMemberId,'edgeStatus',function(err,edgeStatus){
            if(!err){
              managingNumber = parseInt(edgeStatus) == 200 ? -1 : 0;
              peopleTree.affectAllParents(groupMemberId, -1, managingNumber, function(err,result){
                if(!err)
                  callback(null, deleteNumber);
                else
                  callback(err.message,null);
              });
            }
            else
              callback({status:400, errorDesc: err.message}, null);
          });
        }
        else
          callback(null, deleteNumber);
      },

      //나의 해시테이블 지우기
      function (parentDeleteNumber, callback) {
          console.log('--- async.waterfall delete Node #6 ---');

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
        console.log('--- async.waterfall delete Node #7--');

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
        console.log('--- async.waterfall delete Node #8--');

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
      //console.log(arguments);
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
//200은 nothing 모드
//210은 트레킹 모드. 참조값 : 관리자의 위치, 반경
//220 지역모드 : 중심 위치, 반경
//230은 지오펜스모드
//G/{groupMemberId} : 0번 반경, 

PeopleTree.prototype.changeManageMode = function(groupMemberId, manageMode, f) {
  tree.hset('H/'+groupMemberId, 'manageMode', manageMode, function(err, updateNumber){
    if(!err){
        return f(null, true);
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.getManageMode = function(groupMemberId, f) {
  tree.hget('H/'+groupMemberId, 'manageMode', function(err, manageMode){
    if(!err){
        return f(null, parseInt(manageMode));
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.changeEdgeType = function(groupMemberId, edgeType, f) {
  tree.hset('H/'+groupMemberId, 'edgeType', edgeType, function(err, updateNumber){
    if(!err){
      return f(null, true);
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.getEdgeType = function(groupMemberId, f) {
  tree.hget('H/'+groupMemberId, 'edgeType', function(err, edgeType){
    if(!err){
      return f(null, parseInt(edgeType));
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.changeEdgeStatus = function(groupMemberId, edgeStatus, f) {
  tree.hset('H/'+groupMemberId, 'edgeStatus', edgeStatus, function(err, updateNumber){
    if(!err){
      return f(null, 0);
    }
    else
      return f(err.message, null);
  });
}

PeopleTree.prototype.accumulateWarningReset = function(groupMemberId, f) {

  tree.hget('H/'+groupMemberId, 'accumulateWarning', function(err, accumulateWarning){
    if(!err){
      if(accumulateWarning != 0){
        tree.hset('H/'+groupMemberId, 'accumulateWarning', 0, function(err, updateNumber){
          if(!err)
            return f(null, 1);
          else
            return f(err.message, null);
        });
      }
      else
        return f(null, 0);
    }
    else
      return f(err.message, null);
  });

}

PeopleTree.prototype.accumulateWarning = function(groupMemberId, resetFlag, f) {

  //resetFlag(validation)가 true 이면 accumulateWarning 0으로 리셋
  if(resetFlag){
    tree.hset('H/'+groupMemberId, 'accumulateWarning', 0, function(err, updateNumber){
      if(!err){
        return f(null, 0);
      }
      else
        return f(err.message, null);
    });
  }
  else{
    tree.hget('H/'+groupMemberId, 'accumulateWarning', function(err, accumulateWarning){
      if(!err){
        tree.hset('H/'+groupMemberId, 'accumulateWarning', parseInt(accumulateWarning)+1, function(err, updateNumber){
          if(!err){
              return f(null, parseInt(accumulateWarning)+1);// return 0
          }
          else
            return f(err.message, null);
        });
      }
      else
        return f(err.message, null);
    });
  }
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


PeopleTree.prototype.getGeoPoint = function(groupMemberId, f) {

  var geoValues =[];

  async.waterfall([

        function(callback){
           console.log('--- async.waterfall getGeoPoint Node #1 ---');
           tree.exists("G/"+groupMemberId, function(err, exist){
            if(!err){
              if(exist) callback(null);
              else callback({status:404, errorDesc : "not set GeoPoint"},null);
            }
            else callback(err.message, null);
           });
        },

        function(callback){
          console.log('--- async.waterfall getGeoPoint Node #2 ---');
          tree.lrange('G/'+groupMemberId, 0, -1, function (err, items) {
            if(!err){
              items.forEach(function (value) {
                  geoValues.push(parseFloat(value));
              });
              callback(null, geoValues);
            }
            else callback(err.message,null);              
          });
        }
    ],

    function(err, results) {
      console.log('--- async.waterfall result getGeoPoint Node #1 ---');
      //console.log(arguments);
      if(!err)
        return f(null,results)
      else{
        return f(err, null)
      }
    });
}


//위치 유효성 검사에 사용될 포인트를 세팅한다.
//points=[{lat:0,lng:0},{lat:0,lng:0},{lat:0,lng:0},{lat:0,lng:0}]
PeopleTree.prototype.setGeoPoint = function(groupMemberId, radius, points, f) {
// 0 기본
// "G/" 지우고 다시 만들자.
// 있다면->지운다. -> 다시 만들기
// "G/"의 길이는 1+2*points.length

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
    //console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }
  });
}

//해쉬에 현 위치를 업데이트한다.
PeopleTree.prototype.setLocation = function(groupMemberId, latitude, longitude, fpId, f) {

  peopleTree.isExist(groupMemberId, function(err,exist){

    var items = {
                  longitude:longitude,
                  latitude:latitude,
                  fpId : fpId,
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
      return f({status:404, errorDesc:"not exist"},null);
  });
}

PeopleTree.prototype.getLocation = function(groupMemberId, f){
  tree.hmget('H/'+groupMemberId, 'latitude', 'longitude', function(err,obj){
    if(!err){
      if(obj.length==2) return f(null, {latitude:parseFloat(obj[0]), longitude:parseFloat(obj[1])} );
      else return f("not pair location", null);
    }
    else return f(err.message, null);
  });
}


PeopleTree.prototype.getLocationForFp = function(groupMemberId, f){
  tree.hmget('H/'+groupMemberId, 'latitude', 'longitude', 'fpId', function(err,obj){
    if(!err){
      if(obj.length==3) return f(null, { latitude:parseFloat(obj[0]), longitude:parseFloat(obj[1]),  fpId:parseInt(obj[2]) } );
      else return f("not pair location", null);
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
        else return f(err, null);
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
        else return f(err, null);
      }
      else
        return f(err, null);
    });
  }
  else
    return f(null, {status:200, responseData : "manageMode is 200(nothing Mode)"});
}

//핑거 프린트용 함수
PeopleTree.prototype.checkInvalidLocation = function(groupMemberId, parentGroupMemberId, parentManageMode, f) {

  async.waterfall([
      //나의 edgeStatus를 가져온다
      function(callback){
        console.log('--- async.waterfall checkInvalidLocation Node #1 ---');
        tree.hget("H/"+groupMemberId,'edgeStatus',function(err,edgeStatus){
          console.log("edgeStatus : "+edgeStatus);//값 하나만 가져온다. 키 없이 값만
          if(!err)
            callback(null,parseInt(edgeStatus));
          else
            callback({status:400, errorDesc: err.message},null);
        });
      },

      function(edgeStatus, callback){
        console.log('--- async.waterfall checkInvalidLocation Node #2 ---');
        //300이 아닐시 300으로 변경한다.
        if(edgeStatus!=300){
          peopleTree.changeEdgeStatus(groupMemberId, 300, function(err, updateNumber){
            if(!err)
              callback(null, edgeStatus);
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else
          callback(null, edgeStatus);
      },

      function(edgeStatus, callback){
        console.log('--- async.waterfall checkInvalidLocation Node #3 ---');
        //부모의 관리 인원 중 나를 감소시킨다.

        if(edgeStatus==200){
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, -1, function(err,result){
            if(!err) callback(null);
            else callback({status:400, errorDesc: err}, null);
          });
        }
        else
          callback(null);     

      },

      function(callback){
        console.log('--- async.waterfall checkInvalidLocation Node #7 ---');
        peopleTree.accumulateWarning(groupMemberId, false, function(err,accumulateWarning){
          if(!err)
            callback(null, {parentManageMode: parentManageMode, radius: -1, distance: -1, edgeStatus: 300, validation : false, accumulateWarning : accumulateWarning, isToggle : false});
          else
            callback({status:400, errorDesc: err}, null);
        });
      },
  ],

  function(err, results) {
    console.log('--- async.waterfall result checkInvalidLocation Node #1 ---');
    //console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }

  });
}

PeopleTree.prototype.checkTrackingModeAndAreaMode = function(groupMemberId, parentGroupMemberId, manageMode, f) {
  console.log("checkTrackingMode");
  //부모의 현재 위치와 나의 위치 거리가 부모가 설정한 반경 안에 있어야한다.
  var isToggle=false;
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
            else callback({status:300, errorDesc:"your location is null"},null);
          }
          else callback({status:400, errorDesc: err},null);
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
              else callback({status:300, errorDesc:"parent location is null"},null);
            }
            else callback({status:400, errorDesc: err},null);
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
                else callback({status:300, errorDesc:"parent location is null"},null);
              }
              else callback({status:400, errorDesc: err.message},null);              

            });
         }
         else
          callback({status:400, errorDesc:"invaild mode"},null);
      },

      function(callback){
        //부모가 설정한 반경을 가져온다.
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #3 ---');
        tree.lindex("G/"+parentGroupMemberId,0,function(err,_radius){
          var radius = parseFloat(_radius);
          console.log("Parent radius : "+radius);
          if(!err)
            callback(null,radius);
          else
            callback({status:400, errorDesc: err.message},null);
        });
      },

      //나의 edgeStatus를 가져온다
      function(radius, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #4 ---');
        tree.hget("H/"+groupMemberId,'edgeStatus',function(err,edgeStatus){
          console.log("edgeStatus : "+edgeStatus);//값 하나만 가져온다. 키 없이 값만
          if(!err)
            callback(null,radius,parseInt(edgeStatus));
          else
            callback({status:400, errorDesc: err.message},null);
        });
      },

      function(radius, edgeStatus, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #5 ---');
        var distance = gps.getTotalDistance(points);
        console.log("distance : " + distance);

        if(radius < distance) validation = false;

        //validation==false이고 300이 아니라면, edgeStatus를 300으로 변경
        if(!validation&&edgeStatus!=300){
          peopleTree.changeEdgeStatus(groupMemberId, 300, function(err, updateNumber){
            if(!err)
              callback(null, radius, edgeStatus, distance);
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else if(validation&&edgeStatus!=200){
          peopleTree.changeEdgeStatus(groupMemberId, 200, function(err, updateNumber){
            if(!err)
              callback(null, radius, edgeStatus, distance);
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else
          callback(null, radius, edgeStatus, distance);
      },

      function(radius, edgeStatus, distance, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #6 ---');
        //console.log("!validation&&edgeStatus" + validation + "/" +edgeStatus);

        if(!validation&&edgeStatus!=300){
          console.log("ok->not ok");
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, -1, function(err,result){
            if(!err) callback(null, radius, distance);
            else callback({status:400, errorDesc: err}, null);
          });
        }
        else if(validation&&edgeStatus!=200){
          console.log("not ok->ok");
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, 1, function(err,result){
            if(!err) callback(null, radius, distance);
            else callback({status:400, errorDesc: err}, null);
          });
          //TODO
          //not not ok -> ok 유효 범위에 재 진입 알림 푸쉬
          isToggle = true;
        }
        else{
          console.log("not ok->not ok OR ok->ok");
          callback(null, radius, distance);
        }
      },

      function(radius, distance, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #7 ---');
        if(!validation){
          //벗어남 flag가 false 1추가
          peopleTree.accumulateWarning(groupMemberId, false, function(err,accumulateWarning){
            if(!err)
              callback(null, {parentManageMode: manageMode, radius: radius, distance: distance, edgeStatus: 300, validation : validation, accumulateWarning : accumulateWarning, isToggle : isToggle});
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else{
          //true면 accumulateWarning을 0으로 리셋
          peopleTree.accumulateWarning(groupMemberId, true, function(err,accumulateWarning){
            if(!err)
              callback(null, {parentManageMode: manageMode, radius: radius, distance: distance, edgeStatus: 200, validation : validation, accumulateWarning:accumulateWarning, isToggle : isToggle});
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
      },
  ],

  function(err, results) {
    console.log('--- async.waterfall result checkTrackingModeAndAreaMode Node #1 ---');
    //console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }

  });
}

PeopleTree.prototype.setNormal = function(groupMemberId, f) {
  var isToggle = false;
  async.waterfall([
      function(callback){
        console.log('--- async.waterfall setNormal Node #1 ---');
        tree.hget("H/"+groupMemberId,'edgeStatus',function(err,edgeStatus){
          console.log("edgeStatus : "+edgeStatus);//값 하나만 가져온다. 키 없이 값만
          if(!err)
            callback(null,parseInt(edgeStatus));
          else
            callback({status:400, errorDesc: err.message},null);
        });
      },

      function(edgeStatus, callback){
        console.log('--- async.waterfall setNormal Node #2 ---');
          peopleTree.changeEdgeStatus(groupMemberId, 200, function(err, updateNumber){
            if(!err)
              callback(null, edgeStatus);
            else
              callback({status:400, errorDesc: err}, null);
          });
      },

      function(edgeStatus, callback){
        console.log('--- async.waterfall setNormal Node #3 ---');
        if(edgeStatus==300){
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, 1, function(err,result){
            if(!err) callback(null);
            else callback({status:400, errorDesc: err}, null);
          });
          isToggle = true;
        }
        else
          callback(null);        
      },

      function(callback){
        console.log('--- async.waterfall setNormal Node #4 ---');

          peopleTree.accumulateWarning(groupMemberId, true, function(err,accumulateWarning){
            if(!err)
              callback(null, {parentManageMode : 210, radius : -1, distance : -1, edgeStatus : 200, validation : true, accumulateWarning : 0, isToggle : isToggle});
            else
              callback({status:400, errorDesc: err}, null);
          });
        
      },
  ],

  function(err, results) {
    console.log('--- async.waterfall result setNormal Node #1 ---');
    //console.log(arguments);
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

  var isToggle=false;
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
            else callback({status:400, errorDesc:"your location is null"},null);
          }
          else callback({status:400, errorDesc: err},null);
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

              if(length < 8) callback({status:300,errorDesc:"not enough point, more than triangle"},null);

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
              callback({status:400, errorDesc: err.message},null);
          });
      },

      //나의 edgeStatus를 가져온다
      function(validation, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #4 ---');
        tree.hget("H/"+groupMemberId,'edgeStatus',function(err,edgeStatus){
          console.log("edgeStatus : "+edgeStatus);//값 하나만 가져온다. 키 없이 값만
          if(!err)
            callback(null, validation, parseInt(edgeStatus));
          else
            callback({status:400, errorDesc: err.message}, null);
        });
      },

      function(validation, edgeStatus, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #4 ---');
        //validation==false 면 edgeStatus를 300으로 변경
        if(!validation&&edgeStatus!=300){
          peopleTree.changeEdgeStatus(groupMemberId, 300, function(err, updateNumber){
            if(!err)
              callback(null, validation, edgeStatus);
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else if(validation&&edgeStatus!=200){
          peopleTree.changeEdgeStatus(groupMemberId, 200, function(err, updateNumber){
            if(!err)
              callback(null, validation, edgeStatus);
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else
          callback(null, validation, edgeStatus);
      },

      function(validation, edgeStatus, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #5 ---');
        if(!validation&&edgeStatus!=300){
          console.log("ok->not ok");
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, -1, function(err,result){
            if(!err) callback(null, validation);
            else callback({status:400, errorDesc: err}, null);
          });
        }
        else if(validation&&edgeStatus!=200){
          console.log("not ok->ok");
          peopleTree.affectAllParentsAboutManagingNumber(groupMemberId, 1, function(err,result){
            if(!err) callback(null, validation);
            else callback({status:400, errorDesc: err}, null);
          });
          //TODO
          isToggle = true;
        }
        else
          callback(null, validation);
      },

      function(validation, callback){
        console.log('--- async.waterfall checkTrackingModeAndAreaMode Node #6 ---');
        if(!validation){
          //벗어남 flag가 false 1추가
          peopleTree.accumulateWarning(groupMemberId, false, function(err,accumulateWarning){
            if(!err){
              //누적치 만큼 푸시 위로 올리기
              callback(null, {parentManageMode: 230, edgeStatus: 300, validation : validation, accumulateWarning : accumulateWarning, isToggle : isToggle});
            }
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
        else{
          //true면 0으로 리셋
          peopleTree.accumulateWarning(groupMemberId, true, function(err,accumulateWarning){
            if(!err)
              callback(null, {parentManageMode: 230, edgeStatus: 200, validation : validation, accumulateWarning : accumulateWarning, isToggle : isToggle});
            else
              callback({status:400, errorDesc: err}, null);
          });
        }
      }
  ],

  function(err, results) {
    console.log('--- async.waterfall result checkGeofencingMode Node #1 ---');
    //console.log(arguments);
    if(!err)
      return f(null,results)
    else{
      return f(err, null)
    }
  });
}

//parse push
PeopleTree.prototype.push = function(from, to, message, statusCode, f) {
  // data에 "alert": alert 를 넣으면 parse도 noti를 띄운다.
  peopleTree.isExist(to, function(err,exist){
    if(exist){
      tree.hget("H/"+from,'userName',function(err,userName){
        console.log("from userName : "+userName);//값 하나만 가져온다. 키 없이 값만
        if(!err){
          if(userName){


            var notification = {
                                  where : {
                                            "deviceType": "android",
                                            "groupMemberId": parseInt(to)
                                          },

                                  data : {
                                          "userName": userName,//보낸이 이름을 제목으로
                                          "from" : parseInt(from),
                                          "to" : parseInt(to),
                                          "message": message,
                                          "statusCode":parseInt(statusCode),
                                          "action":"com.ssm.peopleTree.message"
                                         }
                                };

            parse.sendPush(notification, function(err, resp){
              console.log("to : "+ to+" / "+JSON.stringify(resp));
              if(!err) console.log(resp.result);
              else{
                parse.sendPush(notification, function(err, resp){
                  if(!err) console.log(resp.result);
                  else console.log(err.message);
                });
              }
            });

            return f(null,"push sent");
          }
          else f("from user not login",null);
        }
        else
          return f(err.message,null);
      });
    }
    else
      f("to user not login",null);
  });
}

PeopleTree.prototype.broadcastUp = function(groupMemberId, accumulateWarning, message, statusCode, f) {
//나 포함하여, groupMemberId의 부모로 시작해서 (accumulWarning) 위의 부모 만큼 푸시를 준다.

  var curParent = groupMemberId;
  var pastParent = -1;
  var valid = true;
  var count = 0;
  var pushArray = [];
  var upNumber = parseInt(accumulateWarning)+1;

  async.whilst(function () {
    console.log(curParent+"=="+pastParent);
    if(curParent==pastParent)
      valid=false;

    return count < upNumber && valid;
  },
  function (next) {
      tree.lindex("L/"+curParent,1,function(err,parentId){

        peopleTree.push(groupMemberId, curParent, message, statusCode, function(err,result){
          if(err) console.log(err.message);
        });
        
        pushArray.push(parseInt(curParent));

        pastParent = curParent;
        curParent = parentId;
        console.log("curParent : "+curParent);

        count++;

        next();
      });
  },
  function (err) {
    console.log("push-list");
    console.log(pushArray);
    return f(err,pushArray);
  });
}

PeopleTree.prototype.broadcastDown = function(groupMemberId, depth, message, f) {
//공지메세지 보내기
//groupMemberId의 부모로 시작해서 depth 아래의 자식 모두에게 푸시를 준다.
//자식 들을 일단 모으고 

  peopleTree.gatherChildren(groupMemberId, depth, function(err,children){
      if(!err){
        children.forEach(function (childGroupMemberId) {
          peopleTree.push(groupMemberId, childGroupMemberId, message, 100, function(err,result){
            if(err) console.log(err.message);
          });
        });
        return f(null,children);
      }
      else return f(err);
  });
}

PeopleTree.prototype.gatherChildren = function(groupMemberId, depth, f) {

  var startIndex=-1;
  var endIndex=0;
  var gatherArr=[];

  var _groupMemberId = groupMemberId;

  async.whilst(function () {
    return (startIndex <= endIndex) && depth;
  },
  function (next) {

    peopleTree.getChildren(_groupMemberId,function(err, childrenArray, length){
      depth--;
      console.log("childrenArray"+ JSON.stringify(childrenArray));
      endIndex += (length);
      _.each(childrenArray, function (item) {
          gatherArr.push(item);
      });

      if(gatherArr[startIndex+1] != null)
        _groupMemberId = gatherArr[++startIndex];
      else
        ++startIndex;

      next();
    });
  },
  function (err) {
    return f(null,gatherArr);
  });
}

PeopleTree.prototype.getChildren = function(groupMemberId, f) {

    var childrenArray = [];
    var length = 0;

    tree.lrange('L/'+groupMemberId, 2, -1, function (err, children) {

      if(!err){ 
        length = children.length;
        console.log('children.length : '+length);
        children.forEach(function (child) {
          childrenArray.push(parseInt(child));
        });
        return f(null,childrenArray,length);
      }
      else return f(err.message,null,null);
    });
}


PeopleTree.prototype.showTreeV2 = function(groupMemberId, f) {

  var startIndex=-1;
  var endIndex=0;
  var gatherArr=[];

  var _groupMemberId = groupMemberId;


  async.whilst(function () {
    return (startIndex <= endIndex);
  },
  function (next) {

    peopleTree.showTreeV2_sub(_groupMemberId,function(err, childrenArray, length){
      console.log("childrenArray"+ JSON.stringify(childrenArray));

      endIndex += length;

      _.each(childrenArray, function (item) {
          gatherArr.push(item);
      });

      if(gatherArr[startIndex+1] != null)
        _groupMemberId = gatherArr[++startIndex].key;
      else
        ++startIndex;

      next();

    });
  },
  function (err) {

      peopleTree.getItems(groupMemberId, function(err, obj){
        gatherArr.push(   
                              { 
                                key :parseInt(obj.groupMemberId),
                                parent : parseInt(groupMemberId),
                                manageMode : obj.manageMode,
                                accumulateWarning : obj.accumulateWarning,
                                edgeType: obj.edgeType,
                                name: obj.userName,
                                managingNumber : parseInt(obj.managingNumber),
                                managingTotalNumber : parseInt(obj.managingTotalNumber),
                                userNumber : parseInt(obj.userNumber)
                              }   
                          );

        return f(null,gatherArr);

      });

  });
}

PeopleTree.prototype.showTreeV2_sub = function(groupMemberId, f) {

    var childrenArray = [];
    var length = 0;

    tree.lrange('L/'+groupMemberId, 2, -1, function (err, children) {

      if(!err){ 
        length = children.length;
        console.log('children.length : '+length);

        var count = 0;

        async.whilst(function () {
          return length > count;
        },
        function (next) {
          peopleTree.getItems(children[count], function(err, obj){
            childrenArray.push(   
                                  { 
                                    key :parseInt(obj.groupMemberId),
                                    parent : parseInt(groupMemberId),
                                    manageMode : parseInt(obj.manageMode),
                                    accumulateWarning : parseInt(obj.accumulateWarning),
                                    name: obj.userName,
                                    edgeType: obj.edgeType,
                                    managingNumber : parseInt(obj.managingNumber),
                                    managingTotalNumber : parseInt(obj.managingTotalNumber),
                                    userNumber : parseInt(obj.userNumber)
                                  }   
                              );
            count++;
            next();
          });
        },
        function (err) {
           return f(null,childrenArray,length);
        });
      }
      else return f(err.message,null,null);
    });
}

//비공개 함수, 전역 변수를 사용하기에 동시 사용시 문제가 생긴다.
PeopleTree.prototype.showTree = function(rootGroupMemberId, position, index, f) {

    async.waterfall([

      function(callback) {
        console.log('--- async.waterfall #1 ---');
        console.log(JSON.stringify(treeJson));

        console.log("callNumber : "+ callNumber);

        position = position[index].children;
        callback(null, position, rootGroupMemberId, f);
      },

      function(position, popGroupMemberId, f, callback) {
        console.log('--- async.waterfall #2 ---');
        tree.lrange('L/'+popGroupMemberId, 2, -1, function (err, items) {

          if (err) console.log("err : "+err.message);

          var count = 0;
          console.log('item.length : '+items.length);
          items.forEach(function (childGroupMemberId) {

            console.log("items.length : "+items.length);
            console.log("childGroupMemberId "+count+" : "+childGroupMemberId);
           
            position.push({id : parseInt(childGroupMemberId), children:[]});

            callNumber++;

            peopleTree.showTree(childGroupMemberId, position, count, f);

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
      if(callNumber==0) return f(treeJson);
    });
}


module.exports = PeopleTree;