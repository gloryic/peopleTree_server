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
      
      items.managingTotalNumber = 0;
      items.managingNumber = 0;
      tree.hmset(items.groupId+"/"+items.groupMemberId, items);



      return f(items);
    }
    else
      return f(err);
  });
};

PeopleTree.prototype.makeGroup = function(groupId, f) {
  tree.hgetall(groupId, function(err,obj){

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
              tree.hmset(items.groupId, items);
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

}

PeopleTree.prototype.getItems = function(groupId, groupMemeberId, f) {
    tree.hgetall(groupId+"/"+groupMemeberId, function(err,obj){
        console.log("hgetall : " + JSON.stringify(obj));
        if(!err)
          return f(null,obj);
        else
          return f(err,null);
    });
};

PeopleTree.prototype.isExist = function(groupId, groupMemeberId, f) {
    tree.hgetall(groupId+"/"+groupMemeberId, function(err,obj){
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
};

PeopleTree.prototype.changeParent = function(groupId, groupMemberId, parentId, f) {

  var exist = peopleTree.isExist(groupId,groupMemberId);
  var parentExist = peopleTree.isExist(groupId,parentId);

  var items = {parentGroupMemberId:parentId};
  console.log("changeParent : "+items);

  if(exist && parentExist){
    tree.hmset(groupId+"/"+groupMemberId, items);
    return f(null);//부모 바꾸기 성공
  }
  else
    return f(400);
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
      tree.hmset(groupId+"/"+groupMemberId, items);
      return f(null);
    }
    else
      return f(err);
  });
}

PeopleTree.prototype.deleteNode = function(groupId, groupMemberId, f) {
  tree.send_command("hdel", [ groupId+"/"+groupMemberId, 'userId', 'userNumber', 'groupMemberId', 
                                        'parentGroupMemberId', 'userName',
                                        'groupId', 'userPhoneNumber',
                                        'edgeStatus', 'longitude', 'latitude','managingTotalNumber','managingNumber'], function(err,obj){

    console.log("deleteNode : "+JSON.stringify(obj));

    if(!err)
      return f(null,obj); 
    else
      return f(err,null);
  });
}

PeopleTree.prototype.isRoot = function(groupId, groupMemberId, f) {

  tree.hget(groupId+"/"+groupMemberId,'parentGroupMemberId',function(err,obj){
    console.log("parentGroupMemberId : "+obj);//값 하나만 가져온다. 키없이 값만

    if(!err){
      if(groupId == obj) return f(null,true);
      else return f(null,false);
    }
    else
      return f(err,null);
  });
}

PeopleTree.prototype.setManageNumber = function(groupId, groupMemberId, managingTotalNumber,managingNumber, f) {

  peopleTree.isExist(groupId, groupMemberId, function(err,exist){

    var items = {
                  managingTotalNumber:managingTotalNumber,
                  managingNumber:managingNumber
                };

    console.log("setManageNumber : "+JSON.stringify(items));

    if(exist){
      tree.hmset(groupId+"/"+groupMemberId, items);
      return f(null);
    }
    else
      return f(err);
  });

}

PeopleTree.prototype.groupSize = function(groupId,f) {

}

PeopleTree.prototype.checkLocation = function(f) {

}

PeopleTree.prototype.changeManageMode = function(f) {

}

PeopleTree.prototype.saveInDataBase = function(f) {

}




module.exports = PeopleTree;