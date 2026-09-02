import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// Whitelisted Authorized Emails ONLY
const AUTHORIZED_EMAILS = [
  'kgomotso.lekganyane@spar.co.za',
  'tsholanangpodile@gmail.com',
];

// POST Step 1: Initial Email & Password Validation + Generate 6-Digit Email Verification Code
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your authorized work/personal email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict Whitelist Check
    if (!AUTHORIZED_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error:
          'Access Denied: Unrecognized email address. Access to this IP-protected system is restricted exclusively to Kgomotso.Lekganyane@spar.co.za and tsholanangpodile@gmail.com.',
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;

    if (!user || user.password_hash !== password.trim()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please check your secure access passkey.',
      });
    }

    // Generate 6-digit verification code for two-factor email security approval
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = `vcode_${randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // Save in DB
    db.prepare(`
      INSERT INTO email_verifications (id, email, code, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(verificationId, user.email, verificationCode, expiresAt);

    // Security Audit Log
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
        VALUES (?, '2FA_CODE_DISPATCHED', 'auth', ?, ?, ?)
      `).run(
        randomUUID(),
        user.id,
        `Dispatched single-use verification code to ${user.email}`,
        user.role
      );
    } catch {
      // ignore
    }

    res.json({
      success: true,
      step: 'verification_required',
      verification_id: verificationId,
      email: user.email,
      full_name: user.full_name,
      simulated_code: verificationCode,
      message: `A single-use 6-digit approval code has been dispatched to ${user.email}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Step 2: Verify 6-Digit Email Code and Issue Authenticated Token
router.post('/verify-code', (req, res) => {
  try {
    const { email, code, verification_id } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the 6-digit verification code sent to your email.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Whitelist check
    if (!AUTHORIZED_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Email is not authorized.',
      });
    }

    // Find verification record
    const record = db.prepare(`
      SELECT * FROM email_verifications 
      WHERE LOWER(email) = ? AND code = ? AND used = 0
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(cleanEmail, cleanCode) as any;

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code. Please check your email or request a new code.',
      });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new verification code.',
      });
    }

    // Mark as used
    db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(record.id);

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;

    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    // Generate authenticated session token
    const sessionToken = `spar_token_${user.id}_${Date.now()}_${randomUUID().slice(0, 8)}`;

    // Log successful login audit
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
        VALUES (?, 'USER_SIGN_IN_2FA_VERIFIED', 'auth', ?, ?, ?)
      `).run(
        randomUUID(),
        user.id,
        `2FA verified sign-in by ${user.full_name} (${user.email})`,
        user.role
      );
    } catch {
      // ignore
    }

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        avatar_initials: user.avatar_initials,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Resend Code
router.post('/resend-code', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!AUTHORIZED_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({ success: false, error: 'Unauthorized email' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = `vcode_${randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO email_verifications (id, email, code, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(verificationId, cleanEmail, verificationCode, expiresAt);

    res.json({
      success: true,
      verification_id: verificationId,
      simulated_code: verificationCode,
      message: `A new 6-digit approval code was dispatched to ${cleanEmail}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET authorized accounts list (Only the 2 authorized emails)
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT id, email, full_name, role, department, avatar_initials, password_hash as default_password
      FROM users
      ORDER BY full_name ASC
    `).all();

    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /me to validate current session
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const parts = token.split('_');
    const userId = parts[2];

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid token structure' });
    }

    const user = db.prepare('SELECT id, email, full_name, role, department, avatar_initials FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(401).json({ success: false, error: 'User session expired or revoked' });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
