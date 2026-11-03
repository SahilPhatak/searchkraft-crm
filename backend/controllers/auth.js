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

  // Look up user in our DB
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Account not found or inactive' });
  }

  // Issue our own JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({
    token,
    user: {
      id:         user.id,
      uid:        user.uid,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      title:      user.title,
      department: user.department,
    },
  });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, uid: true, name: true, email: true, role: true, title: true, department: true, avatarUrl: true },
  });
  res.json(user);
}

// POST /api/auth/logout
function logout(req, res) {
  res.json({ success: true });
}

module.exports = { login, me, logout };
