export {};

declare global {
  interface CustomJwtSessionClaims {
    role?: "admin" | "organizer" | "attendee";
  }
}
