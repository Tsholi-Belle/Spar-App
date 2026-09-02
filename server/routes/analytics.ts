import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET high-level dashboard KPIs
router.get('/overview', (req, res) => {
  try {
    const totalProgrammes = db.prepare('SELECT COUNT(*) as count FROM programmes').get() as { count: number };
    const totalLearners = db.prepare('SELECT COUNT(*) as count FROM learners').get() as { count: number };
    const activeLearners = db.prepare('SELECT COUNT(*) as count FROM learners WHERE status = "active"').get() as { count: number };
    const droppedOutLearners = db.prepare('SELECT COUNT(*) as count FROM learners WHERE status = "dropped_out"').get() as { count: number };
    const completedLearners = db.prepare('SELECT COUNT(*) as count FROM learners WHERE status = "completed"').get() as { count: number };
    const targetCapacity = db.prepare('SELECT SUM(target_headcount) as total FROM programmes').get() as { total: number };

    // Overall attendance rate for current month
    const currentMonth = '2026-08';
    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_count,
        SUM(CASE WHEN status = 'excused_sick' THEN 1 ELSE 0 END) as excused_count,
        SUM(CASE WHEN status = 'unexcused_absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'left_program' THEN 1 ELSE 0 END) as left_count
      FROM attendance_records
      WHERE date LIKE ?
    `).get(`${currentMonth}%`) as any;

    const effectivePresent = attendanceStats.present_count + attendanceStats.half_day_count * 0.5;
    const totalAttendable = attendanceStats.total_records - attendanceStats.left_count;
    const attendanceRate = totalAttendable > 0 ? Number(((effectivePresent / totalAttendable) * 100).toFixed(1)) : 0;
    const dropoutRate = totalLearners.count > 0 ? Number(((droppedOutLearners.count / totalLearners.count) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        total_programmes: totalProgrammes.count,
        total_learners: totalLearners.count,
        active_learners: activeLearners.count,
        dropped_out_learners: droppedOutLearners.count,
        completed_learners: completedLearners.count,
        target_headcount: targetCapacity.total || 0,
        enrolment_rate: targetCapacity.total ? Number(((totalLearners.count / targetCapacity.total) * 100).toFixed(1)) : 0,
        attendance_rate: attendanceRate,
        dropout_rate: dropoutRate,
        current_month: currentMonth,
        attendance_breakdown: attendanceStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET department breakdown
router.get('/departments', (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT 
        p.department,
        p.name as programme_name,
        p.id as programme_id,
        p.target_headcount,
        COUNT(DISTINCT l.id) as total_learners,
        SUM(CASE WHEN l.status = 'active' THEN 1 ELSE 0 END) as active_learners,
        SUM(CASE WHEN l.status = 'dropped_out' THEN 1 ELSE 0 END) as dropped_out_learners,
        SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'unexcused_absent' THEN 1 ELSE 0 END) as absent_days,
        COUNT(a.id) as total_att_records
      FROM programmes p
      LEFT JOIN learners l ON p.id = l.programme_id
      LEFT JOIN attendance_records a ON l.id = a.learner_id AND a.date LIKE '2026-08%'
      GROUP BY p.department
      ORDER BY p.department ASC
    `).all() as any[];

    const formatted = departments.map((d) => {
      const attendable = d.present_days + d.absent_days;
      const rate = attendable > 0 ? Number(((d.present_days / attendable) * 100).toFixed(1)) : 90.0;
      return {
        ...d,
        attendance_rate: rate,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET at-risk absentee learners
router.get('/at-risk', (req, res) => {
  try {
    const atRisk = db.prepare(`
      SELECT 
        l.id,
        l.first_name,
        l.last_name,
        l.learner_code,
        l.phone,
        l.status,
        p.name as programme_name,
        p.department,
        p.supervisor_name,
        COUNT(CASE WHEN a.status = 'unexcused_absent' THEN 1 END) as unexcused_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'excused_sick' THEN 1 END) as sick_count
      FROM learners l
      JOIN programmes p ON l.programme_id = p.id
      LEFT JOIN attendance_records a ON l.id = a.learner_id AND a.date LIKE '2026-08%'
      WHERE l.status = 'active'
      GROUP BY l.id
      HAVING unexcused_count >= 1 OR late_count >= 2
      ORDER BY unexcused_count DESC, late_count DESC
      LIMIT 10
    `).all();

    res.json({ success: true, data: atRisk });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET recent activity feed
router.get('/activity', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 25
    `).all();

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
