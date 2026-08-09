/** Random numeric string of fixed length (default 5 digits, e.g. `48291`). */
export function randomNumericCode(length = 5): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/** `AUTOTEST Category 48291` — unique autotest label with a short numeric suffix. */
export function autotestLabel(prefix: string, codeLength = 5): string {
  return `${prefix} ${randomNumericCode(codeLength)}`;
}
