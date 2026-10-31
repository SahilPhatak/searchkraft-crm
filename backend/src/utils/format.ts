/** Format INR amounts as Cr / L / K */
export function fmtINR(amount: number): string {
  if (amount >= 1e7)  return `₹${(amount / 1e7).toFixed(2)}Cr`;
  if (amount >= 1e5)  return `₹${(amount / 1e5).toFixed(2)}L`;
  if (amount >= 1e3)  return `₹${(amount / 1e3).toFixed(1)}K`;
  return `₹${amount}`;
}

/** Pad user index to SK-0001 format */
export function formatUserId(index: number): string {
  return `SK-${String(index).padStart(4, '0')}`;
}
