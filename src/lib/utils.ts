export const money = (value: number) =>
  new Intl.NumberFormat("en-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
export const shipping_fee = (subtotal: number) =>
  subtotal === 0 || subtotal >= 3000 ? 0 : 60;
export const uid = (prefix: string) =>
  prefix + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
