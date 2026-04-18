"use client";

type UpdateOnboardingProgressInput = {
  firstName?: string;
  lastName?: string;
  unsafeMetadata?: Record<string, unknown>;
};

export async function updateOnboardingProgress(input: UpdateOnboardingProgressInput) {
  const res = await fetch("/api/onboarding/progress", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  });

  if (res.ok) return;

  const body = await res.json().catch(() => ({})) as { error?: string };
  throw new Error(body.error ?? "Failed to update onboarding progress");
}
