package app.internal;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

public class NativeScreenActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Dynamically load layout resource without using R
        int layoutId = getResources().getIdentifier("activity_native_screen", "layout", getPackageName());
        setContentView(layoutId);

        // Get the intent message and display it in a TextView
        String message = getIntent().getStringExtra("message");

        // Find TextView and Button by their IDs dynamically
        int textViewId = getResources().getIdentifier("messageTextView", "id", getPackageName());
        TextView textView = findViewById(textViewId);
        textView.setText(message);

        int buttonId = getResources().getIdentifier("closeButton", "id", getPackageName());
        Button closeButton = findViewById(buttonId);
        
        // Set up the button click listener
        closeButton.setOnClickListener(view -> {
            Intent resultIntent = new Intent();
            resultIntent.putExtra("resultData", "Data from Android native screen");
            setResult(Activity.RESULT_OK, resultIntent);
            finish();
        });
    }
}