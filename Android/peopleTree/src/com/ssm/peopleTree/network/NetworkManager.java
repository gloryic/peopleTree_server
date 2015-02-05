package com.ssm.peopleTree.network;

import org.json.JSONObject;

import android.content.Context;

import com.android.volley.RequestQueue;
import com.android.volley.Response.ErrorListener;
import com.android.volley.Response.Listener;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

public class NetworkManager {
	
	private volatile static NetworkManager instance;
	private static RequestQueue requestQueue;
	private static Context context;
	
	private NetworkManager() {
		instance = null;
	}
	
	public static NetworkManager getInstance() {
		if (null == instance) {
			synchronized (NetworkManager.class) {
				instance = new NetworkManager();
			}
		}
		
		return instance;
	}
	
	
    public static void initialize(Context _context) {
    	context = _context;
    	requestQueue = Volley.newRequestQueue(context);
    }

	
	public void request(int method, String url, JSONObject jsonRequest, Listener<JSONObject> listener, ErrorListener errorListener) {
		if (requestQueue == null) {
            throw new IllegalStateException("Volley Request Queue is not initialized.");
        }
		
		JsonObjectRequest req = new JsonObjectRequest(method, url, jsonRequest, listener, errorListener); 
		requestQueue.add(req);
	}
}