import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// GET learners with filters
router.get('/', (req, res) => {
  try {
    const { programme_id, status, search } = req.query;

    let query = `
      SELECT 
        l.*,
        p.name AS programme_name,
        p.department AS programme_department,
        p.daily_rate,
        p.monthly_stipend
      FROM learners l
      JOIN programmes p ON l.programme_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (programme_id) {
      query += ' AND l.programme_id = ?';
      params.push(programme_id);
    }

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (
        l.first_name LIKE ? OR 
        l.last_name LIKE ? OR 
        l.learner_code LIKE ? OR 
        l.id_number LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY l.first_name ASC, l.last_name ASC';

    const learners = db.prepare(query).all(...params);
    res.json({ success: true, data: learners });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single learner by ID with attendance history and payouts
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const learner = db.prepare(`
      SELECT 
        l.*,
        p.name AS programme_name,
        p.department AS programme_department,
        p.cohort_code,
        p.daily_rate,
        p.monthly_stipend,
        p.shift_start,
        p.shift_end,
        p.supervisor_name
      FROM learners l
      JOIN programmes p ON l.programme_id = p.id
      WHERE l.id = ?
    `).get(id) as any;

    if (!learner) {
      return res.status(404).json({ success: false, error: 'Learner not found' });
    }

    // Get attendance records
    const attendance = db.prepare(`
      SELECT * FROM attendance_records
      WHERE learner_id = ?
      ORDER BY date DESC
      LIMIT 60
    `).all(id);

    // Calculate attendance statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN status = 'excused_sick' THEN 1 ELSE 0 END) as excused_days,
        SUM(CASE WHEN status = 'unexcused_absent' THEN 1 ELSE 0 END) as unexcused_days,
        SUM(hours_worked) as total_hours
      FROM attendance_records
      WHERE learner_id = ?
    `).get(id);

    // Get historical stipend payouts from reconciliations
    const payouts = db.prepare(`
      SELECT 
        ri.*,
        r.cycle_name,
        r.period_start,
        r.period_end,
        r.status as reconciliation_status
      FROM reconciliation_items ri
      JOIN reconciliations r ON ri.reconciliation_id = r.id
      WHERE ri.learner_id = ?
      ORDER BY r.period_end DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...learner,
        attendance_stats: stats,
        recent_attendance: attendance,
        payouts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add new learner
router.post('/', (req, res) => {
  try {
    const {
      programme_id,
      learner_code,
      pin_code,
      first_name,
      last_name,
      id_number,
      phone,
      email,
      emergency_contact_name,
      emergency_contact_phone,
      bank_name,
      account_number,
      branch_code,
      account_type = 'savings',
      joined_date,
    } = req.body;

    if (!programme_id || !first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'Programme, first name and last name are required.' });
    }

    const id = `lrn-${randomUUID().slice(0, 8)}`;
    const code = learner_code || `SPAR-${Date.now().toString().slice(-4)}`;
    const pin = pin_code || Math.floor(1000 + Math.random() * 9000).toString();
    const joinDate = joined_date || new Date().toISOString().split('T')[0];
    const idNum = id_number || `SPAR-NAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const bName = bank_name || 'Standard Bank SA';
    const accNum = account_number || `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const stmt = db.prepare(`
      INSERT INTO learners (
        id, programme_id, learner_code, pin_code, first_name, last_name,
        id_number, phone, email, emergency_contact_name, emergency_contact_phone,
        bank_name, account_number, branch_code, account_type, status, joined_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'active', ?
      )
    `);

    stmt.run(
      id,
      programme_id,
      code,
      pin,
      first_name,
      last_name,
      idNum,
      phone || null,
      email || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      bName,
      accNum,
      branch_code || '470010',
      account_type,
      joinDate
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
      VALUES (?, 'ENROLL_LEARNER', 'learner', ?, ?, 'Admin')
    `).run(randomUUID(), id, `Enrolled learner ${first_name} ${last_name} (${code})`);

    const created = db.prepare('SELECT * FROM learners WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update learner
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      id_number,
      phone,
      email,
      emergency_contact_name,
      emergency_contact_phone,
      bank_name,
      account_number,
      branch_code,
      account_type,
      pin_code,
      status,
      programme_id,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE learners
      SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        id_number = COALESCE(?, id_number),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        bank_name = COALESCE(?, bank_name),
        account_number = COALESCE(?, account_number),
        branch_code = COALESCE(?, branch_code),
        account_type = COALESCE(?, account_type),
        pin_code = COALESCE(?, pin_code),
        status = COALESCE(?, status),
        programme_id = COALESCE(?, programme_id)
      WHERE id = ?
    `);

    stmt.run(
      first_name,
      last_name,
      id_number,
      phone,
      email,
      emergency_contact_name,
      emergency_contact_phone,
      bank_name,
      account_number,
      branch_code,
      account_type,
      pin_code,
      status,
      programme_id,
      id
    );

    const updated = db.prepare('SELECT * FROM learners WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST record learner dropout / early exit
router.post('/:id/exit', (req, res) => {
  try {
    const { id } = req.params;
    const { exit_date, exit_reason, exit_notes, status = 'dropped_out' } = req.body;

    if (!exit_date || !exit_reason) {
      return res.status(400).json({ success: false, error: 'Exit date and reason are required' });
    }

    const learner = db.prepare('SELECT * FROM learners WHERE id = ?').get(id) as any;
    if (!learner) {
      return res.status(404).json({ success: false, error: 'Learner not found' });
    }

    // Update learner record
    db.prepare(`
      UPDATE learners
      SET 
        status = ?,
        exit_date = ?,
        exit_reason = ?,
        exit_notes = ?
      WHERE id = ?
    `).run(status, exit_date, exit_reason, exit_notes || null, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
      VALUES (?, 'LEARNER_EXIT', 'learner', ?, ?, 'Supervisor')
    `).run(
      randomUUID(),
      id,
      `Recorded exit for ${learner.first_name} ${learner.last_name}: ${exit_reason} (Date: ${exit_date})`
    );

    const updated = db.prepare('SELECT * FROM learners WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE learner
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM learners WHERE id = ?').run(id);
    res.json({ success: true, message: 'Learner removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
