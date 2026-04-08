const emojiRegex =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u200d\ufe0f]/u;

export function containsEmoji(value: string): boolean {
  return emojiRegex.test(value);
}

export function assertNoEmoji(value: string, fieldName: string): void {
  if (containsEmoji(value)) {
    throw new Error(`${fieldName} cannot contain emoji characters`);
  }
}
