const prisma = require('../config/db');
const { supabase } = require('../config/supabase');

// GET /api/users  (admin/manager only)
async function getUsers(req, res) {
  const users = await prisma.profile.findMany({
    select: { id: true, name: true, email: true, role: true, title: true, dept: true, status: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

// GET /api/users/:id
async function getUser(req, res) {
  const user = await prisma.profile.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, title: true, dept: true, status: true, avatar: true, phone: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

// POST /api/users  (admin only — creates Supabase auth user; profile is created by trigger)
async function createUser(req, res) {
  const { name, email, password, role } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, role: role || 'User' },
  });
  if (error) return res.status(400).json({ error: error.message });

  // Profile row is created automatically by the handle_new_user trigger
  res.status(201).json({ id: data.user.id, email, name, role: role || 'User' });
}

// PUT /api/users/:id
async function updateUser(req, res) {
  if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin' && req.params.id !== req.user.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const { name, title, dept, avatar, phone, status, role } = req.body;
  const data = {};
  if (name)   data.name   = name;
  if (title)  data.title  = title;
  if (dept)   data.dept   = dept;
  if (avatar) data.avatar = avatar;
  if (phone)  data.phone  = phone;
  // Only admin can change role / status
  if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
    if (status) data.status = status;
    if (role)   data.role   = role;
  }
  const user = await prisma.profile.update({ where: { id: req.params.id }, data });
  res.json(user);
}

module.exports = { getUsers, getUser, createUser, updateUser };
