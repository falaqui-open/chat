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
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import app.internal.NativeContactListActivity;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import android.util.Log;

import static android.Manifest.permission.READ_CONTACTS;

public class NativeScreen extends CordovaPlugin {
    private static final String LOG_TAG = "NativeScreen";
    private static final int READ_CONTACTS_REQ_CODE = 100;
    private static final int READ_CONTACTS_SELECTION_REQ_CODE = 101;
    private static final int REQUEST_CODE = 1;
    private CallbackContext callbackContext;

    private String contactListScreenTitle;
    private String contactListSearchBoxText;
    private String contactListOnlyMobileText;
    private String contactListContactsText;
    private String contactListCreateNewButtonText;
    private String contactListCreateGroupButtonText;

    private List<String> contactListSelectionSelectedNumbers;
    private String contactListSelectionScreenTitle;
    private String contactListSelectionSearchBoxText;
    private String contactListSelectionOnlyMobileText;
    private String contactListSelectionAddButtonText;
    private String contactListSelectionContactsText;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) 
    {
        super.initialize(cordova, webView);

        Log.d(LOG_TAG, "Initializing Native Screen");
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException 
    {
        this.callbackContext = callbackContext;

        boolean actionOK = false;

        if(action.equals("showNativeScreen")) 
        {
            actionOK = true;
            String message = args.getString(0);

            this.showNativeScreen(message);
        }
        else if(action.equals("showNativeContactList")) 
        {
            actionOK = true;
            String screenTitle = args.getString(0);
            String searchBoxText = args.getString(1);
            String onlyMobileText = args.getString(2);
            String contactsText = args.getString(3);
            String createNewButtonText = args.getString(4);
            String createGroupButtonText = args.getString(5);

            this.contactListScreenTitle = screenTitle;
            this.contactListSearchBoxText = searchBoxText;
            this.contactListOnlyMobileText = onlyMobileText;
            this.contactListContactsText = contactsText;
            this.contactListCreateNewButtonText = createNewButtonText;
            this.contactListCreateGroupButtonText = createGroupButtonText;
            

            // this.showNativeContactList();
            requestContactsPermission(READ_CONTACTS_REQ_CODE);
        }
        else if(action.equals("showNativeContactListSelection")) 
        {
            actionOK = true;

            JSONArray preSelectionArray = args.getJSONArray(0);
            String screenTitle = args.getString(1);
            String searchBoxText = args.getString(2);
            String onlyMobileText = args.getString(3);
            String addButtonText = args.getString(4);
            String contactsText = args.getString(5);

            // Get the preSelectionArray (first argument)
            try 
            {
                this.contactListSelectionSelectedNumbers = new ArrayList<>();

                // Loop through the JSONArray and add the phone numbers to the list
                for (int i = 0; i < preSelectionArray.length(); i++) 
                {
                    String phoneNum = preSelectionArray.getString(i).replaceAll("[^0-9]", ""); // Normalizing phone number
                    this.contactListSelectionSelectedNumbers.add(phoneNum);  // Adding the phone number
                }

                // Set up the other necessary data for the contact list selection screen
                this.contactListSelectionScreenTitle = screenTitle;
                this.contactListSelectionSearchBoxText = searchBoxText;
                this.contactListSelectionOnlyMobileText = onlyMobileText;
                this.contactListSelectionAddButtonText = addButtonText;
                this.contactListSelectionContactsText = contactsText;

                // Proceed with permission request if necessary
                requestContactsPermission(READ_CONTACTS_SELECTION_REQ_CODE);
            } 
            catch (JSONException e) {
                e.printStackTrace();
            }
        }

        if(actionOK == true)
        {
            // Keep the callback alive for the result
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);

            return true;
        }


        return false;
    }


    private void showNativeScreen(String message) 
    {
        Log.d(LOG_TAG, "Show Native Screen Call");

        Intent intent = new Intent(this.cordova.getActivity(), NativeScreenActivity.class);
        intent.putExtra("message", message);
        this.cordova.startActivityForResult(this, intent, REQUEST_CODE);

        Log.d(LOG_TAG, "Show Native Screen Done");
    }


    private void showNativeContactList() 
    {
        Log.d(LOG_TAG, "Show Native Screen Call");

        Intent intent = new Intent(this.cordova.getActivity(), NativeContactListActivity.class);
        intent.putExtra("screentitle", this.contactListScreenTitle);
        intent.putExtra("searchboxtext", this.contactListSearchBoxText);
        intent.putExtra("onlymobiletext", this.contactListOnlyMobileText);
        intent.putExtra("contactstext", this.contactListContactsText);
        intent.putExtra("createnewbuttontext", this.contactListCreateNewButtonText);
        intent.putExtra("creategroupbuttontext", this.contactListCreateGroupButtonText);
        
        this.cordova.startActivityForResult(this, intent, REQUEST_CODE);

        Log.d(LOG_TAG, "Show Native Contact List Done");
    }

    private void showNativeContactListSelection() 
    {
        Log.d(LOG_TAG, "Show Native Contact List Selection Call");

        Intent intent = new Intent(this.cordova.getActivity(), NativeContactListSelectionActivity.class);
        intent.putExtra("screentitle", this.contactListSelectionScreenTitle);
        intent.putExtra("searchboxtext", this.contactListSelectionSearchBoxText);
        intent.putExtra("onlymobiletext", this.contactListSelectionOnlyMobileText);
        intent.putExtra("addbuttontext", this.contactListSelectionAddButtonText);
        intent.putExtra("contactstext", this.contactListSelectionContactsText);
    
        // Pass the preselected phone numbers to the activity
        if (this.contactListSelectionSelectedNumbers != null && !this.contactListSelectionSelectedNumbers.isEmpty()) 
        {
            intent.putStringArrayListExtra("preselectednumbers", new ArrayList<>(this.contactListSelectionSelectedNumbers));
        }
    
        this.cordova.startActivityForResult(this, intent, REQUEST_CODE);
    
        Log.d(LOG_TAG, "Show Native Contact List Selection Done");
    }

    
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode != REQUEST_CODE)
        {
            return;
        }

        JSONObject responsePlugin = new JSONObject();

        try 
        {
            if (resultCode == Activity.RESULT_OK && intent != null) 
            {
                String data = intent.getStringExtra("resultData");
                ArrayList<String> arrayData = null;

                if(data == null)
                {
                    arrayData = intent.getStringArrayListExtra("resultData");
                }
                
                responsePlugin.put("message", data != null ? data : arrayData != null ? arrayData : "No data received");
            } 
            else 
            {
                responsePlugin.put("message", "Operation canceled or failed");
            }
        } 
        catch (JSONException e) 
        {
            Log.e(LOG_TAG, "Error creating JSON response", e);
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

    }

    private void requestContactsPermission(int requestCode) {
        if (cordova.hasPermission(READ_CONTACTS)) {
            if (requestCode == READ_CONTACTS_REQ_CODE)
            {
                showNativeContactList();
            }

            if (requestCode == READ_CONTACTS_SELECTION_REQ_CODE)
            {
                showNativeContactListSelection();
            }
            

        } else {
            cordova.requestPermission(this, requestCode, READ_CONTACTS);
        }
    }

    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
        if (requestCode == READ_CONTACTS_REQ_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showNativeContactList();
            } else {
                callbackContext.error("Permission denied to read contacts");
            }
        }

        if (requestCode == READ_CONTACTS_SELECTION_REQ_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showNativeContactListSelection();
            } else {
                callbackContext.error("Permission denied to read contacts");
            }
        }
    }
}