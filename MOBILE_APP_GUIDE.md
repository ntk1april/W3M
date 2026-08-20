# W3M — Native Mobile App Guide (Capacitor)

> [!IMPORTANT]
> This app uses **Next.js server-side API routes** (Prisma, Supabase auth).  
> Capacitor wraps the app as a **WebView pointing to your server URL** — not a static build.

---

## How It Works

```
Android APK  →  Capacitor WebView  →  Your Next.js Server (deployed or local)
```

The `capacitor.config.ts` has `server.url` set. The native app just opens that URL in a full-screen WebView.

---

## Prerequisites

| Tool               | Install                                          |
| ------------------ | ------------------------------------------------ |
| **Android Studio** | [Download](https://developer.android.com/studio) |
| **JDK 17+**        | Bundled with Android Studio                      |
| **Node.js 20+**    | Already installed                                |

---

## Step 1 — Configure Server URL

Edit `capacitor.config.ts` depending on your environment:

### For Production (Vercel/Render)

```ts
server: {
  url: 'https://w-3m.vercel.app',
  androidScheme: 'https',
}
```

_(No local server required to run the app on the phone)_

### For Local Development (Emulator)

```ts
server: {
  url: 'http://10.0.2.2:3000',
  cleartext: true,
  androidScheme: 'http',
}
```

_(Requires running `npm run dev:android` so the emulator can reach the host)_

---

## Step 2 — Sync to Android Project

Whenever you change `capacitor.config.ts` or add new plugins:

```bash
npm run cap:sync
```

---

## Step 3 — Open and Run in Android Studio

```bash
npm run cap:open
```

This opens Android Studio with the `android/` folder as the project.

### Debug APK (for testing)

In Android Studio: Press the **Run (▶)** button at the top to launch on your selected emulator or connected device.

### Release APK (for distribution)

In Android Studio: Go to **Build → Generate Signed Bundle / APK**

---

## How to Change the App Icon

The icon and splash screens are generated from the source files in the `assets/` folder.

1. Replace `assets/icon.png` with your new logo (PNG, at least 1024x1024, square).
2. Run the icon generator:
   ```bash
   npx capacitor-assets generate --android
   ```
3. Sync changes to the Android project:
   ```bash
   npm run cap:sync
   ```
4. Open Android Studio (`npm run cap:open`), click **File → Sync Project with Gradle Files**, and run the app.

---

## Tips & Features

- **Pull-to-Refresh** works natively via touch events.
- **Dark mode** works natively via CSS media queries.
- If the app shows a blank screen, check that your `server.url` is reachable from the device (especially if testing locally).
- To test on a physical Android phone: enable **USB Debugging** in Developer Options.
