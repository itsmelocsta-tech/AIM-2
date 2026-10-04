package com.itsmelocsta.aim;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.webkit.JavaScriptReplyProxy;
import org.json.JSONArray;
import org.json.JSONObject;

/** AIM owns these alarms; never writes entries into the phone's Clock application. */
public final class ActivityAlarms {
    private static final String CHANNEL = "aim_activity_alarms_v1";
    private static final String PREFS = "aim_activity_alarms";
    private JavaScriptReplyProxy permissionReply;
    private String permissionId;
    private final Activity activity;
    public ActivityAlarms(Activity activity) { this.activity = activity; }
    private static SharedPreferences prefs(Context context) { return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private static boolean notificationsAllowed(Context context) {
        return (Build.VERSION.SDK_INT < 33 || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)
            && context.getSystemService(NotificationManager.class).areNotificationsEnabled();
    }
    private static boolean exactAllowed(Context context) {
        return Build.VERSION.SDK_INT < 31 || context.getSystemService(AlarmManager.class).canScheduleExactAlarms();
    }
    private static void channel(Context context) {
        NotificationChannel channel = new NotificationChannel(CHANNEL, "AIM activity alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Start and finish alerts for activities you agree to in AIM");
        channel.enableVibration(true);
        channel.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM),
            new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_ALARM).build());
        context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    private static void reply(JavaScriptReplyProxy proxy, String id, boolean ready, String message) {
        try { proxy.postMessage(new JSONObject().put("id", id).put("ready", ready).put("message", message).toString()); } catch (Exception ignored) {}
    }
    public void handle(JSONObject data, JavaScriptReplyProxy proxy) {
        String id = data.optString("id"), action = data.optString("action");
        if (id.length() > 100) return;
        try {
            if ("permissions".equals(action)) {
                channel(activity);
                if (permissionReply != null) { reply(proxy, id, false, "Finish the current permission request, then retry."); return; }
                if (Build.VERSION.SDK_INT >= 33 && activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    permissionReply = proxy; permissionId = id;
                    activity.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 810);
                    return;
                }
                finishPermissions(proxy, id);
            } else if ("replace".equals(action)) {
                JSONArray input = data.optJSONArray("alarms");
                if (input == null || input.length() > 200) throw new IllegalArgumentException();
                JSONArray validated = new JSONArray();
                for (int i = 0; i < input.length(); i++) {
                    JSONObject alarm = input.getJSONObject(i);
                    if (alarm.getString("key").length() > 500 || alarm.getString("title").length() > 1000
                        || !("start".equals(alarm.getString("kind")) || "end".equals(alarm.getString("kind")))) throw new IllegalArgumentException();
                    long at = alarm.getLong("at");
                    if (at > System.currentTimeMillis() && at < System.currentTimeMillis() + 366L * 86400000L) validated.put(alarm);
                }
                replace(activity, validated);
                boolean ready = validated.length() == 0 || (notificationsAllowed(activity) && exactAllowed(activity));
                reply(proxy, id, ready, validated.length() == 0 ? "No upcoming alarms." : ready ? "Start and finish alarms are set. AIM can be closed." : "Alarms are waiting for permission. Tap set alarms after allowing notifications and Alarms & reminders.");
            }
        } catch (Exception error) {
            try { proxy.postMessage(new JSONObject().put("id", id).put("error", "Could not schedule alarms. Please retry.").toString()); } catch (Exception ignored) {}
        }
    }
    private void finishPermissions(JavaScriptReplyProxy proxy, String id) {
        if (!notificationsAllowed(activity)) {
            reply(proxy, id, false, "Allow AIM notifications in Android app settings, then tap set alarms again.");
        } else if (!exactAllowed(activity)) {
            reply(proxy, id, false, "Allow Alarms & reminders for AIM, then return and tap set alarms again.");
            activity.startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + activity.getPackageName())));
        } else reply(proxy, id, true, "Alarm permissions ready.");
    }
    public void onPermissionResult(int requestCode) {
        if (requestCode != 810 || permissionReply == null) return;
        JavaScriptReplyProxy proxy = permissionReply; String id = permissionId;
        permissionReply = null; permissionId = null; finishPermissions(proxy, id);
    }
    private static PendingIntent intent(Context context, String key) {
        Intent intent = new Intent(context, ActivityAlarmReceiver.class);
        intent.setData(Uri.parse("aim-alarm://activity/" + Uri.encode(key)));
        intent.putExtra("key", key);
        return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static JSONArray saved(Context context) {
        try { return new JSONArray(prefs(context).getString("queue", "[]")); } catch (Exception error) { return new JSONArray(); }
    }
    public static synchronized void replace(Context context, JSONArray alarms) throws Exception {
        AlarmManager manager = context.getSystemService(AlarmManager.class);
        NotificationManager notifications = context.getSystemService(NotificationManager.class);
        for (int i = 0; i < saved(context).length(); i++) {
            String key = saved(context).getJSONObject(i).getString("key");
            manager.cancel(intent(context, key));
            notifications.cancel(key, 1);
        }
        // Clear dismissed/delivered alerts as well on sign-out or activity cancellation.
        notifications.cancelAll();
        if (!prefs(context).edit().putString("queue", alarms.toString()).commit()) throw new IllegalStateException("Could not save alarm queue");
        restore(context);
    }
    public static synchronized void restore(Context context) {
        channel(context);
        if (!notificationsAllowed(context) || !exactAllowed(context)) return;
        JSONArray alarms = saved(context);
        for (int i = 0; i < alarms.length(); i++) try {
            JSONObject alarm = alarms.getJSONObject(i); long at = alarm.getLong("at");
            if (at <= System.currentTimeMillis()) continue;
            PendingIntent show = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            context.getSystemService(AlarmManager.class).setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), intent(context, alarm.getString("key")));
        } catch (Exception ignored) { /* Permission may have been revoked while restoring. */ }
    }
    public static synchronized void fire(Context context, String key) {
        JSONObject due = null; JSONArray remaining = new JSONArray();
        JSONArray queue = saved(context);
        for (int i = 0; i < queue.length(); i++) try {
            JSONObject alarm = queue.getJSONObject(i);
            if (key.equals(alarm.getString("key"))) due = alarm; else remaining.put(alarm);
        } catch (Exception ignored) {}
        if (due == null) return; // Canceled or already delivered.
        prefs(context).edit().putString("queue", remaining.toString()).commit();
        long at = due.optLong("at");
        if (System.currentTimeMillis() < at || System.currentTimeMillis() - at > 60000 || !notificationsAllowed(context)) return;
        channel(context);
        PendingIntent open = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new Notification.Builder(context, CHANNEL)
            .setSmallIcon(com.itsmelocsta.aim.R.drawable.ic_aim)
            .setContentTitle("start".equals(due.optString("kind")) ? "Time to start" : "Time to wrap up")
            .setContentText(due.optString("title"))
            .setCategory(Notification.CATEGORY_ALARM).setAutoCancel(true).setContentIntent(open)
            .setVisibility(Notification.VISIBILITY_PRIVATE).build();
        context.getSystemService(NotificationManager.class).notify(key, 1, notification);
    }
}
