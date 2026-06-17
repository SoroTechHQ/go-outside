/**
 * Build the URL for the AI chat page with a pre-filled prompt.
 * Used everywhere in the app that needs to hand off a search prompt to /ai.
 *
 * @param prompt  The natural-language query to pre-fill or auto-send
 * @param autosend When true, the AI page will send the prompt immediately
 */
export function aiSearchHref(prompt: string, autosend = true): string {
  const params = new URLSearchParams({ prompt });
  if (autosend) params.set("autosend", "1");
  return `/ai?${params.toString()}`;
}
