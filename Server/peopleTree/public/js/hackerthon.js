var DNA={};
DNA.OAuth2 = {
	init: function() {
		num=1;
		users={};

		this.addEvent();

		//DNA.socket = io.connect('http://210.118.74.108');
		DNA.socket = io.connect('http://192.168.0.254');
		//DNA.socket = io.connect('http://192.168.0.95');
		DNA.socket.emit('main',{msg:"connect"});

		DNA.socket.on('userlist',function(data){

			users = data.users;
            console.log(users);
            console.log(data.users.length);
            $("#score").empty();
            
            for(var i=0;i<data.users.length;i++){
                //$('#to').append('<option value="'+users[i]+'">'+users[i]+"</option>");
                DNA.OAuth2.setUser(users[i],i);
            }
		});


		DNA.socket.on('setBall',function(data){

			console.log(data);
			DNA.OAuth2.setBall(data.nickname);
		});


		DNA.socket.on('send_msg',function(data){

			console.log(data);
			var personBall = $('#'+data.nickname);

			//DNA.OAuth2.moveObject(personBall,data.x,data.y,400,400);
			DNA.OAuth2._moveObject(personBall,data.type);
		});
	
		//window.mapWalker = null;
		//DNA.OAuth2.makePrototype();
		//DNA.OAuth2.makeMap();
	},

	moveObject : function(object,a,b,MaxLeft,MaxTop){
   
	   var moveleft = object.position().left + (a);
	   var movetop = object.position().top + (b);
	   
	   if(moveleft>=0 && moveleft<= MaxLeft){
	      object.animate({"left":moveleft.toString()+"px"},"fast");
	   }
	   
	   if(movetop>=0 && movetop<= MaxTop){
	      object.animate({"top":movetop.toString()+"px"},"fast");
	   }
	},

	_moveObject : function(object,type){
   	
   		var MaxLeft = $('#ground').width();
   		var MaxTop = $('#ground').height();
	   var moveleft = object.position().left;
	   var movetop = object.position().top;

	   if(type==1){

	   	  if(moveleft >= 60 ){
	         object.animate({"left":"-=40px"},400);
	   	  }

	   }
	   else if(type==2){
	   	  if( moveleft< MaxLeft){
	         object.animate({"left":"+=40px"},400);
	   	  }

	   }
	   else if(type==3){

	      if(movetop >= 60 ){
	         object.animate({"top":"-=40px"},400);
	   	  }
	   	
	   }
	   else if(type==4){
	   	   if( movetop<= MaxTop){
	         object.animate({"top":"+=40px"},400);
	   	   }
	   }
	   else if(type==5){
	   		object.effect( "shake" );
	   }

	   if(num>2)
			DNA.OAuth2.isMeet($('#'+users[1]),$('#'+users[2]), 15);

	},

 	isMeet : function(object1,object2,range){
 		console.log("meetin");
	   var difLeft = (object1.position().left - object2.position().left);
	   var difTop =  (object1.position().top - object2.position().top);

	   if(difLeft < 0) difLeft*=-1;
	   if(difTop < 0) difTop*=-1;

	   console.log(difLeft+"<="+range +" && " + difTop + "<=" + range);

	   if(difLeft <=range && difTop<=range ){
	   	console.log("meetin in");
	   		object1.effect( "shake" );
	   		object2.effect( "shake" );
	   }else{
	   }
	},

	commandFuction : function(n){
		//focus
		console.log("trig");

		//$('#leftRoadView').focus();

		var up = $.Event('keypress');
		console.log("1");
		up.keyCode = "38".charCodeAt(0);
		console.log("2");
		$('.object').trigger(up);
		console.log("3");

	},
	addEvent: function() {
		
		$('#daumContent').click(function(e) {
			//var offset = $(this).offset();
			console.log('X = ' + (e.clientX ));//- offset.left) );
			console.log('Y = ' + (e.clientY ));//- offset.top) );
		});
	},
	createIframe : function(){
		if($("#ifrmChild").length) $("#ifrmChild").remove();
		$(".box_Iframe").html('');
		$(".box_Iframe").append("<iframe id='ifrmChild' frameborder='0' style='width:100%; height:100%;' src='https://apis.daum.net/oauth2/authorize?client_id="+DNA.OAuth2.CLIENT_ID+"&redirect_uri=http://"+window.location.host+"/tools/oauth2/getAuthCode&response_type=code' onload='DNA.OAuth2.getCode(this);'></iframe>");
		$("#Iframe").show();
		$("#fullTab").hide();
		
		//DNA.OAuth2.viewDialog(DNA.context.diaglog2_0,'right');	
	},
	divMove : function(e){
		  var position = $(".bar_divide").position();
		  var toolWith = ((e.pageX-50)/$(".wrap_tools").width())*100;
		  var helpWith = 100-toolWith;

		  if(toolWith < 30){
		  	toolWith = 30;
		  	helpWith = 70;
		  } 
		  
		  if(helpWith < 32){
		  	toolWith = 68;
		  	helpWith = 32;
		  }
		 $(".cont_tool").css('width', toolWith+'%');
		 $(".cont_help").css('width', helpWith+'%');
	},
	addMoveBarEvent : function(){
		$(".bar_divide").css('cursor','move');
		$(".wrap_tools").mouseup(function() {
  			$(".wrap_tools").unbind('mousemove', DNA.OAuth2.divMove);
		});

    	$(".bar_divide").mousedown(function() {
  			$(".wrap_tools").bind('mousemove', DNA.OAuth2.divMove);
		});
    },
    setUser : function(message,i){

	    $("#score").append($("<td class='talk_tool clearfix'>"
	    							  +"<span class='wrap_img'>"
	    								+"<img width='30' height='30' alt='' src="+window.location.origin+"/images/img_men"+i+".png>"
	    									+"<span class='wrap_talk'><strong class='tit_talk'>"+" "+message+"   "+"</strong>"
	    										+"</td>").hide().fadeIn(700));
    	
    },
    setBall : function(message){

	    $("#ground").append($("<img id="+message+" style='position:absolute;' width='60' height='60' src="+window.location.origin+"/images/img_men"+num+".png>").hide().fadeIn(700));
    	num++;
    },
    //Load view
  	MapWalker : function(position){

    	//커스텀 오버레이에 사용할 map walker 엘리먼트
	    var content = document.createElement('div');
	    var figure = document.createElement('div');
	    var angleBack = document.createElement('div');

	    //map walker를 구성하는 각 노드들의 class명을 지정 - style셋팅을 위해 필요
	    content.className = 'MapWalker';
	    figure.className = 'figure';
	    angleBack.className = 'angleBack';

	    content.appendChild(angleBack);
	    content.appendChild(figure);

	    //커스텀 오버레이 객체를 사용하여, map walker 아이콘을 생성
	    var walker = new daum.maps.CustomOverlay({
	        position: position,
	        content: content,
	        yAnchor: 1
	    });

	    this.walker = walker;
	    this.content = content;
	},

	makePrototype : function(){

		DNA.OAuth2.MapWalker.prototype.setAngle = function(angle){

		    var threshold = 22.5; //이미지가 변화되어야 되는(각도가 변해야되는) 임계 값
		    for(var i=0; i<16; i++){ //각도에 따라 변화되는 앵글 이미지의 수가 16개
		        if(angle > (threshold * i) && angle < (threshold * (i + 1))){
		            //각도(pan)에 따라 아이콘의 class명을 변경
		            var className = 'm' + i;
		            this.content.className = this.content.className.split(' ')[0];
		            this.content.className += (' ' + className);
		            break;
		        }
		    }
		};
		//map walker의 위치를 변경시키는 함수
		DNA.OAuth2.MapWalker.prototype.setPosition = function(position){
		    this.walker.setPosition(position);
		};

		//map walker를 지도위에 올리는 함수
		DNA.OAuth2.MapWalker.prototype.setMap = function(map){
		    this.walker.setMap(map);
		}
	},
	makeMap : function(){

		/*
		 * 아래부터 실제 지도와 로드뷰 map walker를 생성 및 제어하는 로직
		 */
		var mapContainer = document.getElementById('leftMap'), // 지도를 표시할 div
		    mapCenter = new daum.maps.LatLng(33.450701, 126.570667), // 지도의 가운데 좌표
		    mapOption = {
		        center: mapCenter, // 지도의 중심좌표
		        level: 3 // 지도의 확대 레벨
		    };

		// 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
		var map = new daum.maps.Map(mapContainer, mapOption);

		// 로드뷰 도로를 지도위에 올린다.
		map.addOverlayMapTypeId(daum.maps.MapTypeId.ROADVIEW);

		var roadviewContainer = document.getElementById('leftRoadView'); // 로드뷰를 표시할 div
		var roadview = new daum.maps.Roadview(roadviewContainer); // 로드뷰 객체
		var roadviewClient = new daum.maps.RoadviewClient(); // 좌표로부터 로드뷰 파노ID를 가져올 로드뷰 helper객체

		// 지도의 중심좌표와 가까운 로드뷰의 panoId를 추출하여 로드뷰를 띄운다.
		roadviewClient.getNearestPanoId(mapCenter, 50, function(panoId) {
		    roadview.setPanoId(panoId, mapCenter); // panoId와 중심좌표를 통해 로드뷰 실행
		});

		// 로드뷰의 초기화 되었을때 map walker를 생성한다.
		daum.maps.event.addListener(roadview, 'init', function() {
		    // map walker를 생성한다. 생성시 지도의 중심좌표를 넘긴다.
		    mapWalker = new DNA.OAuth2.MapWalker(mapCenter);
		    mapWalker.setMap(map); // map walker를 지도에 설정한다.

		    // 로드뷰가 초기화 된 후, 추가 이벤트를 등록한다.
		    // 로드뷰를 상,하,좌,우,줌인,줌아웃을 할 경우 발생한다.
		    // 로드뷰를 조작할때 발생하는 값을 받아 map walker의 상태를 변경해 준다.
		    daum.maps.event.addListener(roadview, 'viewpoint_changed', function(){
		        // 이벤트가 발생할 때마다 로드뷰의 viewpoint값을 읽어, map walker에 반영
		        var viewpoint = roadview.getViewpoint();
		        mapWalker.setAngle(viewpoint.pan);

		    });

		    // 로드뷰내의 화살표나 점프를 하였을 경우 발생한다.
		    // position값이 바뀔 때마다 map walker의 상태를 변경해 준다.
		    daum.maps.event.addListener(roadview, 'position_changed', function(){
		        // 이벤트가 발생할 때마다 로드뷰의 position값을 읽어, map walker에 반영
		        var position = roadview.getPosition();
		        mapWalker.setPosition(position);
		        map.setCenter(position);

		    });
		});	
	},

    //비동기적으로 인증코드를 가져오는 함수를 1초마다 실행시킨다.
    async : function(func){
    	setTimeout(func(),1000);
    }
};
$(document).ready(function() {
	DNA.OAuth2.init();
});

