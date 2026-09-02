import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// Retail safety, break policy, and motivational tips
const retailTips = [
  'Remember: Quality customer service is the heart of retail!',
  'Baking Tip: Check oven temperatures and keep proofing trays covered.',
  'Safety First: Always wear slip-resistant safety shoes in food preparation areas.',
  'POS Cashier Tip: Always greet the customer with a smile and double-check high-value items.',
  'Merchandising Tip: First In, First Out (FIFO) keeps our produce crisp and fresh!',
  'Break Policy: Take your 15-minute tea break in designated staff rest areas to refresh.',
  'Hygiene Standard: Wash hands for at least 20 seconds before handling any prepared food items.',
  'Great work! Every shift builds your professional retail portfolio.',
];

// POST lookup learner by PIN or Learner Code
router.post('/lookup', (req, res) => {
  try {
    const { code, pin } = req.body;

    if (!code && !pin) {
      return res.status(400).json({ success: false, error: 'Enter your Learner Code or 4-digit PIN' });
    }

    let learner: any = null;
    if (code) {
      learner = db.prepare(`
        SELECT l.*, p.name as programme_name, p.department, p.shift_start, p.shift_end, p.branch_location
        FROM learners l
        JOIN programmes p ON l.programme_id = p.id
        WHERE l.learner_code = ? OR l.pin_code = ?
      `).get(code, code);
    } else if (pin) {
      learner = db.prepare(`
        SELECT l.*, p.name as programme_name, p.department, p.shift_start, p.shift_end, p.branch_location
        FROM learners l
        JOIN programmes p ON l.programme_id = p.id
        WHERE l.pin_code = ?
      `).get(pin);
    }

    if (!learner) {
      return res.status(404).json({ success: false, error: 'Invalid PIN or Learner ID. Please check with your supervisor.' });
    }

    if (learner.status === 'dropped_out') {
      return res.status(403).json({
        success: false,
        error: `Learner status is recorded as Exited (${learner.exit_reason || 'Programme Completed'}). Please contact Store HR.`,
      });
    }

    // Get today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare(`
      SELECT * FROM attendance_records
      WHERE learner_id = ? AND date = ?
    `).get(learner.id, today) as any;

    let teaBreakStatus: 'none' | 'on_break' | 'completed' = 'none';
    if (record) {
      if (record.tea_break_start && !record.tea_break_end) {
        teaBreakStatus = 'on_break';
      } else if (record.tea_break_start && record.tea_break_end) {
        teaBreakStatus = 'completed';
      }
    }

    res.json({
      success: true,
      learner: {
        id: learner.id,
        first_name: learner.first_name,
        last_name: learner.last_name,
        learner_code: learner.learner_code,
        pin_code: learner.pin_code,
        programme_id: learner.programme_id,
        programme_name: learner.programme_name,
        department: learner.department,
        shift_start: learner.shift_start,
        shift_end: learner.shift_end,
        branch_location: learner.branch_location,
      },
      today: {
        date: today,
        record: record || null,
        is_clocked_in: !!(record && record.clock_in_time && !record.clock_out_time),
        is_completed: !!(record && record.clock_in_time && record.clock_out_time),
        tea_break_status: teaBreakStatus,
        tea_break_start: record?.tea_break_start || null,
        tea_break_end: record?.tea_break_end || null,
      },
      tip: retailTips[Math.floor(Math.random() * retailTips.length)],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST punch clock-in / clock-out / tea_break_start / tea_break_end
router.post('/punch', (req, res) => {
  try {
    const { learner_id, action, current_time } = req.body;

    if (!learner_id || !action) {
      return res.status(400).json({
        success: false,
        error: 'learner_id and action (clock_in | clock_out | tea_break_start | tea_break_end) are required',
      });
    }

    const learner = db.prepare(`
      SELECT l.*, p.shift_start, p.shift_end, p.id as prog_id
      FROM learners l
      JOIN programmes p ON l.programme_id = p.id
      WHERE l.id = ?
    `).get(learner_id) as any;

    if (!learner) {
      return res.status(404).json({ success: false, error: 'Learner not found' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = current_time || now.toTimeString().slice(0, 5); // HH:MM

    const existing = db.prepare(`
      SELECT * FROM attendance_records
      WHERE learner_id = ? AND date = ?
    `).get(learner_id, today) as any;

    let responseStatus = 'present';
    let message = '';

    if (action === 'clock_in') {
      const shiftStart = learner.shift_start || '07:30';
      const [shH, shM] = shiftStart.split(':').map(Number);
      const [nowH, nowM] = timeStr.split(':').map(Number);
      const isLate = nowH * 60 + nowM > shH * 60 + shM + 15; // 15 min grace period

      responseStatus = isLate ? 'late' : 'present';

      if (existing) {
        db.prepare(`
          UPDATE attendance_records
          SET 
            clock_in_time = ?,
            status = ?,
            supervisor_notes = COALESCE(supervisor_notes, ?)
          WHERE id = ?
        `).run(timeStr, responseStatus, isLate ? 'Clocked in past scheduled start time' : null, existing.id);
      } else {
        const newId = `att-${randomUUID().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO attendance_records (
            id, learner_id, programme_id, date, status, clock_in_time, hours_worked, supervisor_notes
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          newId,
          learner_id,
          learner.programme_id,
          today,
          responseStatus,
          timeStr,
          isLate ? 'Clocked in past scheduled start time' : 'Clocked in via Kiosk'
        );
      }

      message = isLate
        ? `Clocked IN at ${timeStr} (Recorded as Late). Have a productive shift!`
        : `Welcome, ${learner.first_name}! Successfully clocked IN at ${timeStr}.`;
    } else if (action === 'tea_break_start') {
      if (!existing || !existing.clock_in_time) {
        return res.status(400).json({ success: false, error: 'You must clock in for your shift before starting a tea break.' });
      }

      db.prepare(`
        UPDATE attendance_records
        SET tea_break_start = ?
        WHERE id = ?
      `).run(timeStr, existing.id);

      message = `Enjoy your tea break, ${learner.first_name}! Started at ${timeStr} (15-min retail rest break).`;
    } else if (action === 'tea_break_end') {
      if (!existing || !existing.tea_break_start) {
        return res.status(400).json({ success: false, error: 'No active tea break found to clock out of.' });
      }

      db.prepare(`
        UPDATE attendance_records
        SET tea_break_end = ?
        WHERE id = ?
      `).run(timeStr, existing.id);

      message = `Tea break ended at ${timeStr}. Welcome back to your shift, ${learner.first_name}!`;
    } else if (action === 'clock_out') {
      const clockIn = existing?.clock_in_time || learner.shift_start || '07:30';
      const [inH, inM] = clockIn.split(':').map(Number);
      const [outH, outM] = timeStr.split(':').map(Number);
      const diffMinutes = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
      const hoursWorked = Number((diffMinutes / 60).toFixed(2));

      // Determine half day vs full day
      const isHalfDay = hoursWorked < 5.0;
      const finalStatus = isHalfDay ? 'half_day' : existing?.status === 'late' ? 'late' : 'present';

      if (existing) {
        db.prepare(`
          UPDATE attendance_records
          SET 
            clock_out_time = ?,
            hours_worked = ?,
            status = ?
          WHERE id = ?
        `).run(timeStr, hoursWorked, finalStatus, existing.id);
      } else {
        const newId = `att-${randomUUID().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO attendance_records (
            id, learner_id, programme_id, date, status, clock_in_time, clock_out_time, hours_worked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(newId, learner_id, learner.programme_id, today, finalStatus, clockIn, timeStr, hoursWorked);
      }

      message = `Great job, ${learner.first_name}! Clocked OUT at ${timeStr}. Total shift logged today: ${hoursWorked} hrs.`;
    }

    const updatedRecord = db.prepare(`
      SELECT * FROM attendance_records WHERE learner_id = ? AND date = ?
    `).get(learner_id, today);

    res.json({
      success: true,
      message,
      record: updatedRecord,
      tip: retailTips[Math.floor(Math.random() * retailTips.length)],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
