/**
 * Converts raw Postgres/Supabase errors into safe, user-friendly messages.
 * Never expose constraint names, SQL, or internal error codes to the client.
 */
export interface DbError {
  code?: string;
  message?: string;
  details?: string;
}

export function humanizeDbError(err: DbError): { message: string; status: number } {
  if (err.code === "23505") {
    const msg = (err.message ?? "").toLowerCase();
    if (msg.includes("email")) {
      return {
        message: "An account with that email already exists. Try signing in instead.",
        status: 409,
      };
    }
    if (msg.includes("username")) {
      return {
        message: "That username is already taken. Choose a different one to continue.",
        status: 409,
      };
    }
    if (msg.includes("phone")) {
      return {
        message: "That phone number is already linked to another account.",
        status: 409,
      };
    }
    return {
      message: "Some of your details are already in use. Please review and try again.",
      status: 409,
    };
  }

  if (err.code === "23503") {
    return { message: "Something went wrong saving your profile. Please try again.", status: 500 };
  }

  if (err.code === "42501") {
    return { message: "Permission denied. Please sign out and sign back in.", status: 403 };
  }

  return { message: "Something went wrong. Please try again.", status: 500 };
}
