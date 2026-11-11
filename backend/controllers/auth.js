const jwt      = require('jsonwebtoken');
const prisma   = require('../config/db');
const { supabase } = require('../config/supabase');

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Verify credentials via Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Look up profile in Supabase profiles table
  const profile = await prisma.profile.findFirst({ where: { email } });
  if (!profile) {
    return res.status(401).json({ error: 'Profile not found — please contact your administrator' });
  }

  // Issue our own JWT
  const token = jwt.sign(
    { userId: profile.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id:    profile.id,
      name:  profile.name,
      email: profile.email,
      role:  profile.role,
      title: profile.title,
      dept:  profile.dept,
    },
  });
}

// GET /api/auth/me
async function me(req, res) {
  const profile = await prisma.profile.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, title: true, dept: true, avatar: true, phone: true },
  });
  res.json(profile);
}

// POST /api/auth/logout
function logout(req, res) {
  res.json({ success: true });
}

module.exports = { login, me, logout };
