export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
export function id(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{1,18}$/.test(value) ||
    BigInt(value) < 1n
  )
    fail("Invalid ID");
  return value;
}
export function text(
  value: unknown,
  label: string,
  max: number,
  optional = false,
): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!optional && !value.trim())
  )
    fail("Invalid " + label);
  return value.trim();
}
export function number(value: unknown, label: string, max = 1000000): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  )
    fail("Invalid " + label);
  return value;
}
