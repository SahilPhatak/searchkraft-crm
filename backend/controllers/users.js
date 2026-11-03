const prisma = require('../config/db');
const { supabase } = require('../config/supabase');

// GET /api/users  (admin/manager only)
async function getUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, uid: true, name: true, email: true, role: true, title: true, department: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

// GET /api/users/:id
async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, uid: true, name: true, email: true, role: true, title: true, department: true, isActive: true, avatarUrl: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

// POST /api/users  (admin only — creates Supabase auth user + DB record)
async function createUser(req, res) {
  const { name, email, password, role, title, department } = req.body;

  // Create auth user in Supabase
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name },
  });
  if (error) return res.status(400).json({ error: error.message });

  const user = await prisma.user.create({
    data: { supabaseId: data.user.id, name, email, role: role || 'member', title, department },
  });
  res.status(201).json(user);
}

// PUT /api/users/:id
async function updateUser(req, res) {
  // Non-admins can only update their own profile
  if (req.user.role !== 'ADMIN' && req.params.id !== req.user.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const { name, title, department, avatarUrl, isActive, role } = req.body;
  const data = { name, title, department, avatarUrl };
  // Only admin can change role / active status
  if (req.user.role === 'ADMIN') {
    if (isActive !== undefined) data.isActive = isActive;
    if (role)                   data.role      = role;
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json(user);
}

module.exports = { getUsers, getUser, createUser, updateUser };
