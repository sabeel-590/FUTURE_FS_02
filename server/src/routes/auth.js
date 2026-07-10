import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createUser, findUserByEmail, getDbMode, setDbMode } from '../utils/storage.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = null;

    if (getDbMode() === 'memory') {
      user = await findUserByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    } else {
      user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '7d' });

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/seed', async (_req, res) => {
  const defaultEmail = process.env.ADMIN_EMAIL || 'admin@crm.com';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  await createUser({ email: defaultEmail, password: hashedPassword, role: 'admin' });
  res.json({ ok: true });
});

export default router;
