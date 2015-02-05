#################
#INFO
#################

groupMemberId는 userNumber
사용자 가입시 아디이는 userId 이다.

manageMode는 100은 관리대상 ,200은 관리자 210은 트레킹 모드, 220 지역모드 230은 지오펜스모드

state
200 //정상
300 //그냥 범용 에러
404 // Not found
303 // already exist
500 // 내부 디비 에러


사용자가 첫 로그인 및 가입을 하게되면 유저는 일인 일 그룹원의 그룹장이 되며 시작된다.
즉 그룹테이블에도 하나의 그룹이 새로 추가되며, 그룹멤버 테이블에도 하나의 그룹원으로 추가가 된다.
고려사항 그룹 합병시에 고려해야한다

디비에 있는 부모 아이디는 나의 최근 부모가 누구였는지 알려주는 역활을 할뿐이다.
이 값을 가지고 다시 트리를 구성하지 않는다.

#가입자 정보 가져오기는 userNumber 로 가져온다.
http://210.118.74.107:3000/ptree/getinfo/group/member?userNumber=26

#getinfo 응답 값 
{
	"status":200,
	"responseData":
					{ 
							"userId":"glory1",
							"userNumber":1,
							"groupMemberId":11,
							"parentGroupMemberId":1,
							"userName":"영광","groupId":1,
							"userPhoneNumber":1028790924,
							"edgeStatus":200,
							"longitude":"null",
							"latitude":"null"
					}
}

#################
#TEST
#################

#################
#redis tree test
#################

(수정 사항 모든 메소드에서 그룹 아이디를 받는 것을 제거, 그룹멤버 아이디가 유니크하기에 가능.)

#해당 유저를 루트로한 트리를 보여준다.
http://210.118.74.107:3000/ptree/test/showTree?rootGroupId=27

#유저번호로 디비에서 정보를 가져와 노드로 삽입한다.
http://210.118.74.107:3000/ptree/test/insertNode?userNumber=blah

#그룹멤버 아이디로 redis의 해시 테이블에 저장된 정보를 가져온다.
http://210.118.74.107:3000/ptree/test/getItems?groupMemberId=12

#위치정보를 업데이트한다.
http://210.118.74.107:3000/ptree/test/setLocation?groupMemberId=26&latitude=126.946035&longitude=37.554339

#위치정보를 가져온다.
http://210.118.74.107:3000/ptree/test/getLocation?groupMemberId=27

#노드를 삭제한다.
http://210.118.74.107:3000/ptree/test/deleteNode?groupMemberId=27

#루트노드 인지 확인한다.
http://210.118.74.107:3000/ptree/test/isRoot?groupMemberId=27

#부모를 바꾼다.
http://210.118.74.107:3000/ptree/test/changeParent?myGroupMemberId=1&parentGroupMemberId=1

#부모가 정한 지역에 내가 있는지 확인한다. 210 - 트레킹 모드, 220 - 지역모드, 230, 지오펜싱 모드
http://210.118.74.107:3000/ptree/test/checkLocation?groupMemberId=26&parentGroupMemberId=27&manageMode=220

#븉으려고 하는 노드의 부모중에 내가 있으면 안된다. 이걸 체크
http://210.118.74.107:3000/ptree/test/isValidChange?myGroupMemberId=27&parentGroupMemberId=26

#지오펜싱 모드 체크
http://210.118.74.107:3000/ptree/test/checkGeofencingMode?groupMemberId=26&parentGroupMemberId=27

#관리자의 관리 지역설정 하기 
#points의 길이가 1이면 220 - 지역 모드에서 쓰인다. n이면 지오펜싱 모드
http://210.118.74.107:3000/ptree/test/setGeoPoint?groupMemberId=26&radius=10&points=[{lat:0,lng:0},{lat:0,lng:0},...]

#################
#URI test
#################

#가입자 정보 가져오기
http://210.118.74.107:3000/ptree/getinfo/group/member?userNumber=26 //DataBase를 참조하며, 경도,위도, 관리인원은 redis를 참조한다.

#회원가입 URL - idinfo, grouplist, groupmember에 레코드가 삽입되며, 서버 메모리에 노드로서 생성된다.
http://210.118.74.107:3000/ptree/make/group?userPhoneNumber=01011112222&userId=jakimg&password=123&userName=abc&groupName=first111

#로그인 하기
http://210.118.74.107:3000/ptree/login?userId=jakimg123&password=123

################
#FLOW
################

1. make/group을 통해서 회원가입을 한다.

http://210.118.74.107:3000/ptree/make/group?userPhoneNumber=01011113333&userId=jakimg1&password=123&userName=grout&groupName=first222

## "H/그룹아이디"로 해쉬태이블 생성 회원 정보 관리

{
	"userId":"glory1",
	"userNumber":1,
	"groupMemberId":11,
	"parentGroupMemberId":1,
	"userName":"영광","groupId":1,
	"userPhoneNumber":1028791924,
	"edgeStatus":200,
	"longitude":"null",
	"latitude":"null"
        "managingTotalNumber":0,
        "managingNumber":0
}

## "L/그룹멤버아이디" 로 리스트 생성 트리 구조관리
0번은 자기 자신의 그룹아이디
1번은 직계 부모의 그룹아아디
2번 이후에는 자식들의 그룹아이디

## "G/그룹멤버아이디" 로 리스트를 생성 지역 설정 값을 관리한다.
슈퍼키는 그룹멤버아이디
210 : 트레킹 모드라면 길이는 1 , 0번 만 쓴다.
220 : 지역 모드라면 길이는 3, 한포인트만 쓴다.
230 : 지오펜싱 모드는 다각형의 꼭지점 n, 1+2n 수만큼 쓴다.
0번은 반경
1번은 위도1
2번은 경도1
3번은 위도2
4번은 경도2
...

[groupMemberId, parentGroupMemberId, childGroupMemberId, ...]

totalLen - 2 == 전체 자식들의 수


2. 로그인이 되면서 메모리에 노드가 생성된다.
210.118.74.107:3000/ptree/login?userId=jakimg1&password=123

3. 부모 변경
http://210.118.74.107:3000/ptree/test/changeParent?myGroupId=1&myGroupMemberId=1&parentGroupId=1&parentGroupMemberId=1

4. 해당 회원을 루트로한 트리가 제이슨 트리 형식으로 반환된다.
http://210.118.74.107:3000/ptree/test/showTree?rootGroupId=27
(여기서 보면 됨 : http://www.jsontree.com/)