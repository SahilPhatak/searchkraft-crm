// Format INR amounts compactly: ₹1.00Cr, ₹4.13L, ₹50K
function fmtINR(amount) {
  const n = Number(amount) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
}

// Format user ID: SK-0001, SK-0002...
function formatUserId(index) {
  return `SK-${String(index).padStart(4, '0')}`;
}

// Get YYYY-MM-DD for today
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Indian FY start year (Apr–Mar)
function fyStartYear(date = new Date()) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

module.exports = { fmtINR, formatUserId, today, fyStartYear };
