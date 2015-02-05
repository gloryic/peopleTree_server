package com.ssm.location;

import org.json.JSONException;
import org.json.JSONObject;











import com.android.volley.Response;
import com.android.volley.Request.Method;
import com.android.volley.VolleyError;
import com.ssm.peopleTree.C;
import com.ssm.R;
import com.ssm.peopleTree.network.NetworkManager;

import android.location.Location;
import android.util.Log;
import android.widget.TextView;

class OutsideLocationUpdateNotifier implements UpdateNotifier, Response.Listener<JSONObject>, Response.ErrorListener {
	OutsideLocationListener parent;
	static int cnt=0;
	
	@Override
	public void notifyUpdate(Object arg) {
		parent = (OutsideLocationListener) arg;
		Log.i("log", "OutsideLocationUpdateNotifier req");
		
	
		PeopleTreeLocationManager.txt1.setText("["+cnt+"]"+"ac:" + parent.getAccuracy() + " ,la:" + parent.getLatitude() + " ,lo:" + parent.getLongitude());
		cnt++;
		/*
		NetworkManager nm = NetworkManager.getInstance();
			
		JSONObject req = new JSONObject();
		try {
			req.put("userId", 1234).put("userType", 1).put("modeType",2).put("edgeStatus", 3).put("deviceStatus",4)
			.put("latitude", parent.getLatitude()).put("longtitude", parent.getLongitude()).put("fpId", 0);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		nm.request(Method.POST, C.baseURL+"/ptree/check/location", req, this, this);
		
		*/
	}
	@Override
	public void onErrorResponse(VolleyError arg0) {
		Log.i("log", "resp err");
	}
	@Override
	public void onResponse(JSONObject arg0) {
		// TODO Auto-generated method stub
		Log.i("log", "resp ok");
	}

}
