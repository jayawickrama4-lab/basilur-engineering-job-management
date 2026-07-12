# Shared Database Setup

The app is hosted on GitHub Pages. To let more than one person update the same data, connect it to a small shared database.

## Recommended Simple Option: Firebase Realtime Database

1. Go to https://console.firebase.google.com/
2. Create a Firebase project.
3. Open **Build** > **Realtime Database**.
4. Click **Create Database**.
5. Choose a location.
6. Start in test mode first.
7. Copy your database URL.

The URL normally looks like this:

```text
https://your-project-name-default-rtdb.firebaseio.com/basilur-engineering.json
```

Use the `/basilur-engineering.json` ending for this app.

## Add The URL In The App

1. Open the Basilur Engineering app.
2. Go to **Master Data**.
3. Find **Shared Database**.
4. Paste the Firebase database URL.
5. Click **Save URL**.
6. Click **Save Shared Data**.

After that, another user can open the app, paste the same URL, and click **Load Shared Data**.

## Completed Jobs

When a job is marked **Completed**, the app removes that job from the active job list.

When the shared database URL is connected, the app also saves the smaller active list back to the database. This keeps the shared database small because completed jobs are not kept there.

## Important

This is a simple shared database. It is not a full secure login system yet.

For real company use, the next version should add:

- user login
- role permissions
- automatic save after every update
- proper document storage
- audit history
