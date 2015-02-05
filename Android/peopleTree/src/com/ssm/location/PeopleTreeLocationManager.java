package com.ssm.location;

import android.content.Context;
import android.widget.TextView;

public class PeopleTreeLocationManager {
	static OutsideLocationListener outsideLocationListener;;
	static InsideLocationListener insideLocationListener;
	private Context mContext;

	
	boolean isInitialize = false;
	
	
	public void initmanager(Context context){
		if(!isInitialize){
			this.mContext = context;

			outsideLocationListener = new OutsideLocationListener(context);
			insideLocationListener =  new InsideLocationListener(context); 
		}
	}
	
	
	
	
	static public TextView txt1;
	
}
