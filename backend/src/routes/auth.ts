import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // In production: verify via Supabase Auth, then look up user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({
    token,
    user: { id: user.id, uid: user.uid, name: user.name, email: user.email, role: user.role, title: user.title, department: user.department }
  });
});

export default router;
