import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createUser, findUserByEmail, getDbMode } from './storage.js';

export const seedAdmin = async () => {
  try {
    if (getDbMode() === 'memory') {
      const existing = await findUserByEmail(process.env.ADMIN_EMAIL || 'admin@crm.com');
      if (existing) return;
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await createUser({
        email: process.env.ADMIN_EMAIL || 'admin@crm.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin seeded in memory mode');
      return;
    }

    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) return;

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@crm.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin seeded');
  } catch (error) {
    console.error('Seed admin error:', error);
  }
};
