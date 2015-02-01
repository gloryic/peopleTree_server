var _     = require('lodash');
var async = require('async');
var request = require('request');
var url = require('url');

function PeopleTree(redisClient){}

//로그인시 첫 수행
PeopleTree.prototype.insertNode = function(userId, f) {
  request( {
    method: 'GET',
    url: 'http://210.118.74.107:3000/ptree/getinfo/group/member?userId='+userId,
  }, function(err, response) {

    if(!err){
      var items = JSON.parse(response.body).responseData;
      //관리 인원의 초기화
      items.managingNumber = 0;
      items.managingTotalNumber = 0;

      console.log("insertNode_start_groupMemberId : "+items.groupMemberId);
      
      async.waterfall([

        function (callback) {
          console.log('--- async.waterfall #1 ---');
          //해시 테이블에는 노드에 대한 정보를 가지고 있다. //nested 구조가 되지 않아 
          tree.hmset("H/"+items.groupMemberId, items, function (err,obj){

            if (err) {
              console.log("err : "+err);
              return;
            }
            else{
              callback(null, items.groupMemberId);
            }
          });
        },

        function (groupMemberId, callback) {
          console.log('--- async.waterfall #2 ---');
          //해시 테이블에는 노드에 대한 정보를 가지고 있다. //nested 구조가 되지 않아 
          tree.llen("L/"+groupMemberId, function (error, length) {
            console.log("length / "+length);
            if (err) {
              console.log("err : "+err);
              return;
            }
            else{
              if(length == 0){
                callback(null, groupMemberId);
              }
              else
                callback(null, -1);
            }
          });
        },

        function (groupMemberId, callback) {
          console.log('--- async.waterfall #3 ---');
          if(groupMemberId!=-1){
            //해시 테이블에는 노드에 대한 정보를 가지고 있다. //nested 구조가 되지 않아 
            tree.rpush("L/"+items.groupMemberId, items.groupMemberId);
            tree.rpush("L/"+items.groupMemberId, items.groupMemberId);
            callback(null, 'make list');
          }
          else{
            callback(null, 'already exist list');
          }
        }
      ],

      function(err, results) {
        console.log('--- async.waterfall result #1 ---');
        console.log(arguments);
      });

      return f(items);
    }
    else
      return f(err);
  });
};

PeopleTree.prototype.makeGroup = function(groupId, f) {
  tree.hgetall("H/"+groupId, function(err,obj){

    console.log("makeGroup : " + JSON.stringify(obj));
    if(!err){
      if(obj!=null){
        //그릅 새로 만들기
          request( {
            method: 'GET',
            url: 'http://210.118.74.107:3000/ptree/getinfo/group/member?userId='+userId,
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

PeopleTree.prototype.getItems = function(groupId, groupMemberId, f) {
    tree.hgetall("H/"+groupMemberId, function(err,obj){
        console.log("hgetall : " + JSON.stringify(obj));
        if(!err)
          return f(null,obj);
        else
          return f(err,null);
    });
}

PeopleTree.prototype.isExist = function(groupId, groupMemberId, f) {
    tree.hgetall("H/"+groupMemberId, function(err,obj){
        console.log("hgetall : " + JSON.stringify(obj));
        if(!err){
          if(obj!=null)
            return f(null,true);
          else
            return f(null,false);
        }
        else
          return f(err,null);
    });
}

PeopleTree.prototype.changeParent = function(groupId, groupMemberId, parentGroupId, parentGroupMemberId, f) {

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
                    var items = {groupId:parentGroupId, parentGroupMemberId:parentGroupMemberId};
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

                    return f(null, {state:200});//부모 바꾸기 성공
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

//Deprecate
PeopleTree.prototype.setManageNumber = function(groupId, groupMemberId, managingTotalNumber,managingNumber, f) {

  peopleTree.isExist(groupId, groupMemberId, function(err,exist){

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

PeopleTree.prototype.updateLocation = function(groupId, groupMemberId, latitude, longitude, f) {

  peopleTree.isExist(groupId, groupMemberId, function(err,exist){

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

PeopleTree.prototype.deleteNode = function(groupId, groupMemberId, f) {
  tree.send_command("hdel", [ groupMemberId, 'userId', 'userNumber', 'groupMemberId', 
                                        'parentGroupMemberId', 'userName', 'groupId', 'userPhoneNumber',
                                        'edgeStatus', 'longitude', 'latitude','managingTotalNumber','managingNumber'], function(err,obj){

    console.log("deleteNode : "+JSON.stringify(obj));

    //TODO
    //자식이 있을 경우 나의 부모에게 붙혀준다. 

    if(!err)
      return f(null,obj); 
    else
      return f(err,null);
  });
}

PeopleTree.prototype.isRoot = function(groupId, groupMemberId, f) {

  tree.hget("H/"+groupMemberId,'parentGroupMemberId',function(err,obj){
    console.log("parentGroupMemberId : "+obj);//값 하나만 가져온다. 키 없이 값만

    if(!err){
      if(groupId == obj) return f(null,true);
      else return f(null,false);
    }
    else
      return f(err,null);
  });
}

PeopleTree.prototype.checkLocation = function(f) {

}

PeopleTree.prototype.showTree = function(rootGroupId, position, index, f) {

    async.waterfall([

      function(callback) {
        console.log('--- async.waterfall #1 ---');
        console.log(JSON.stringify(treeJson));

        console.log("callNumber : "+ callNumber);

        position = position[index].children;
        callback(null, position, rootGroupId, f);
      },

      function(position, popGroupId, f, callback) {

        console.log('--- async.waterfall #2 ---');

        tree.lrange('L/'+popGroupId, 2, -1, function (error, items) {

          if (error) console.log("error : "+error);

          var count = 0;
          console.log('item.length : '+items.length);
          items.forEach(function (childGroupid) {

            console.log("items.length : "+items.length);
            console.log("childGroupid "+count+" : "+childGroupid);
           
            position.push({id : childGroupid, children:[]});

            callNumber++;
            console.log("////"+callNumber);

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

      if(callNumber==0) return f();
    });
}


PeopleTree.prototype.changeManageMode = function(f) {

}

PeopleTree.prototype.saveInDataBase = function(f) {

}

module.exports = PeopleTree;