export type BrowserPushResult =
  | { ok: true; status: "subscribed" | "already_subscribed"; message: string }
  | { ok: false; status: "unsupported" | "ios_install_required" | "denied" | "missing_vapid_key" | "failed"; message: string };

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function getBrowserPushReadiness(): BrowserPushResult | null {
  if (typeof window === "undefined") return null;

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (isIOS() && !isStandaloneDisplay()) {
      return {
        ok: false,
        status: "ios_install_required",
        message: "Notifications on iPhone work after installing GoOutside to your Home Screen. Tap Share, choose Add to Home Screen, then open GoOutside from the app icon and enable notifications again.",
      };
    }

    return {
      ok: false,
      status: "unsupported",
      message: "This browser does not support web push notifications.",
    };
  }

  if (isIOS() && !isStandaloneDisplay()) {
    return {
      ok: false,
      status: "ios_install_required",
      message: "Notifications on iPhone work after installing GoOutside to your Home Screen. Tap Share, choose Add to Home Screen, then open GoOutside from the app icon and enable notifications again.",
    };
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return {
      ok: false,
      status: "missing_vapid_key",
      message: "Browser push is not configured yet. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY before enabling push notifications.",
    };
  }

  return null;
}

export async function enableBrowserPush(): Promise<BrowserPushResult> {
  const readiness = getBrowserPushReadiness();
  if (readiness) return readiness;

  if (Notification.permission === "denied") {
    return {
      ok: false,
      status: "denied",
      message: "Notifications are blocked in this browser. Enable them in browser settings, then try again.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

    if (permission !== "granted") {
      return {
        ok: false,
        status: "denied",
        message: "Notifications were not enabled. Allow browser notifications to receive alerts.",
      };
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing);
      return { ok: true, status: "already_subscribed", message: "Browser notifications are active." };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
    });

    await saveSubscription(subscription);
    return { ok: true, status: "subscribed", message: "Browser notifications are active." };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message: error instanceof Error ? error.message : "Could not enable browser notifications.",
    };
  }
}

export async function getSavedBrowserPushState(): Promise<BrowserPushResult> {
  const readiness = getBrowserPushReadiness();
  if (readiness) return readiness;

  if (Notification.permission === "denied") {
    return {
      ok: false,
      status: "denied",
      message: "Notifications are blocked in this browser. Enable them in browser settings, then try again.",
    };
  }

  if (Notification.permission !== "granted") {
    return {
      ok: false,
      status: "failed",
      message: "Enable browser notifications to get updates when you're away.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return {
        ok: false,
        status: "failed",
        message: "Notifications are allowed, but this device is not subscribed yet. Tap Enable Notifications to finish setup.",
      };
    }

    return { ok: true, status: "already_subscribed", message: "Browser notifications are active." };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message: error instanceof Error ? error.message : "Could not check browser notification setup.",
    };
  }
}

async function saveSubscription(subscription: PushSubscription) {
  const res = await fetch("/api/notifications/push-subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });

  if (!res.ok) {
    throw new Error("Could not save this device for push notifications.");
  }
}
