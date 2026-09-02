import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// GET daily roster for a given date and optional programme_id
router.get('/roster', (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], programme_id } = req.query;

    let learnerQuery = `
      SELECT 
        l.id AS learner_id,
        l.first_name,
        l.last_name,
        l.learner_code,
        l.pin_code,
        l.status AS learner_status,
        l.exit_date,
        l.exit_reason,
        p.id AS programme_id,
        p.name AS programme_name,
        p.department AS programme_department,
        p.shift_start,
        p.shift_end,
        p.daily_rate,
        a.id AS attendance_id,
        a.date AS attendance_date,
        a.status AS attendance_status,
        a.clock_in_time,
        a.clock_out_time,
        a.tea_break_start,
        a.tea_break_end,
        a.hours_worked,
        a.supervisor_notes,
        a.has_medical_note,
        a.leave_type,
        a.leave_approved_by
      FROM learners l
      JOIN programmes p ON l.programme_id = p.id
      LEFT JOIN attendance_records a ON l.id = a.learner_id AND a.date = ?
      WHERE 1=1
    `;

    const params: any[] = [date];

    if (programme_id) {
      learnerQuery += ' AND l.programme_id = ?';
      params.push(programme_id);
    }

    learnerQuery += ' ORDER BY p.name ASC, l.first_name ASC';

    const rawRoster = db.prepare(learnerQuery).all(...params) as any[];

    const roster = rawRoster.map((row) => {
      const isPastExit = row.exit_date && String(date) > row.exit_date;
      const status = row.attendance_status || (isPastExit ? 'left_program' : 'unexcused_absent');

      return {
        ...row,
        status,
        is_dropped_out: isPastExit || row.learner_status === 'dropped_out',
      };
    });

    res.json({ success: true, date, data: roster });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST update or upsert a single attendance record
