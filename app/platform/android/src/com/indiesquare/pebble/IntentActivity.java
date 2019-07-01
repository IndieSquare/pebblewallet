package com.indiesquare.pebble;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.util.Log;
import android.net.Uri;

import android.content.SharedPreferences;
import android.content.Context;

import android.preference.PreferenceManager;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.kroll.KrollDict;

public class IntentActivity extends Activity {

    private static final String TAG = "IntentActivity";

    private void activate(String source){
        Intent intent = new Intent();
        intent.setClassName(this, "com.indiesquare.pebble.PebbleActivity");
        intent.setAction(Intent.ACTION_VIEW);
        intent.putExtra("source", source);
        intent.putExtra("data", "blah");

        SharedPreferences sharedPref =  PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
         SharedPreferences.Editor editor = sharedPref.edit();
         editor.putString("intentData",  source);
         editor.commit();


        try{
            Log.d(TAG, "**** startActivity:"+source);
            startActivity(intent);
        }catch(Exception e){
            Log.d(TAG, "**** e:"+e);
        }

    }





    @Override
    public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);

        Intent currentIntent = getIntent();

        Bundle extras = currentIntent.getExtras();
        String source = null;

       // Uri uri = currentIntent.getData();
	 source = currentIntent.getDataString();

        TiRootActivity app = (TiRootActivity) TiApplication.getAppRootOrCurrentActivity();
        if( app == null ){
            activate(source);
        }
        else{
            ActivityProxy proxy = app.getActivityProxy();
            if( proxy == null ){
                activate(source);
            }
            else{
                KrollDict event = new KrollDict();
                Log.d(TAG, "**** normalstart:"+source);
                event.put("data", source);
                proxy.fireEvent("app:resume", event);
            }
        }
        finish();
    }

    @Override
    protected void onNewIntent(Intent intent){
        super.onNewIntent(intent);
        finish();
    }
}
