export function numberFormat(input: number | string): string {
  const n = typeof input === "string" ? parseInt(input) : input;
  if (isNaN(n)) {
    return input.toString();
  } else {
    return new Intl.NumberFormat().format(n);
  }
}
