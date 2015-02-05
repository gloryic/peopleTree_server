package com.ssm.broadcast;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.widget.Toast;
 
public class ConnReceiver extends BroadcastReceiver {
	
	static final String TAG = "ConnReceiver";
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
         
        if (action.equals(ConnectivityManager.CONNECTIVITY_ACTION))
        {
            ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo activeNetInfo = connectivityManager.getActiveNetworkInfo();
            NetworkInfo mobNetInfo = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
            
            Toast.makeText(context,"Active Network Type : " + activeNetInfo.getTypeName() , Toast.LENGTH_SHORT).show();
            Toast.makeText(context,"Mobile Network Type : " + mobNetInfo.getTypeName() , Toast.LENGTH_SHORT).show();
        }
        
    }
}