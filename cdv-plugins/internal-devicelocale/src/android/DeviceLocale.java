package app.internal;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.ContentResolver;
import android.os.Build;
import android.os.LocaleList;

import java.util.Locale;


import android.util.Log;

public class DeviceLocale extends CordovaPlugin {
    private static final String LOG_TAG = "DeviceLocale";

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) 
    {
        super.initialize(cordova, webView);

        Log.d(LOG_TAG, "Initializing Locale");
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException 
    {
        if(action.equals("get")) 
        {
            this.get(callbackContext);
        } 

        return true;
    }


    private void get(CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Get Locale Call");

        String country = Locale.getDefault().getCountry();
        String language = Locale.getDefault().getLanguage();

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("country", country);
            responsePlugin.put("language", language);
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Locale Get Done");
    }  
}