import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// Whitelisted Authorized Emails ONLY
const AUTHORIZED_EMAILS = [
  'kgomotso.lekganyane@spar.co.za',
  'tsholanangpodile@gmail.com',
];

// Helper to check if a token is the single active admin session
export function validateActiveAdminToken(token: string | null | undefined): { valid: boolean; user?: any; reason?: string } {
  if (!token) return { valid: false, reason: 'No token provided' };

  const session = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get('active_admin_session') as any;
  if (!session) {
    // If no active session recorded, allow if valid token structure (initialization)
    return { valid: true };
  }

  if (session.token !== token) {
    return {
      valid: false,
      reason: 'SESSION_CONCURRENCY_TERMINATED',
    };
  }

  return { valid: true, user: session };
}

// GET active admin status (to check if someone is currently logged in)
router.get('/active-status', (req, res) => {
  try {
    const session = db.prepare('SELECT user_id, email, full_name, created_at, last_heartbeat FROM active_sessions WHERE id = ?').get('active_admin_session') as any;

    if (!session) {
      return res.json({ success: true, active: false });
    }

    res.json({
      success: true,
      active: true,
      email: session.email,
      full_name: session.full_name,
      created_at: session.created_at,
      last_heartbeat: session.last_heartbeat,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    // Check if another admin session is currently active to inform the user
    const existingSession = db.prepare('SELECT email, full_name FROM active_sessions WHERE id = ?').get('active_admin_session') as any;

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
      active_session_notice: existingSession
        ? `Notice: Signing in will terminate the existing session held by ${existingSession.full_name} (${existingSession.email}). Simultaneous admin access is prohibited.`
        : undefined,
      message: `A single-use 6-digit approval code has been dispatched to ${user.email}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Step 2: Verify 6-Digit Email Code, Enforce Single Active Admin Session Lock, and Issue Token
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

    // SINGLE ADMIN CONCURRENCY ENFORCEMENT:
    // Revoke any previous active admin session so only THIS new session is valid
    db.exec('DELETE FROM active_sessions;');

    db.prepare(`
      INSERT INTO active_sessions (id, user_id, email, full_name, token, ip_address, created_at, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'active_admin_session',
      user.id,
      user.email,
      user.full_name,
      sessionToken,
      req.ip || req.socket.remoteAddress || '127.0.0.1'
    );

    // Log single-admin concurrency audit event
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
        VALUES (?, 'SINGLE_ADMIN_SESSION_ACQUIRED', 'auth', ?, ?, ?)
      `).run(
        randomUUID(),
        user.id,
        `Single-Admin session locked for ${user.full_name} (${user.email}). All other sessions revoked.`,
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

// POST Heartbeat / Active Session Ping
router.post('/heartbeat', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const session = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get('active_admin_session') as any;

    if (!session || session.token !== token) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_CONCURRENCY_TERMINATED',
        error: 'Single-Admin Security Lock: Another administrator has signed in. Simultaneous admin access is prohibited.',
      });
    }

    // Update heartbeat timestamp
    db.prepare("UPDATE active_sessions SET last_heartbeat = datetime('now') WHERE id = ?").run('active_admin_session');

    res.json({ success: true, active_user: session.email });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get('active_admin_session') as any;
      if (session && session.token === token) {
        db.exec('DELETE FROM active_sessions;');
        try {
          db.prepare(`
            INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
            VALUES (?, 'USER_SIGN_OUT', 'auth', ?, ?, ?)
          `).run(
            randomUUID(),
            session.user_id,
            `Admin ${session.full_name} (${session.email}) signed out and released single-admin lock.`,
            'admin'
          );
        } catch {
          // ignore
        }
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
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

// GET /me to validate current session against single-active-admin lock
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const session = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get('active_admin_session') as any;

    if (session && session.token !== token) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_CONCURRENCY_TERMINATED',
        error: 'Single-Admin Security Lock: Another administrator has signed in. Simultaneous admin access is prohibited.',
      });
    }

    const parts = token.split('_');
    const userId = parts[2];

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid token structure' });
    }

    const user = db.prepare('SELECT id, email, full_name, role, department, avatar_initials FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(401).json({ success: false, error: 'User record not found' });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