router.post('/update', (req, res) => {
  try {
    const {
      learner_id,
      programme_id,
      date,
      status,
      clock_in_time,
      clock_out_time,
      tea_break_start,
      tea_break_end,
      hours_worked,
      supervisor_notes,
      has_medical_note = 0,
      leave_type,
      leave_approved_by,
    } = req.body;

    if (!learner_id || !date || !status) {
      return res.status(400).json({ success: false, error: 'Missing required attendance fields' });
    }

    let progId = programme_id;
    if (!progId) {
      const learner = db.prepare('SELECT programme_id FROM learners WHERE id = ?').get(learner_id) as any;
      if (learner) progId = learner.programme_id;
    }

    let calculatedHours = hours_worked;
    if (calculatedHours === undefined && clock_in_time && clock_out_time) {
      const [inH, inM] = clock_in_time.split(':').map(Number);
      const [outH, outM] = clock_out_time.split(':').map(Number);
      const totalMinutes = outH * 60 + outM - (inH * 60 + inM);
      calculatedHours = Math.max(0, Number((totalMinutes / 60).toFixed(2)));
    } else if (status === 'present' && !calculatedHours) {
      calculatedHours = 8.0;
    } else if (status === 'half_day' && !calculatedHours) {
      calculatedHours = 4.0;
    } else if (['unexcused_absent', 'excused_sick', 'leave', 'left_program'].includes(status)) {
      calculatedHours = 0;
    }

    const existing = db
      .prepare('SELECT id FROM attendance_records WHERE learner_id = ? AND date = ?')
      .get(learner_id, date) as any;

    if (existing) {
      db.prepare(`
        UPDATE attendance_records
        SET 
          status = ?,
          clock_in_time = COALESCE(?, clock_in_time),
          clock_out_time = COALESCE(?, clock_out_time),
          tea_break_start = COALESCE(?, tea_break_start),
          tea_break_end = COALESCE(?, tea_break_end),
          hours_worked = ?,
          supervisor_notes = ?,
          has_medical_note = ?,
          leave_type = COALESCE(?, leave_type),
          leave_approved_by = COALESCE(?, leave_approved_by)
        WHERE id = ?
      `).run(
        status,
        clock_in_time || null,
        clock_out_time || null,
        tea_break_start || null,
        tea_break_end || null,
        calculatedHours || 0,
        supervisor_notes || null,
        has_medical_note ? 1 : 0,
        leave_type || null,
        leave_approved_by || null,
        existing.id
      );
    } else {
      const newId = `att-${randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO attendance_records (
          id, learner_id, programme_id, date, status,
          clock_in_time, clock_out_time, tea_break_start, tea_break_end,
          hours_worked, supervisor_notes, has_medical_note,
          leave_type, leave_approved_by
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?
        )
      `).run(
        newId,
        learner_id,
        progId,
        date,
        status,
        clock_in_time || null,
        clock_out_time || null,
        tea_break_start || null,
        tea_break_end || null,
        calculatedHours || 0,
        supervisor_notes || null,
        has_medical_note ? 1 : 0,
        leave_type || null,
        leave_approved_by || null
      );
    }

    res.json({ success: true, message: 'Attendance updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST bulk mark attendance for a programme and date
router.post('/bulk-update', (req, res) => {
  try {
    const { programme_id, date, status = 'present', default_clock_in = '07:30', default_clock_out = '16:00' } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    let learnersQuery = 'SELECT id, programme_id, status, exit_date FROM learners WHERE 1=1';
    const params: any[] = [];
    if (programme_id) {
      learnersQuery += ' AND programme_id = ?';
      params.push(programme_id);
    }

    const learners = db.prepare(learnersQuery).all(...params) as any[];

    const upsertStmt = db.prepare(`
      INSERT INTO attendance_records (
        id, learner_id, programme_id, date, status, clock_in_time, clock_out_time, hours_worked, supervisor_notes, has_medical_note
      ) VALUES (
        @id, @learner_id, @programme_id, @date, @status, @clock_in_time, @clock_out_time, @hours_worked, @supervisor_notes, 0
      )
      ON CONFLICT(learner_id, date) DO UPDATE SET
        status = excluded.status,
        clock_in_time = excluded.clock_in_time,
        clock_out_time = excluded.clock_out_time,
        hours_worked = excluded.hours_worked,
        supervisor_notes = excluded.supervisor_notes
    `);

    const updateMany = db.transaction((list: any[]) => {
      let count = 0;
      for (const l of list) {
        if (l.exit_date && date > l.exit_date) {
          upsertStmt.run({
            id: `att-${randomUUID().slice(0, 8)}`,
            learner_id: l.id,
            programme_id: l.programme_id,
            date,
            status: 'left_program',
            clock_in_time: null,
            clock_out_time: null,
            hours_worked: 0,
            supervisor_notes: 'Left programme before this date',
          });
        } else {
          upsertStmt.run({
            id: `att-${randomUUID().slice(0, 8)}`,
            learner_id: l.id,
            programme_id: l.programme_id,
            date,
            status,
            clock_in_time: status === 'present' ? default_clock_in : null,
            clock_out_time: status === 'present' ? default_clock_out : null,
            hours_worked: status === 'present' ? 8.0 : 0,
            supervisor_notes: 'Bulk updated by supervisor',
          });
          count++;
        }
      }
      return count;
    });

    const updatedCount = updateMany(learners);

    res.json({ success: true, message: `Successfully updated attendance for ${updatedCount} learners.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET monthly matrix for a programme
router.get('/matrix', (req, res) => {
  try {
    const { programme_id, year_month = '2026-08' } = req.query;

    if (!programme_id) {
      return res.status(400).json({ success: false, error: 'programme_id is required' });
    }

    const learners = db.prepare(`
      SELECT id, first_name, last_name, learner_code, status, exit_date
      FROM learners
      WHERE programme_id = ?
      ORDER BY first_name ASC
    `).all(programme_id) as any[];

    const records = db.prepare(`
      SELECT learner_id, date, status, hours_worked, tea_break_start, tea_break_end, leave_type
      FROM attendance_records
      WHERE programme_id = ? AND date LIKE ?
    `).all(programme_id, `${year_month}%`) as any[];

    const attendanceMap: Record<string, Record<string, any>> = {};
    records.forEach((r) => {
      if (!attendanceMap[r.learner_id]) {
        attendanceMap[r.learner_id] = {};
      }
      attendanceMap[r.learner_id][r.date] = r;
    });

    res.json({
      success: true,
      year_month,
      learners,
      attendance: attendanceMap,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
