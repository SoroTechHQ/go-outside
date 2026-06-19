# iOS Browser Push Notifications PRD

## Problem

On iPhone browsers, tapping "Enable browser notifications" can appear to do nothing. The old flow only requested `Notification.permission` in parts of the UI and did not consistently create a Web Push subscription or save it to the backend.

On iOS, there is also a platform constraint: Web Push works for installed Home Screen web apps on supported iOS/iPadOS versions, not reliably from a normal Safari tab.

## Root Causes

1. iPhone Safari requires the site to be installed to the Home Screen for Web Push.
2. Permission must be requested from a direct user gesture.
3. A granted browser permission is not enough; the app must also create a `PushSubscription`.
4. The subscription must be saved to `/api/notifications/push-subscribe`.
5. The app needs a service worker and Web App Manifest.
6. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must be configured client-side.

## Built Implementation

1. Added a Web App Manifest at `apps/web/public/manifest.webmanifest`.
2. Linked it through Next metadata in `apps/web/app/layout.tsx`.
3. Added shared browser-push logic in `apps/web/lib/notifications/browser-push.ts`.
4. The helper now detects:
   - unsupported browsers
   - iPhone browser tabs that need Home Screen install
   - denied notification permission
   - missing VAPID public key
   - permission granted but no saved subscription
5. Updated `NotificationBell` to subscribe and save the device instead of only requesting permission.
6. Updated `SettingsClient` push toggle to use the same subscription flow.
7. UI now shows actionable iPhone install guidance instead of silently failing.

## Acceptance Criteria

1. Desktop browsers can enable push and save a subscription.
2. Supported Android browsers can enable push and save a subscription.
3. iPhone Safari tab shows Home Screen install guidance.
4. Installed iPhone Home Screen app can enable push on supported iOS versions.
5. The UI no longer treats permission alone as "active" unless a subscription exists.
6. Existing in-app notifications continue to work even when browser push is unsupported.

## User-Facing Copy

Unsupported iPhone tab:

> Notifications on iPhone work after installing GoOutside to your Home Screen. Tap Share, choose Add to Home Screen, then open GoOutside from the app icon and enable notifications again.

Missing VAPID key:

> Browser push is not configured yet. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` before enabling push notifications.

Denied:

> Notifications are blocked in this browser. Enable them in browser settings, then try again.
