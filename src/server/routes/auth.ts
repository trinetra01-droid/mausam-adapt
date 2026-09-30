import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { UserPersona, UserRecord } from '../types.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'trinetra_mausam_adapt_secure_token_secret';

export interface AuthRequest extends Request {
  user?: UserRecord;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    next();
  }
}

// User Registration
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, language = 'en', units = 'METRIC', personas = ['FITNESS', 'COMMUTER'] } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check duplicate
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'User with this email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db.query(
      `INSERT INTO users (id, email, password_hash, name, language, units)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email.toLowerCase(), passwordHash, name, language, units]
    );

    await db.query(
      `INSERT INTO user_profiles (user_id, personas)
       VALUES ($1, $2)`,
      [userId, JSON.stringify(personas)]
    );

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), name, language, units, personas },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        language,
        units,
        personas
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Registration error: ${err.message}` });
  }
});

// User Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profRes = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
    const personas: UserPersona[] = profRes.rows[0]?.personas || ['FITNESS', 'COMMUTER'];

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, language: user.language, units: user.units, personas },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        units: user.units,
        personas
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Login error: ${err.message}` });
  }
});

// Get Current User Profile
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userRes = await db.query('SELECT id, email, name, language, timezone, units, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const profRes = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.user.id]);

    const user = userRes.rows[0];
    const profile = profRes.rows[0] || {};

    res.json({
      ...user,
      personas: profile.personas || ['FITNESS', 'COMMUTER'],
      home_location_id: profile.home_location_id,
      work_location_id: profile.work_location_id,
      farm_location_id: profile.farm_location_id,
      preferences: profile.preferences || {}
    });
  } catch (err: any) {
    res.status(500).json({ error: `Profile error: ${err.message}` });
  }
});

// Update Profile & Personas
authRouter.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { name, language, units, personas, home_location_id, work_location_id, farm_location_id } = req.body;

    if (name || language || units) {
      await db.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          language = COALESCE($2, language),
          units = COALESCE($3, units),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [name, language, units, req.user.id]
      );
    }

    if (personas || home_location_id || work_location_id || farm_location_id) {
      await db.query(
        `UPDATE user_profiles SET
          personas = COALESCE($1, personas),
          home_location_id = COALESCE($2, home_location_id),
          work_location_id = COALESCE($3, work_location_id),
          farm_location_id = COALESCE($4, farm_location_id),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5`,
        [personas ? JSON.stringify(personas) : null, home_location_id, work_location_id, farm_location_id, req.user.id]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Update profile error: ${err.message}` });
  }
});
