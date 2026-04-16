"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { GHANA_CITIES } from "../../../../lib/onboarding-utils";

const schema = z.object({
  first_name:    z.string().min(1, "Required"),
  last_name:     z.string().min(1, "Required"),
  username:      z.string().min(2, "Min 2 characters").max(30).regex(/^[a-z0-9._]+$/, "Lowercase letters, numbers, . and _ only").optional().or(z.literal("")),
  phone:         z.string().optional().or(z.literal("")),
  location_city: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-[12px] border border-[rgba(95,191,42,0.12)] bg-[#131A13] px-4 py-3 text-[14px] text-[#F5FFF0] placeholder-[#3a5a3a] outline-none transition focus:border-[rgba(95,191,42,0.4)] focus:ring-1 focus:ring-[rgba(95,191,42,0.1)]";

const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#4A6A4A]";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name:    "",
      last_name:     "",
      username:      "",
      phone:         "",
      location_city: "Accra",
    },
  });

  // Pre-fill from Clerk user once loaded
  useEffect(() => {
    if (!isLoaded || !user) return;
    reset({
      first_name:    user.firstName ?? "",
      last_name:     user.lastName  ?? "",
      username:      (user.username ?? "").toLowerCase(),
      phone:         user.phoneNumbers?.[0]?.phoneNumber ?? "",
      location_city: "Accra",
    });
  }, [isLoaded, user, reset]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save profile");

      // Advance Clerk metadata
      await user?.update({
        firstName: values.first_name,
        lastName:  values.last_name,
        username:  values.username || undefined,
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          onboardingStep: 2,
        },
      });

      router.push("/onboarding/vibe");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100svh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5FBF2A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-[rgba(95,191,42,0.3)]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#152a1a] ring-2 ring-[rgba(95,191,42,0.3)]">
                <span
                  className="text-[28px] font-bold text-[#5FBF2A]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {(user?.firstName?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="text-center">
            <h1
              className="text-[28px] font-normal italic text-[#F5FFF0]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Is this you?
            </h1>
            <p className="mt-1 text-[14px] font-light text-[#6B8C6B]">
              Confirm your details before we personalise your experience
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name row */}
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

          {/* Username */}
          <div>
            <label className={labelCls}>Username</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-[#3a5a3a]">
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

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone <span className="text-[#3a5a3a] normal-case">(optional)</span></label>
            <input {...register("phone")} type="tel" className={inputCls} placeholder="+233 XX XXX XXXX" />
          </div>

          {/* City */}
          <div>
            <label className={labelCls}>Your city</label>
            <select
              {...register("location_city")}
              className={`${inputCls} cursor-pointer appearance-none`}
            >
              {GHANA_CITIES.map((c) => (
                <option key={c} value={c} className="bg-[#131A13]">
                  {c}
                </option>
              ))}
            </select>
            {errors.location_city && (
              <p className="mt-1 text-[11px] text-red-400">{errors.location_city.message}</p>
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
            className="mt-2 flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#5FBF2A] text-[14px] font-bold text-[#020702] shadow-[0_0_18px_rgba(95,191,42,0.25)] transition disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#020702] border-t-transparent" />
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
