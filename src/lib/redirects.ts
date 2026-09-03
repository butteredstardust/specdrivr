export function getSafeInternalPath(value: string | null, fallback = '/'): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return fallback;
  }

  return value;
}
