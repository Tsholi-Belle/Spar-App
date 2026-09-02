import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// GET all programmes with live enrolled count and attendance stats
router.get('/', (req, res) => {
  try {
    const programmes = db.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT l.id) AS total_enrolled,
        SUM(CASE WHEN l.status = 'active' THEN 1 ELSE 0 END) AS active_learners,
        SUM(CASE WHEN l.status = 'dropped_out' THEN 1 ELSE 0 END) AS dropped_out_learners,
        SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END) AS completed_learners
      FROM programmes p
      LEFT JOIN learners l ON p.id = l.programme_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `).all();

    res.json({ success: true, data: programmes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single programme by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(id) as any;

    if (!programme) {
      return res.status(404).json({ success: false, error: 'Programme not found' });
    }

    // Get enrolled learners
    const learners = db.prepare(`
      SELECT * FROM learners WHERE programme_id = ? ORDER BY first_name ASC
    `).all(id);

    // Get attendance metrics for current month
    const attendanceSummary = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count
      FROM attendance_records
      WHERE programme_id = ?
      GROUP BY status
    `).all(id);

    res.json({
      success: true,
      data: {
        ...programme,
        learners,
        attendance_summary: attendanceSummary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create a new programme
router.post('/', (req, res) => {
  try {
    const {
      name,
      department,
      cohort_code,
      branch_location,
      start_date,
      end_date,
      target_headcount,
      stipend_type = 'monthly',
      monthly_stipend,
      daily_rate,
      shift_start = '07:30',
      shift_end = '16:00',
      supervisor_name,
      supervisor_email,
    } = req.body;

    if (!name || !department || !cohort_code || !start_date || !end_date || !target_headcount) {
      return res.status(400).json({ success: false, error: 'Missing required programme fields' });
    }

    const id = `prog-${randomUUID().slice(0, 8)}`;
    const calcDaily = daily_rate || (monthly_stipend ? Math.round(monthly_stipend / 20) : 180);
    const calcMonthly = monthly_stipend || (daily_rate ? Math.round(daily_rate * 20) : 3600);

    const stmt = db.prepare(`
      INSERT INTO programmes (
        id, name, department, cohort_code, branch_location, start_date, end_date,
        target_headcount, stipend_type, monthly_stipend, daily_rate, shift_start,
        shift_end, supervisor_name, supervisor_email, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active'
      )
    `);

    stmt.run(
      id,
      name,
      department,
      cohort_code,
      branch_location || 'Sandton City Flagship',
      start_date,
      end_date,
      Number(target_headcount),
      stipend_type,
      Number(calcMonthly),
      Number(calcDaily),
      shift_start,
      shift_end,
      supervisor_name,
      supervisor_email || null
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
      VALUES (?, 'CREATE_PROGRAMME', 'programme', ?, ?, 'Admin')
    `).run(randomUUID(), id, `Created programme ${name} (${cohort_code})`);

    const created = db.prepare('SELECT * FROM programmes WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update programme
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      department,
      cohort_code,
      branch_location,
      start_date,
      end_date,
      target_headcount,
      monthly_stipend,
      daily_rate,
      shift_start,
      shift_end,
      supervisor_name,
      supervisor_email,
      status,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE programmes
      SET 
        name = COALESCE(?, name),
        department = COALESCE(?, department),
        cohort_code = COALESCE(?, cohort_code),
        branch_location = COALESCE(?, branch_location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        target_headcount = COALESCE(?, target_headcount),
        monthly_stipend = COALESCE(?, monthly_stipend),
        daily_rate = COALESCE(?, daily_rate),
        shift_start = COALESCE(?, shift_start),
        shift_end = COALESCE(?, shift_end),
        supervisor_name = COALESCE(?, supervisor_name),
        supervisor_email = COALESCE(?, supervisor_email),
        status = COALESCE(?, status)
      WHERE id = ?
    `);

    stmt.run(
      name,
      department,
      cohort_code,
      branch_location,
      start_date,
      end_date,
      target_headcount ? Number(target_headcount) : null,
      monthly_stipend ? Number(monthly_stipend) : null,
      daily_rate ? Number(daily_rate) : null,
      shift_start,
      shift_end,
      supervisor_name,
      supervisor_email,
      status,
      id
    );

    const updated = db.prepare('SELECT * FROM programmes WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE programme
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const activeLearners = db.prepare(
      'SELECT COUNT(*) as count FROM learners WHERE programme_id = ? AND status = "active"'
    ).get(id) as { count: number };

    if (activeLearners.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete programme with ${activeLearners.count} active learners. Archive or reassign learners first.`,
      });
    }

    db.prepare('DELETE FROM programmes WHERE id = ?').run(id);
    res.json({ success: true, message: 'Programme deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
