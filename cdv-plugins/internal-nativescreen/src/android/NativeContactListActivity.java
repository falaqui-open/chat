package app.internal;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.view.View;
import android.view.ViewGroup;
// import android.widget.ListView;
import android.widget.*;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NativeContactListActivity extends Activity {

    private Button closeButton;
    private TextView titleTextView;
    private ListView contactListView;
    private Button createNewButton;
    private Button createGroupButton;
    private EditText searchEditText;
    private CheckBox mobileOnlyCheckbox;
    private TextView listSizeTextView;

    private List<JSONObject> allContacts = new ArrayList<>();
    private List<JSONObject> filteredContacts = new ArrayList<>();
    private ArrayAdapter<String> adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int layoutId = getResources().getIdentifier("activity_native_contact_list", "layout", getPackageName());
        setContentView(layoutId);

        initializeUI();
        loadContacts();
        updateContactList("");
    }

    private void initializeUI() {
        titleTextView = findViewById(getResources().getIdentifier("titleTextView", "id", getPackageName()));
        contactListView = findViewById(getResources().getIdentifier("contactListView", "id", getPackageName()));
        searchEditText = findViewById(getResources().getIdentifier("searchEditText", "id", getPackageName()));
        createNewButton = findViewById(getResources().getIdentifier("createNewButton", "id", getPackageName()));
        createGroupButton = findViewById(getResources().getIdentifier("createGroupButton", "id", getPackageName()));
        mobileOnlyCheckbox = findViewById(getResources().getIdentifier("mobileOnlyCheckbox", "id", getPackageName()));
        listSizeTextView = findViewById(getResources().getIdentifier("listSizeTextView", "id", getPackageName()));
        closeButton = findViewById(getResources().getIdentifier("closeButton", "id", getPackageName()));

        String screenTitle = getIntent().getStringExtra("screentitle");
        titleTextView.setText(screenTitle);

        String searchBoxText = getIntent().getStringExtra("searchboxtext");
        searchEditText.setHint(searchBoxText);

        String onlyMobileText = getIntent().getStringExtra("onlymobiletext");
        mobileOnlyCheckbox.setText(onlyMobileText);

        String contactsText = getIntent().getStringExtra("contactstext");
        listSizeTextView.setText("0 " + contactsText);

        String createNewButtonText = getIntent().getStringExtra("createnewbuttontext");
        createNewButton.setText(createNewButtonText);

        String createGroupButtonText = getIntent().getStringExtra("creategroupbuttontext");
        createGroupButton.setText(createGroupButtonText);

        createNewButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                JSONObject responsePlugin = new JSONObject();
                try 
                {
                    responsePlugin.put("action", "CREATE_NEW");
                } 
                catch (JSONException e) 
                {
                    e.printStackTrace();
                }

                Intent resultIntent = new Intent();
                resultIntent.putExtra("resultData", responsePlugin.toString());
                setResult(Activity.RESULT_OK, resultIntent);
                finish();                
            } 
        });

        createGroupButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                JSONObject responsePlugin = new JSONObject();
                try 
                {
                    responsePlugin.put("action", "CREATE_GROUP");
                } 
                catch (JSONException e) 
                {
                    e.printStackTrace();
                }

                Intent resultIntent = new Intent();
                resultIntent.putExtra("resultData", responsePlugin.toString());
                setResult(Activity.RESULT_OK, resultIntent);
                finish();                
            } 
        });

        searchEditText.addTextChangedListener(new android.text.TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateContactList(s.toString());
            }

            @Override
            public void afterTextChanged(android.text.Editable s) {}
        });

        mobileOnlyCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> updateContactList(searchEditText.getText().toString()));

        closeButton.setOnClickListener(v -> finish());
    }

    private void loadContacts() {
        ContentResolver cr = getContentResolver();
        Cursor cursor = cr.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI, 
            new String[]{
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.TYPE
            }, 
            null, 
            null, 
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        );

        if (cursor != null) {
            while (cursor.moveToNext()) {
                try {
                    String name = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                    String phoneDisplay = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER));
                    String phone = phoneDisplay.replaceAll("[^0-9]", ""); // Normalize phone number;
                    int type = cursor.getInt(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE));

                    JSONObject contact = new JSONObject();
                    contact.put("name", name);
                    contact.put("phone", phone);
                    contact.put("phonedisplay", phoneDisplay);
                    contact.put("type", type);

                    // allContacts.add(contact);

                    // Add to list if not already present
                    if (!containsPhoneNumber(allContacts, phone)) {
                        allContacts.add(contact);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            cursor.close();
        }

        // Sort at the code level as a fallback (optional if query sorting is guaranteed)
        // Collections.sort(allContacts, (o1, o2) -> {
        //     String name1 = o1.optString("name", "");
        //     String name2 = o2.optString("name", "");
        //     return name1.compareToIgnoreCase(name2);
        // });
    }

    /**
     * Helper method to check if a phone number already exists in the list
     */
    private boolean containsPhoneNumber(List<JSONObject> contactList, String phone) {
        for (JSONObject contact : contactList) {
            if (contact.optString("phone").equals(phone)) {
                return true;
            }
        }
        return false;
    }

    private void updateContactList(String query) {
        filteredContacts.clear();
        for (JSONObject contact : allContacts) {
            String name = contact.optString("name").toLowerCase();
            String phone = contact.optString("phone");

            if (name.contains(query.toLowerCase()) &&
                (!mobileOnlyCheckbox.isChecked() || contact.optInt("type") == ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE)) {
                filteredContacts.add(contact);
            }
        }

        // Set up the custom adapter
        contactListView.setAdapter(new BaseAdapter() {
            @Override
            public int getCount() {
                return filteredContacts.size();
            }

            @Override
            public JSONObject getItem(int position) {
                return filteredContacts.get(position);
            }

            @Override
            public long getItemId(int position) {
                return position;
            }

            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                // Inflate the custom layout if the view is null
                if (convertView == null) {
                    int layoutId = getResources().getIdentifier("activity_native_contact_list_item", "layout", getPackageName());
                    convertView = getLayoutInflater().inflate(layoutId, parent, false);
                }

                // Bind data to the custom layout views
                TextView nameTextView = convertView.findViewById(getResources().getIdentifier("contact_name", "id", getPackageName()));
                TextView phoneTextView = convertView.findViewById(getResources().getIdentifier("contact_phone", "id", getPackageName()));

                JSONObject contact = getItem(position);
                nameTextView.setText(contact.optString("name"));
                phoneTextView.setText(contact.optString("phonedisplay"));

                return convertView;
            }
        });

        // Update the count text
        String contactsText = getIntent().getStringExtra("contactstext");
        listSizeTextView.setText(filteredContacts.size() + " " + contactsText);

        // Set item click listener for list items
        contactListView.setOnItemClickListener((parent, view, position, id) -> {
            JSONObject selectedContact = filteredContacts.get(position);
            Intent resultIntent = new Intent();
            resultIntent.putExtra("resultData", selectedContact.toString());
            setResult(Activity.RESULT_OK, resultIntent);
            finish();
        });
    }
}