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
import android.content.pm.PackageManager;
import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import android.provider.ContactsContract.CommonDataKinds.StructuredName;
import android.provider.ContactsContract.Contacts;
import android.provider.ContactsContract.Contacts.Data;

import android.util.Log;

import static android.Manifest.permission.READ_CONTACTS;

public class ActiveContacts extends CordovaPlugin {
    private static final String LOG_TAG = "ActiveContacts";
    private static final int READ_CONTACTS_REQ_CODE = 0;
    private CallbackContext callbackContext;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) 
    {
        super.initialize(cordova, webView);

        Log.d(LOG_TAG, "Initializing ActiveContacts");
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException 
    {
        this.callbackContext = callbackContext;

        if(action.equals("list")) 
        {
            this.list(callbackContext);
        } 

        return true;
    }


    private void list(CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Active Contacts List Call");

        if (cordova.hasPermission(android.Manifest.permission.READ_CONTACTS)) 
        {
            Log.d(LOG_TAG, "Active Contacts Starting List Call");
            callList();
        } 
        else 
        {
            Log.d(LOG_TAG, "Active Contacts Permission Request");
            cordova.requestPermission(this, READ_CONTACTS_REQ_CODE, android.Manifest.permission.READ_CONTACTS);
        }
    }

    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException 
    {
        for (int r : grantResults) 
        {
            if (r == PackageManager.PERMISSION_DENIED) 
            {
                Log.d(LOG_TAG, "Permission denied");
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "User has denied permission"));
                return;
            }
        }
        callList();
    }

    private void callList() 
    {
        Log.d(LOG_TAG, "Active Contacts List Thread Execute");

        this.cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                Log.d(LOG_TAG, "Active Contacts get list");
                JSONArray responseList = getList();

                Log.d(LOG_TAG, "Active Contacts Preparing Response");

                JSONObject responsePlugin = new JSONObject();
                try 
                {
                    responsePlugin.put("contacts", responseList);
                } 
                catch (JSONException e) 
                {
                    e.printStackTrace();
                }

                Log.d(LOG_TAG, "Active Contacts Sending Response");

                // These lines can be reused anywhere in your app to send data to the javascript
                PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
                
                //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
                result.setKeepCallback(false);

                callbackContext.sendPluginResult(result);
                //no more result , hence the context is cleared.
                callbackContext = null;

                Log.d(LOG_TAG, "Active Contacts Done");

                // callbackContext.success(list());
            }
        });
    }


    private JSONArray getList() 
    {
        Log.d(LOG_TAG, "Active Contacts List Load");
        JSONArray contacts = new JSONArray();
        ContentResolver cr = this.cordova.getActivity().getContentResolver();
    
        // Fetch all active accounts raw contacts
        String[] projection = new String[] {
            ContactsContract.RawContacts.CONTACT_ID,
            ContactsContract.RawContacts.ACCOUNT_NAME,
            ContactsContract.RawContacts.ACCOUNT_TYPE,
            ContactsContract.RawContacts.DELETED
        };
    
        // Only get non-deleted contacts
        String selection = ContactsContract.RawContacts.DELETED + " = 0";
        Cursor cursor = cr.query(ContactsContract.RawContacts.CONTENT_URI, projection, selection, null, null);
    
        if (cursor != null && cursor.getCount() > 0) {
            while (cursor.moveToNext()) {
                try {
                    String contactId = cursor.getString(cursor.getColumnIndex(ContactsContract.RawContacts.CONTACT_ID));
                    String accountName = cursor.getString(cursor.getColumnIndex(ContactsContract.RawContacts.ACCOUNT_NAME));
                    String accountType = cursor.getString(cursor.getColumnIndex(ContactsContract.RawContacts.ACCOUNT_TYPE));
    
                    // Fetch detailed contact information using the contactId from ContactsContract.Data
                    JSONObject detailedContact = getDetailedContact(contactId, accountName, accountType);
                    // String contactName = detailedContact.getString("firstName");
                    // Log.d(LOG_TAG, "Active Contacts List Loading... " + contactName);
                    contacts.put(detailedContact);
                } catch (JSONException e) {
                    Log.e(LOG_TAG, e.getMessage(), e);
                }
            }
            cursor.close();
        }
        return contacts;
    }

    private JSONObject getDetailedContact(String contactId, String accountName, String accountType) throws JSONException 
    {
        ContentResolver cr = this.cordova.getActivity().getContentResolver();
    
        // Define the projection to retrieve contact details
        String[] projection = new String[]{
            ContactsContract.Data.CONTACT_ID,
            ContactsContract.Data.DISPLAY_NAME,
            ContactsContract.Data.MIMETYPE,
            ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME,
            ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE,
            ContactsContract.CommonDataKinds.Phone.LABEL,
            ContactsContract.Contacts.PHOTO_THUMBNAIL_URI
        };
    
        // Fetch all data rows associated with the contactId
        Cursor cursor = cr.query(
            ContactsContract.Data.CONTENT_URI,
            projection,
            ContactsContract.Data.CONTACT_ID + " = ?",
            new String[]{contactId},
            null
        );
    
        JSONObject contact = new JSONObject();
        JSONArray phones = new JSONArray();
    
        contact.put("id", contactId);
        contact.put("accountName", accountName);
        contact.put("accountType", accountType);
    
        if (cursor != null && cursor.getCount() > 0) 
        {
            while (cursor.moveToNext()) 
            {
                String mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE));
    
                if (mimeType.equals(ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)) 
                {
                    contact.put("firstName", cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME)));
                    contact.put("lastName", cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME)));
                    contact.put("displayName", cursor.getString(cursor.getColumnIndex(ContactsContract.Data.DISPLAY_NAME)));
                    contact.put("thumbnail", cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.PHOTO_THUMBNAIL_URI)));
                } 
                else if (mimeType.equals(ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) 
                {
                    phones.put(getPhoneNumber(cursor));
                }
            }
        }
        cursor.close();
    
        contact.put("phoneNumbers", phones);
    
        return contact;
    }

    // private JSONArray getList() 
    // {
    //     Log.d(LOG_TAG, "Active Contacts List Load");
    //     JSONArray contacts = new JSONArray();
    //     ContentResolver cr = this.cordova.getActivity().getContentResolver();

    //     String[] projection = new String[] {
    //         ContactsContract.Contacts.DISPLAY_NAME,
    //         ContactsContract.Contacts.PHOTO_THUMBNAIL_URI,
    //         ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME,
    //         ContactsContract.CommonDataKinds.StructuredName.MIDDLE_NAME,
    //         ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME,
    //         ContactsContract.Contacts.HAS_PHONE_NUMBER,
    //         ContactsContract.CommonDataKinds.Phone.NUMBER,
    //         ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
    //         ContactsContract.CommonDataKinds.Phone.TYPE,
    //         ContactsContract.Data.CONTACT_ID,
    //         ContactsContract.Data.MIMETYPE
    //     };

    //     // Retrieve only the contacts with a phone number at least
    //     Cursor cursor = cr.query(ContactsContract.Data.CONTENT_URI,
    //             projection,
    //             ContactsContract.Contacts.HAS_PHONE_NUMBER + " = 1 AND (" + ContactsContract.Data.MIMETYPE + " = '" + ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE + "' OR " + ContactsContract.Data.MIMETYPE + " = '" + ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE + "')", // null, // ContactsContract.Contacts.HAS_PHONE_NUMBER + " = 1",
    //             null,
    //             ContactsContract.Data.CONTACT_ID + " ASC");

    //     contacts = populateContactArray(cursor);
    //     return contacts;
    // }

    /**
     * Creates an array of contacts from the cursor you pass in
     *
     * @param c            the cursor
     * @return             a JSONArray of contacts
     */
    private JSONArray populateContactArray(Cursor c) 
    {
        JSONArray contacts = new JSONArray();

        String contactId = null;
        String oldContactId = null;
        boolean newContact = true;
        String mimetype = null;

        JSONObject contact = new JSONObject();
        JSONArray phones = new JSONArray();

        try 
        {
            if (c.getCount() > 0) 
            {
                while (c.moveToNext()) 
                {
                    try 
                    {
                        contactId = c.getString(c.getColumnIndex(ContactsContract.Data.CONTACT_ID));

                        if (c.getPosition() == 0) // If we are in the first row set the oldContactId
                        {
                            oldContactId = contactId;
                        }
    
                        // When the contact ID changes we need to push the Contact object to the array of contacts and create new objects.
                        if (!oldContactId.equals(contactId)) 
                        {
                            // Populate the Contact object with it's arrays and push the contact into the contacts array
                            contact.put("phoneNumbers", phones);
                            contacts.put(contact);
                            // Clean up the objects
                            contact = new JSONObject();
                            phones = new JSONArray();
    
                            // Set newContact to true as we are starting to populate a new contact
                            newContact = true;
                        }
    
                        // When we detect a new contact set the ID. These fields are available in every row in the result set returned.
                        if (newContact) 
                        {
                            newContact = false;
                            contact.put("id", contactId);
                        }
    
                        mimetype = c.getString(c.getColumnIndex(ContactsContract.Data.MIMETYPE)); // Grab the mimetype of the current row as it will be used in a lot of comparisons
    
                        if (mimetype.equals(ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)) 
                        {
                            contact.put("firstName", c.getString(c.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME)));
                            contact.put("lastName", c.getString(c.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME)));
                            contact.put("middleName", c.getString(c.getColumnIndex(ContactsContract.CommonDataKinds.StructuredName.MIDDLE_NAME)));
                            contact.put("displayName", c.getString(c.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)));
                            contact.put("thumbnail", c.getString(c.getColumnIndex(ContactsContract.Contacts.PHOTO_THUMBNAIL_URI)));
                        }
                        else if (mimetype.equals(ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) 
                        {
                            phones.put(getPhoneNumber(c));
                        }
    
                        // Set the old contact ID
                        oldContactId = contactId;
                    } 
                    catch (Exception e) 
                    {
                        Log.e(LOG_TAG, e.getMessage(), e);
                    }
                }

                // Push the last contact into the contacts array
                contact.put("phoneNumbers", phones);
                contacts.put(contact);
            }
        } 
        catch (JSONException e) 
        {
            Log.e(LOG_TAG, e.getMessage(), e);
        }

        c.close();
        return contacts;
    }

    /**
     * Create a phone number JSONObject
     * @param cursor the current database row
     * @return a JSONObject representing a phone number
     */
    private JSONObject getPhoneNumber(Cursor cursor) throws JSONException 
    {
        JSONObject phoneNumber = new JSONObject();
        String number = cursor.getString(cursor.getColumnIndex(Phone.NUMBER));
        String normalizedNumber = cursor.getString(cursor.getColumnIndex(Phone.NORMALIZED_NUMBER));
        phoneNumber.put("number", number);
        phoneNumber.put("normalizedNumber", (normalizedNumber == null) ? number : normalizedNumber);
        phoneNumber.put("type", getPhoneTypeLabel(cursor.getInt(cursor.getColumnIndex(Phone.TYPE))));
        return phoneNumber;
    }


    /**
     * Retrieve the type of the phone number based on the type code
     * @param type the code of the type
     * @return a string in caps representing the type of phone number
     */
    private String getPhoneTypeLabel(int type) 
    {
        String label = "OTHER";
        if (type == Phone.TYPE_HOME)
        {
            label = "HOME";
        }
        else if (type == Phone.TYPE_MOBILE)
        {
            label = "MOBILE";
        }
        else if (type == Phone.TYPE_WORK)
        {
            label = "WORK";
        }

        return label;
    }
}