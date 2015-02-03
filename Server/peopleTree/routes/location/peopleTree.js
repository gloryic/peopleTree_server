var _     = require('lodash');
var async = require('async');
var request = require('request');
var url = require('url');

function PeopleTree(redisClient){}

//로그인시 첫 수행
PeopleTree.prototype.insertNode = function(userNumber, f) {

      var items={};
      async.waterfall([
        function (callback) {
          console.log('--- async.waterfall insertNode #1 ---');
          request( {
            method: 'GET',
            url: 'http://210.118.74.107:3000/ptree/getinfo/group/member?userNumber='+userNumber,
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
          console.log('--- async.waterfall insertNode #3 ---');
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
          console.log('--- async.waterfall insertNode #4 ---');
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
          console.log('--- async.waterfall insertNode #2 ---');
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

/*
PeopleTree.prototype.makeGroup = function(groupId, f) {
  tree.hgetall("H/"+groupId, function(err,obj){

    console.log("makeGroup : " + JSON.stringify(obj));
    if(!err){
      if(obj!=null){
        //그릅 새로 만들기
          request( {
            method: 'GET',
            url: 'http://210.118.74.107:3000/ptree/getinfo/group/member?userNumber='+userNumber,
          }, function(err, response) {

            if(!err){
              var items = JSON.parse(response.body).responseData;
              tree.hmset("H/"+items.groupId, items);
              return f(items);
            }
            else
              return f(err);
          });
      }
    }
    else
      return f(err,null);
    });
};
*/

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
        console.log("hgetall : " + JSON.stringify(obj));
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

PeopleTree.prototype.changeParent = function(groupMemberId, parentGroupMemberId, f) {

  tree.hgetall("H/"+groupMemberId, function(err,obj){
    console.log("myData : " + JSON.stringify(obj));
    if(!err){
      if(obj!=null){
            tree.hgetall("H/"+parentGroupMemberId, function(err,parentObj){
              console.log("parentData : " + JSON.stringify(parentObj));
              if(!err){
                if(parentObj!=null){

                    if(obj.parentGroupMemberId == parentObj.groupMemberId) return f(null, {state:303, errorDesc:"already setting that parentId "},null);//이미 변경 하려는 부모가 내 부모

                    //원래 부모에서 나를 제거한다.
                    if(groupMemberId != obj.parentGroupMemberId)
                      tree.lrem("L/"+obj.parentGroupMemberId, -1, groupMemberId);

                    //1. 나의 부모를 변경, 2. 나의 그룹 아이디를 변경
                    var items = {groupId:parentObj.groupId, parentGroupMemberId:parentGroupMemberId};
                    console.log("myChangeParent : "+JSON.stringify(items));
                    tree.hmset("H/"+groupMemberId, items);

                    //부모의 관리 인원 정보를 업데이트. 내가 관리 하고 있는 인원 + 1(나)
                    var parentitems = {
                                        managingTotalNumber: parseInt(parentObj.managingTotalNumber,10)+parseInt(obj.managingTotalNumber,10)+1, 
                                        managingNumber:parseInt(parentObj.managingTotalNumber,10)+parseInt(obj.managingTotalNumber,10)+1
                                      };

                    console.log("parentChangeParent : "+JSON.stringify(parentitems));
                    tree.hmset("H/"+parentGroupMemberId, parentitems);

                    //나의 부모를 변경
                    tree.lset("L/"+groupMemberId,1,parentGroupMemberId);
                    
                    //부모의 자식에게 나를 추가한다.
                    tree.rpush("L/"+parentGroupMemberId,groupMemberId);

                    return f(null, {state:200, responseData : "success change parent"});//부모 바꾸기 성공
                }
                else
                  return f({state:404, errorDesc:"not found that Data about ParentGroupMemberId"},null);
              }
              else
                return f({state:300, errorDesc:error},null);
            });
      }
      else
        return f({state:404, errorDesc:"not found that Data about groupMemberId"},null);
    }
    else
      return f({state:300, errorDesc:error},null);
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

PeopleTree.prototype.updateLocation = function(groupMemberId, latitude, longitude, f) {

  peopleTree.isExist(groupMemberId, function(err,exist){

    var items = {
                  latitude:latitude,
                  longitude:longitude
                };

    console.log("updateLocation : "+JSON.stringify(items));
    console.log("exist : "+exist);

    if(exist){
      tree.hmset("H/"+groupMemberId, items);
      return f(null);
    }
    else
      return f(err);
  });
}

PeopleTree.prototype.deleteNode = function(groupMemberId, f) {

    //TODO
    //자식이 있을 경우 나의 부모에게 붙혀준다.
    //나의 부모에서 나를 제거

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

          if(groupMemberId == parentGroupMemberId){
          tree.lrem("L/"+parentGroupMemberId, -1, groupMemberId , function(err,deleteNumber){
            console.log("delete myId from parent L : "+deleteNumber);

            if(!err){
              if(deleteNumber != 1)
                callback({status:500, errorDesc : "my parent is not real parent"}, null);
              else
                callback(null, deleteNumber);
            }
            else
              callback(err.message, null);
          });
        }
        else{
          callback(null, 0);
        }
      },
      //나의 해시테이블 지우기
      function (parentDeleteNumber, callback) {
          console.log('--- async.waterfall delete Node #1 ---');

          tree.del("H/"+groupMemberId, function(err,deleteNumber){

          console.log("H deleteNode : "+deleteNumber);

          if(!err)
            callback(null, deleteNumber+parentDeleteNumber);
          else
            callback(err.message, null);
          });
      },
      //나의 리스트 지우기
      function (hashDeleteNumber, callback) {
        console.log('--- async.waterfall delete Node #3--');

          tree.del("L/"+groupMemberId, function(err,deleteNumber){

          console.log("L deleteNode : "+deleteNumber);

          if(!err)
            callback(null, deleteNumber+hashDeleteNumber);
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
//manageMode는 100은 관리대상 ,200은 관리자 210은 트레킹 모드, 220 지역모드 230은 지오펜스모드
//230이면 managedlocationpoint 테이블을 참조한다.
PeopleTree.prototype.checkLocation = function(groupMemberId, parentGroupMemberId, manageMode, f) {

  //if(manageMode==)

}

PeopleTree.prototype.checkLocation = function(groupMemberId, parentGroupMemberId, manageMode, f) {

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


PeopleTree.prototype.changeManageMode = function(f) {

}

PeopleTree.prototype.saveInDataBase = function(f) {

}

module.exports = PeopleTree;