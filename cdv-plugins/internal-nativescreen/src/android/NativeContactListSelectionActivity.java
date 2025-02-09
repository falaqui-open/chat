package app.internal;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class NativeContactListSelectionActivity extends Activity {

    private TextView titleTextView, listSizeTextView;
    private EditText searchEditText;
    private CheckBox mobileOnlyCheckbox;
    private ListView contactListView;
    private Button closeButton, addButton;
    private HorizontalScrollView selectedContactsScrollView;
    private LinearLayout selectedContactsContainer;

    private ArrayList<JSONObject> allContacts = new ArrayList<>();
    private ArrayList<JSONObject> filteredContacts = new ArrayList<>();
    private ArrayList<String> selectedNumbers = new ArrayList<>();

    private String screenTitle;
    private JSONArray preSelectionArray;
    private HashMap<String, Boolean> checkBoxStates = new HashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int layoutId = getResources().getIdentifier("activity_native_contact_list_selection", "layout", getPackageName());
        setContentView(layoutId);
        
        initializeUI();
        loadContacts();
        updatePreselectionArray();
        updateContactList("");
    }

    private void initializeUI() {
        titleTextView = findViewById(getResources().getIdentifier("titleTextView", "id", getPackageName()));
        listSizeTextView = findViewById(getResources().getIdentifier("listSizeTextView", "id", getPackageName()));
        searchEditText = findViewById(getResources().getIdentifier("searchEditText", "id", getPackageName()));
        mobileOnlyCheckbox = findViewById(getResources().getIdentifier("mobileOnlyCheckbox", "id", getPackageName()));
        contactListView = findViewById(getResources().getIdentifier("contactListView", "id", getPackageName()));
        closeButton = findViewById(getResources().getIdentifier("closeButton", "id", getPackageName()));
        addButton = findViewById(getResources().getIdentifier("addButton", "id", getPackageName()));
        selectedContactsScrollView = findViewById(getResources().getIdentifier("selectedContactsScrollView", "id", getPackageName()));
        selectedContactsContainer = findViewById(getResources().getIdentifier("selectedContactsContainer", "id", getPackageName()));

        // Load pre-selected list
        ArrayList<String> preselectedNumbers = getIntent().getStringArrayListExtra("preselectednumbers");
        if (preselectedNumbers != null) {
            preSelectionArray = new JSONArray(preselectedNumbers); // Convert ArrayList to JSONArray directly if needed
        }

        // Set title
        screenTitle = getIntent().getStringExtra("screentitle");
        titleTextView.setText(screenTitle);

        String onlyMobileText = getIntent().getStringExtra("onlymobiletext");
        mobileOnlyCheckbox.setText(onlyMobileText);

        String addButtonText = getIntent().getStringExtra("addbuttontext");
        addButton.setText(addButtonText);

        String contactsText = getIntent().getStringExtra("contactstext");
        listSizeTextView.setText("0 " + contactsText);

        // Search box setup
        String searchBoxText = getIntent().getStringExtra("searchboxtext");
        searchEditText.setHint(searchBoxText);
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

        addButton.setOnClickListener(v -> {           
            try {
                // Convert the selectedNumbers to a JSON-compatible format (array of strings)
                JSONArray jsonArray = new JSONArray();
                for (String number : selectedNumbers) {
                    jsonArray.put(number);
                }
        
                // Return the JSON array as a string
                Intent resultIntent = new Intent();
                resultIntent.putExtra("resultData", jsonArray.toString());
                setResult(Activity.RESULT_OK, resultIntent);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                finish();
            }
        });
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
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC");

        if (cursor != null) {
            while (cursor.moveToNext()) {
                try {
                    String name = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                    String phoneDisplay = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER));
                    String phone = phoneDisplay.replaceAll("[^0-9]", ""); // Normalize phone number
                    int type = cursor.getInt(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE));

                    JSONObject contact = new JSONObject();
                    contact.put("name", name);
                    contact.put("phone", phone);
                    contact.put("phonedisplay", phoneDisplay);
                    contact.put("type", type);

                    if (!containsPhoneNumber(allContacts, phone)) {
                        allContacts.add(contact);
                    }

                    checkBoxStates.put(phone, false); // Use the phone number as the key
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            cursor.close();
        }
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

        contactListView.setAdapter(new ContactListAdapter(filteredContacts));

        String contactsText = getIntent().getStringExtra("contactstext");
        listSizeTextView.setText(filteredContacts.size() + " " + contactsText);
    }

    private class ContactListAdapter extends android.widget.BaseAdapter {
        private ArrayList<JSONObject> contactList;
    
        public ContactListAdapter(ArrayList<JSONObject> contactList) {
            this.contactList = contactList;
        }
    
        @Override
        public int getCount() {
            return contactList.size();
        }
    
        @Override
        public JSONObject getItem(int position) {
            return contactList.get(position);
        }
    
        @Override
        public long getItemId(int position) {
            return position;
        }
    
        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            ViewHolder holder;
            if (convertView == null) {
                int layoutId = getResources().getIdentifier("activity_native_contact_list_selection_item", "layout", getPackageName());
                convertView = getLayoutInflater().inflate(layoutId, parent, false);

                holder = new ViewHolder();
                holder.nameTextView = convertView.findViewById(getResources().getIdentifier("contact_name", "id", getPackageName()));
                holder.phoneTextView = convertView.findViewById(getResources().getIdentifier("contact_phone", "id", getPackageName()));
                holder.checkBox = convertView.findViewById(getResources().getIdentifier("contact_checkbox", "id", getPackageName()));

                convertView.setTag(holder);
            } else {
                holder = (ViewHolder) convertView.getTag();
            }

            JSONObject contact = getItem(position);
            holder.nameTextView.setText(contact.optString("name"));
            holder.phoneTextView.setText(contact.optString("phonedisplay"));

            holder.checkBox.setOnCheckedChangeListener(null);
            holder.checkBox.setChecked(checkBoxStates.getOrDefault(contact.optString("phone"), false));

            holder.checkBox.setOnCheckedChangeListener((buttonView, isChecked) -> {
                String phoneNumber = contact.optString("phone");
                checkBoxStates.put(phoneNumber, isChecked);

                if (isChecked) {
                    if (!selectedNumbers.contains(phoneNumber)) {
                        selectedNumbers.add(phoneNumber);
                    }
                } else {
                    selectedNumbers.remove(phoneNumber);
                }

                updateSelectedContactsDisplay();
                addButton.setVisibility(selectedNumbers.isEmpty() ? View.GONE : View.VISIBLE);
            });

            return convertView;
        }
    }

    public void toggleCheckbox(View view) {
        // Find the CheckBox inside the view
        CheckBox checkBox = view.findViewById(getResources().getIdentifier("contact_checkbox", "id", getPackageName()));
    
        // Toggle the checkbox
        checkBox.setChecked(!checkBox.isChecked());
    }

    private void updateSelectedContactsDisplay() {
        selectedContactsContainer.removeAllViews();
    
        for (String number : selectedNumbers) {
            // Find the contact name associated with this number
            String name = "";
            for (JSONObject contact : allContacts) {
                if (contact.optString("phone").replaceAll("[^0-9]", "").equals(number)) {
                    name = contact.optString("name");
                    break;
                }
            }
    
            // Create a TextView for each selected contact
            TextView contactTextView = new TextView(this);
            contactTextView.setText(name);
            contactTextView.setPadding(8, 4, 8, 4);
            contactTextView.setBackgroundResource(android.R.drawable.dialog_holo_light_frame);
            contactTextView.setTextSize(14);
            contactTextView.setTextColor(getResources().getColor(android.R.color.black));
    
            // Add the TextView to the container
            selectedContactsContainer.addView(contactTextView);
        }
    
        // Show or hide the scroll view based on the selection count
        selectedContactsScrollView.setVisibility(selectedNumbers.isEmpty() ? View.GONE : View.VISIBLE);
    }

    private void updatePreselectionArray() {
        if (preSelectionArray == null) return;

        Boolean hasSelection = false;
    
        for (int i = 0; i < preSelectionArray.length(); i++) {
            String preselectedNumber = preSelectionArray.optString(i).replaceAll("[^0-9]", "");
            for (JSONObject contact : allContacts) {
                String phone = contact.optString("phone").replaceAll("[^0-9]", "");
                if (phone.equals(preselectedNumber)) {
                    checkBoxStates.put(phone, true);
                    if (!selectedNumbers.contains(phone)) {
                        selectedNumbers.add(phone);
                    }

                    hasSelection = true;
                }
            }
        }

        if(hasSelection == true)
        {
            updateSelectedContactsDisplay(); // Refresh UI
            contactListView.setAdapter(new ContactListAdapter(filteredContacts));
        }

    }

    static class ViewHolder {
        TextView nameTextView;
        TextView phoneTextView;
        CheckBox checkBox;
    }
}