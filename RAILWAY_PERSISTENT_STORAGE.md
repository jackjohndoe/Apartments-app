# 🚀 2-Minute Guide: Fix Image Storage on Railway

Follow these 2 simple steps to make sure your uploaded images don't disappear.

---

## Step 1: Add the Volume (The "Hard Drive")

1.  **Open Railway**: Go to your dashboard at [railway.app](https://railway.app).
2.  **Click your Project**: Open the project containing your backend.
3.  **Click your Service**: Click on the box named **`booking-backend`**.
4.  **Find "Volumes"**:
    *   Look for a tab labeled **Volumes** at the top.
    *   *If you don't see it:* Right-click the `booking-backend` box on the canvas and choose **Volume**.
5.  **Create Volume**:
    *   Click the **"New Volume"** or **"+"** button.
    *   You will see a box asking for a "Mount Path".
6.  **Enter Mount Path**:
    *   Type exactly: `/app/uploads`
    *   Click **Add** (or Enter).

✅ **Result**: You should see a volume attached to your service pointing to `/app/uploads`.

---

## Step 2: Set the Variable (The "Config")

1.  **Stay on `booking-backend`**: Make sure you still have the backend service open.
2.  **Click "Variables"**: Click the **Variables** tab at the top.
3.  **Add a New Variable**:
    *   Click **New Variable**.
    *   **VARIABLE_NAME**: Type `STORAGE_BASE_PATH`
    *   **VALUE**: Type `/app/uploads`
    *   Click **Add**.

✅ **Result**: The list should now show `STORAGE_BASE_PATH` = `/app/uploads`.

---

## Step 3: Finish

Railway will automatically restart your app. Once it turns **Green** (Active) again:
1.  Open your mobile app.
2.  Upload a photo.
3.  It is now saved forever (until you delete it)!
