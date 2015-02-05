package com.ssm.peopleTree;

import org.json.JSONObject;

import com.ssm.R;
import android.app.Activity;
import android.app.ProgressDialog;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;

import com.android.volley.Request.Method;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.VolleyLog;
import com.android.volley.toolbox.JsonObjectRequest;
import com.ssm.location.PeopleTreeLocationManager;
import com.ssm.peopleTree.network.NetworkManager;
import com.ssm.volley.VolleySingleton;

public class MainActivity extends Activity {

	private TextView mTvResult;
	private TextView responseText;


	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		
		NetworkManager.getInstance().initialize(getApplicationContext());
		// final ProgressDialog pDialog = new ProgressDialog(this);
		// pDialog.setMessage("Loading...");
		// pDialog.show();

		
		PeopleTreeLocationManager.txt1 = (TextView) findViewById(R.id.locationTextview1);
		Log.i("Log", "start");
		
		
		Button btnSimpleRequest = (Button) findViewById(R.id.btn_simple_request);
		responseText = (TextView) findViewById(R.id.test);

		btnSimpleRequest.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {

				String url = C.baseURL + "/ptree/test";

				JsonObjectRequest jsonObjReq = new JsonObjectRequest(
						Method.GET, url, null,
						new Response.Listener<JSONObject>() {

							@Override
							public void onResponse(JSONObject response) {
								Log.d("App", response.toString());
								responseText.setText("Response:" + " "
										+ response.toString());
								Log.i("App", response.toString());
								// pDialog.hide();
							}
						}, new Response.ErrorListener() {

							@Override
							public void onErrorResponse(VolleyError error) {
								VolleyLog.d("App_Error",
										"Error: " + error.getMessage());
								Log.i("App_Error", error.getMessage());
								// hide the progress dialog
								// pDialog.hide();
							}
						});
				VolleySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsonObjReq);
			}
		});
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}
}
