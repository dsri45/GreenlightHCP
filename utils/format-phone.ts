/** Format digits as +1 (555) 000-0000 while typing. */
export function formatUsPhoneDisplay(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';

  const normalized =
    digits.length === 10 && !digits.startsWith('1') ? `1${digits}` : digits;
  const n = normalized.startsWith('1') ? normalized.slice(0, 11) : `1${normalized}`.slice(0, 11);

  const area = n.slice(1, 4);
  const prefix = n.slice(4, 7);
  const line = n.slice(7, 11);

  if (n.length <= 1) return '+1';
  if (n.length <= 4) return `+1 (${area}`;
  if (n.length <= 7) return `+1 (${area}) ${prefix}`;
  return `+1 (${area}) ${prefix}-${line}`;
}

/** Digits-only phone for storage (E.164-style with leading +). */
export function phoneToE164(formatted: string): string | undefined {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length < 10) return undefined;
  const normalized = digits.length === 10 ? `1${digits}` : digits;
  return `+${normalized}`;
}
