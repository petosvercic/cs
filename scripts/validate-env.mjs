const isEnabled = (name) => (process.env[name] ?? "false").toLowerCase() === "true";

const alwaysRequired = ["NEXT_PUBLIC_APP_URL"];
const paymentsRequired = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "STRIPE_PUBLISHABLE_KEY",
];

const required = [...alwaysRequired, ...(isEnabled("PAYMENTS_ENABLED") ? paymentsRequired : [])];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error("[env] Missing required environment variables:");
  missing.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

if (isEnabled("PAYMENTS_ENABLED")) {
  console.log("[env] payments enabled: required Stripe variables are present");
} else {
  console.log("[env] payments disabled: Stripe variables are optional");
}

if (isEnabled("TELEMETRY_ENABLED")) {
  console.log("[env] telemetry enabled: no additional required server env");
} else {
  console.log("[env] telemetry disabled");
}

console.log("[env] validation passed");
