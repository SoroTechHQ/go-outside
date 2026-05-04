import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:hello@gooutside.com";
  if (!pub || !priv) return;
  webpush.setVapidDetails(email, pub, priv);
  configured = true;
}

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  ensureConfigured();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
