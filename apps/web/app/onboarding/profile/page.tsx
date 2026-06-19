"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { saveOnboardingDraft, getOnboardingDraft } from "@/lib/cookies";
import { updateOnboardingProgress } from "@/lib/onboarding-progress";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircle } from "@phosphor-icons/react";
import { LocationAutocomplete, type PlaceResult } from "../../../components/ui/LocationAutocomplete";
import { DateOfBirthPicker } from "../../../components/ui/DateOfBirthPicker";

const MIN_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0]!;
})();
const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split("T")[0]!;
})();

const schema = z.object({
  first_name:    z.string().min(1, "Required"),
  last_name:     z.string().min(1, "Required"),
  username:      z.string().min(2, "Min 2 characters").max(30).regex(/^[a-z0-9._]+$/, "Lowercase letters, numbers, . and _ only").optional().or(z.literal("")),
  phone:         z.string().optional().or(z.literal("")),
  date_of_birth: z.string().min(1, "Date of birth is required").refine((v) => {
    const d = v;
    return d >= MIN_DOB && d <= MAX_DOB;
  }, "You must be at least 13 years old to use GoOutside"),
  location:   z.object({
    place_id:          z.string(),
    city_name:         z.string().min(1, "Required"),
    region:            z.string(),
    country:           z.string(),
    formatted_address: z.string(),
    lat:               z.number(),
    lng:               z.number(),
  }, { required_error: "Please select your city" }).nullable().refine(
    (v) => v !== null && v.city_name.length > 0,
    "Please select your city"
  ),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-[12px] border border-[var(--ob-input-border)] bg-[var(--ob-input-bg)] px-4 py-3 text-[14px] text-[var(--ob-input-text)] placeholder-[var(--ob-input-placeholder)] outline-none transition focus:border-[var(--ob-input-focus-border)] focus:ring-1 focus:ring-[var(--ob-input-focus-ring)]";

const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ob-label)]";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(true);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name:    "",
      last_name:     "",
      username:      "",
      phone:         "",
      date_of_birth: "",
      location:      null,
    },
  });

  // Check if this Clerk session belongs to an existing account signed in via a
  // different auth method (e.g. OAuth with the same email as a password account).
  // If so, adopt the existing profile and skip onboarding.
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/auth/recover-account", { method: "POST" })
      .then((r) => r.json())
      .then((body: { recovered?: boolean; wasComplete?: boolean; alreadyComplete?: boolean }) => {
        if (body.alreadyComplete || (body.recovered && body.wasComplete)) {
          window.location.href = "/home";
        } else {
          setRecovering(false);
        }
      })
      .catch(() => setRecovering(false));
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const draft = getOnboardingDraft();
    reset({
      first_name:    draft.profile?.first_name    ?? user.firstName ?? "",
      last_name:     draft.profile?.last_name     ?? user.lastName  ?? "",
      username:      draft.profile?.username      ?? (user.username ?? "").toLowerCase(),
      phone:         draft.profile?.phone         ?? user.phoneNumbers?.[0]?.phoneNumber ?? "",
      date_of_birth: draft.profile?.date_of_birth ?? "",
      location:      draft.profile?.location ?? null,
    });
  }, [isLoaded, user, reset]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const loc = values.location as PlaceResult;
      const payload = {
        first_name:          values.first_name,
        last_name:           values.last_name,
        username:            values.username,
        phone:               values.phone,
        date_of_birth:       values.date_of_birth,
        location_city:       loc.city_name,
        location_city_name:  loc.city_name,
        location_region:     loc.region,
        location_country:    loc.country,
        location_formatted:  loc.formatted_address,
        location_place_id:   loc.place_id,
        location_source:     "onboarding",
        ...(loc.lat && loc.lng
          ? { location_lat: loc.lat, location_lng: loc.lng }
          : {}),
      };

      const res = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Session expired — please refresh and try again.");
        throw new Error(body?.error ?? `Something went wrong (${res.status}). Please try again.`);
      }

      saveOnboardingDraft({
        profile: {
          first_name:    values.first_name,
          last_name:     values.last_name,
          username:      values.username,
          phone:         values.phone,
          date_of_birth: values.date_of_birth,
          city:          values.location?.city_name,
          location:      values.location,
        },
      });

      await updateOnboardingProgress({
        firstName: values.first_name,
        lastName:  values.last_name,
        unsafeMetadata: {
          ...(user?.unsafeMetadata ?? {}),
          onboardingStep: 2,
        },
      });

      router.push("/onboarding/vibe");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  if (!isLoaded || recovering) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--ob-progress-track)] border-t-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--ob-stat-bg)", border: "1px solid var(--ob-stat-border)" }}
          >
            <UserCircle size={36} weight="regular" style={{ color: "var(--ob-text-muted)" }} />
          </div>
          <div className="text-center">
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ color: "var(--ob-heading)" }}
            >
              Is this you?
            </h1>
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--ob-text-muted)" }}>
              Confirm your details before we personalise your experience
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First name</label>
              <input {...register("first_name")} className={inputCls} placeholder="Kwame" />
              {errors.first_name && (
                <p className="mt-1 text-[11px] text-red-400">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input {...register("last_name")} className={inputCls} placeholder="Mensah" />
              {errors.last_name && (
                <p className="mt-1 text-[11px] text-red-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Username</label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px]"
                style={{ color: "var(--ob-text-faint)" }}
              >
                @
              </span>
              <input
                {...register("username")}
                className={`${inputCls} pl-8`}
                placeholder="kwame.mensah"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-[11px] text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>
              Phone{" "}
              <span className="normal-case" style={{ color: "var(--ob-text-faint)" }}>
                (optional)
              </span>
            </label>
            <input {...register("phone")} type="tel" className={inputCls} placeholder="+233 XX XXX XXXX" />
          </div>

          <div>
            <label className={labelCls}>Date of birth</label>
            <Controller
              name="date_of_birth"
              control={control}
              render={({ field }) => (
                <DateOfBirthPicker
                  value={field.value}
                  onChange={field.onChange}
                  minYear={new Date().getFullYear() - 120}
                  maxYear={new Date().getFullYear() - 13}
                />
              )}
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-[11px] text-red-400">{errors.date_of_birth.message}</p>
            )}
            <p className="mt-1 text-[11px]" style={{ color: "var(--ob-text-faint)" }}>
              Used to verify your age for 18+ events. Not shown publicly.
            </p>
          </div>

          <div>
            <label className={labelCls}>Your city</label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value as PlaceResult | null}
                  onChange={field.onChange}
                  placeholder="Search for your city…"
                  showShortcuts
                />
              )}
            />
            {errors.location && (
              <p className="mt-1 text-[11px] text-red-400">
                {errors.location.message ?? "Please select your city"}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition disabled:opacity-50 active:scale-[0.98]"
            style={{ background: "var(--brand)", boxShadow: "0 4px 16px rgba(47,143,69,0.22)" }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : (
              "Looks good →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
