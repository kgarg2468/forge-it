import type { ActionRisk } from "./enums.js";

// Classify a Composio tool slug (UPPER_SNAKE_CASE) by risk, per PRD §12.2.
// High-risk actions default to demo-safe mode (simulated) unless explicitly run live.

const HIGH_RISK_PATTERNS = [
  /SEND_EMAIL/,
  /REFUND/,
  /DELETE/,
  /REMOVE/,
  /CHARGE/,
  /CAPTURE/,
  /PAYOUT/,
  /CANCEL/,
  /INVITE/,
  /CREATE_PAYMENT/,
  /UPDATE_PAYMENT/,
  /TRANSFER/,
];

const MEDIUM_RISK_PATTERNS = [
  /SEND/, // e.g. SLACK_SENDS_A_MESSAGE
  /CREATE/,
  /UPDATE/,
  /POST/,
  /DRAFT/,
  /ADD/,
  /SET/,
];

export function classifyActionRisk(slug: string): ActionRisk {
  const s = slug.toUpperCase();
  if (HIGH_RISK_PATTERNS.some((re) => re.test(s))) return "high";
  if (MEDIUM_RISK_PATTERNS.some((re) => re.test(s))) return "medium";
  return "low";
}

export function isHighRisk(slug: string): boolean {
  return classifyActionRisk(slug) === "high";
}
