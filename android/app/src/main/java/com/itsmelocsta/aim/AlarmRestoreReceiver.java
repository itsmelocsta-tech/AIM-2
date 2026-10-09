package com.itsmelocsta.aim;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
public class AlarmRestoreReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) { ActivityAlarms.restore(context); }
}
