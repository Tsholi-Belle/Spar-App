import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = Router();

// Helper to count working days (Mon-Fri) between two dates inclusive
function countWorkingDays(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (curr <= end) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

// Compute reconciliation line items for given parameters
function computeReconciliation(period_start: string, period_end: string, programme_id?: string) {
  const workingDays = countWorkingDays(period_start, period_end);
  const totalPeriodWorkingDays = workingDays.length;

  let learnersQuery = `
    SELECT 
      l.*,
      p.name AS programme_name,
      p.department AS programme_department,
      p.cohort_code,
      p.shift_start,
      p.shift_end,
      p.branch_location,
      p.supervisor_name
    FROM learners l
    JOIN programmes p ON l.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (programme_id) {
    learnersQuery += ' AND l.programme_id = ?';
    params.push(programme_id);
  }
  learnersQuery += ' ORDER BY p.name ASC, l.first_name ASC';

  const learners = db.prepare(learnersQuery).all(...params) as any[];

  const items = learners.map((lrn) => {
    const effectiveStart = lrn.joined_date > period_start ? lrn.joined_date : period_start;
    const effectiveEnd = lrn.exit_date && lrn.exit_date < period_end ? lrn.exit_date : period_end;

    const learnerScheduledDays = workingDays.filter(
      (d) => d >= effectiveStart && d <= effectiveEnd
    ).length;

    const attendance = db.prepare(`
      SELECT status, count(*) as count
      FROM attendance_records
      WHERE learner_id = ? AND date >= ? AND date <= ?
      GROUP BY status
    `).all(lrn.id, period_start, period_end) as any[];

    const statusCounts: Record<string, number> = {
      present: 0,
      late: 0,
      half_day: 0,
      excused_sick: 0,
      leave: 0,
      unexcused_absent: 0,
      left_program: 0,
    };

    attendance.forEach((a) => {
      statusCounts[a.status] = a.count;
    });

    const isDroppedOut = !!lrn.exit_date;
    // Leave and excused days count toward effective participation
    const effectiveAttended = statusCounts.present + statusCounts.late + statusCounts.half_day * 0.5 + statusCounts.leave;
    const rate = learnerScheduledDays > 0
      ? Math.min(100, Math.round((effectiveAttended / learnerScheduledDays) * 100))
      : 0;

    let outcome = 'in_progress';
    let complianceStatus = 'Compliant';
    let calculationNote = '';

    if (isDroppedOut) {
      outcome = 'pro_rata_exit';
      complianceStatus = 'Early Exit';
      calculationNote = `Pro-rated participation record for exit on ${lrn.exit_date} (${lrn.exit_reason || 'Left programme'}). Completed ${learnerScheduledDays}/${totalPeriodWorkingDays} scheduled days.`;
    } else if (statusCounts.excused_sick > 4) {
      outcome = 'medical_concession';
      complianceStatus = 'Compliant';
      calculationNote = `Medical concession approved (${statusCounts.excused_sick} excused clinic days).`;
    } else if (rate >= 85) {
      outcome = 'certified';
      complianceStatus = 'Compliant';
      calculationNote = `Standard participation met (${rate}% attendance, ${statusCounts.leave} approved leave days). Approved for SETA qualification.`;
    } else {
      outcome = 'disqualified';
      complianceStatus = 'At Risk';
      calculationNote = `Attendance rate ${rate}% below standard threshold due to ${statusCounts.unexcused_absent} unexcused absence(s).`;
    }

    return {
      learner_id: lrn.id,
      learner_code: lrn.learner_code,
      first_name: lrn.first_name,
      last_name: lrn.last_name,
      id_number: lrn.id_number,
      programme_id: lrn.programme_id,
      programme_name: lrn.programme_name,
      programme_department: lrn.programme_department,
      cohort_code: lrn.cohort_code,
      branch_location: lrn.branch_location,
      supervisor_name: lrn.supervisor_name,
      shift_start: lrn.shift_start,
      shift_end: lrn.shift_end,
      learner_status_at_cycle: lrn.status,
      joined_date: lrn.joined_date,
      exit_date: lrn.exit_date,
      exit_reason: lrn.exit_reason,
      total_period_working_days: totalPeriodWorkingDays,
      scheduled_days: learnerScheduledDays,
      days_present: statusCounts.present,
      days_late: statusCounts.late,
      days_half: statusCounts.half_day,
      days_excused: statusCounts.excused_sick,
      days_leave: statusCounts.leave,
      days_unexcused: statusCounts.unexcused_absent,
      effective_days_attended: effectiveAttended,
      attendance_rate: rate,
      outcome,
      compliance_status: complianceStatus,
      notes: calculationNote,
    };
  });

  const avgAttendance = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.attendance_rate, 0) / items.length)
    : 0;
  const certifiedCount = items.filter((i) => i.outcome === 'certified').length;
  const dropoutCount = items.filter((i) => !!i.exit_date).length;

  return {
    period_start,
    period_end,
    working_days_count: totalPeriodWorkingDays,
    total_learners: items.length,
    avg_attendance_rate: avgAttendance,
    certified_count: certifiedCount,
    dropout_count: dropoutCount,
    items,
  };
}

// GET all reconciliation runs
router.get('/', (req, res) => {
  try {
    const runs = db.prepare(`
      SELECT 
        r.*,
        p.name AS programme_name,
        p.department AS programme_department
      FROM reconciliations r
      LEFT JOIN programmes p ON r.programme_id = p.id
      ORDER BY r.created_at DESC
    `).all();

    res.json({ success: true, data: runs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST preview calculations for period
router.post('/preview', (req, res) => {
  try {
    const { period_start, period_end, programme_id } = req.body;

    if (!period_start || !period_end) {
      return res.status(400).json({ success: false, error: 'period_start and period_end are required' });
    }

    const preview = computeReconciliation(period_start, period_end, programme_id);
    res.json({ success: true, data: preview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create and save a new reconciliation run
router.post('/create', (req, res) => {
  try {
    const {
      cycle_name,
      period_start,
      period_end,
      programme_id,
      notes,
    } = req.body;

    if (!cycle_name || !period_start || !period_end) {
      return res.status(400).json({ success: false, error: 'Missing required reconciliation cycle fields' });
    }

    const preview = computeReconciliation(period_start, period_end, programme_id);
    const recId = `rec-${randomUUID().slice(0, 8)}`;

    const insertRun = db.prepare(`
      INSERT INTO reconciliations (
        id, programme_id, cycle_name, period_start, period_end,
        total_learners, total_gross_amount, total_deductions,
        total_net_payout, status, notes
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, 0, 0,
        ?, 'draft', ?
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO reconciliation_items (
        id, reconciliation_id, learner_id, learner_status_at_cycle,
        scheduled_days, days_present, days_late, days_half,
        days_excused, days_leave, days_unexcused, base_stipend, deductions,
        allowances, net_payable, payment_status, notes
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, 0, 0,
        0, ?, ?, ?
      )
    `);

    const createTransaction = db.transaction(() => {
      insertRun.run(
        recId,
        programme_id || null,
        cycle_name,
        period_start,
        period_end,
        preview.total_learners,
        preview.avg_attendance_rate,
        notes || null
      );

      for (const item of preview.items) {
        insertItem.run(
          `item-${randomUUID().slice(0, 8)}`,
          recId,
          item.learner_id,
          item.learner_status_at_cycle,
          item.scheduled_days,
          item.days_present,
          item.days_late,
          item.days_half,
          item.days_excused,
          item.days_leave,
          item.days_unexcused,
          item.attendance_rate,
          item.outcome,
          item.notes
        );
      }
    });

    createTransaction();

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
      VALUES (?, 'CREATE_RECONCILIATION', 'reconciliation', ?, ?, 'Admin')
    `).run(randomUUID(), recId, `Created attendance reconciliation run: ${cycle_name}`);

    res.status(201).json({ success: true, reconciliation_id: recId, data: preview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET reconciliation run details with items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const run = db.prepare(`
      SELECT 
        r.*,
        p.name AS programme_name,
        p.department AS programme_department,
        p.cohort_code
      FROM reconciliations r
      LEFT JOIN programmes p ON r.programme_id = p.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!run) {
      return res.status(404).json({ success: false, error: 'Reconciliation run not found' });
    }

    const items = db.prepare(`
      SELECT 
        ri.*,
        l.learner_code,
        l.first_name,
        l.last_name,
        l.id_number,
        l.phone,
        l.email,
        l.status as current_status,
        l.exit_date,
        l.exit_reason,
        p.name as programme_name,
        p.department as programme_department
      FROM reconciliation_items ri
      JOIN learners l ON ri.learner_id = l.id
      JOIN programmes p ON l.programme_id = p.id
      WHERE ri.reconciliation_id = ?
      ORDER BY p.name ASC, l.first_name ASC
    `).all(id);

    res.json({ success: true, data: { ...run, items } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update status (draft -> reviewed -> approved -> closed)
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;

    if (!['draft', 'reviewed', 'approved', 'closed', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (status === 'approved') {
      db.prepare(`
        UPDATE reconciliations
        SET status = ?, approved_by = ?, approved_at = ?
        WHERE id = ?
      `).run(status, approved_by || 'Store HR Administrator Brenda Khanyile', now, id);
    } else if (status === 'closed' || status === 'paid') {
      db.prepare(`
        UPDATE reconciliations
        SET status = ?, paid_at = ?
        WHERE id = ?
      `).run(status, now, id);
    } else {
      db.prepare('UPDATE reconciliations SET status = ? WHERE id = ?').run(status, id);
    }

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
      VALUES (?, 'UPDATE_RECONCILIATION_STATUS', 'reconciliation', ?, ?, 'HR Admin')
    `).run(randomUUID(), id, `Updated reconciliation audit status to ${status.toUpperCase()} by ${approved_by || 'HR Admin'}`);

    const updated = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET HR Attendance Audit CSV
router.get('/:id/export-bank-csv', (req, res) => {
  try {
    const { id } = req.params;
    const run = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(id) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Reconciliation run not found' });
    }

    const items = db.prepare(`
      SELECT 
        ri.*,
        l.learner_code,
        l.first_name,
        l.last_name,
        l.id_number,
        l.status,
        l.exit_date,
        l.exit_reason,
        p.department
      FROM reconciliation_items ri
      JOIN learners l ON ri.learner_id = l.id
      JOIN programmes p ON l.programme_id = p.id
      WHERE ri.reconciliation_id = ?
      ORDER BY l.first_name ASC
    `).all(id) as any[];

    const headers = [
      'Learner Name',
      'Learner ID',
      'National ID',
      'Department',
      'Enrolment Status',
      'Scheduled Days',
      'Days Present',
      'Days Late',
      'Excused Sick Days',
      'Approved Leave Days',
      'Unexcused Absence Days',
      'Participation Rate (%)',
      'Qualification Outcome',
      'Audit Notes',
    ];

    const rows = items.map((item) => {
      const rate = Math.min(
        100,
        Math.round(((item.days_present + item.days_half * 0.5 + (item.days_leave || 0)) / Math.max(1, item.scheduled_days)) * 100)
      );
      const isDropped = !!item.exit_date;
      const outcome = isDropped ? 'Pro-Rated Exit' : rate >= 85 ? 'Certified' : 'Disqualified';

      return [
        `"${item.first_name} ${item.last_name}"`,
        `"${item.learner_code}"`,
        `"${item.id_number}"`,
        `"${item.department}"`,
        `"${item.status}"`,
        item.scheduled_days,
        item.days_present,
        item.days_late,
        item.days_excused,
        item.days_leave || 0,
        item.days_unexcused,
        `${rate}%`,
        `"${outcome}"`,
        `"${item.notes || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="SPAR_Attendance_Audit_${id}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Payslip / Participation Certificate Data
router.get('/:id/payslip/:learnerId', (req, res) => {
  try {
    const { id, learnerId } = req.params;

    const run = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(id) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Reconciliation run not found' });
    }

    const item = db.prepare(`
      SELECT 
        ri.*,
        l.learner_code,
        l.first_name,
        l.last_name,
        l.id_number,
        l.phone,
        l.email,
        l.joined_date,
        l.exit_date,
        l.exit_reason,
        p.name AS programme_name,
        p.department AS programme_department,
        p.cohort_code,
        p.branch_location,
        p.supervisor_name,
        p.shift_start,
        p.shift_end
      FROM reconciliation_items ri
      JOIN learners l ON ri.learner_id = l.id
      JOIN programmes p ON l.programme_id = p.id
      WHERE ri.reconciliation_id = ? AND ri.learner_id = ?
    `).get(id, learnerId) as any;

    if (!item) {
      return res.status(404).json({ success: false, error: 'Participation item not found' });
    }

    res.json({
      success: true,
      payslip: {
        company_name: 'SPAR Group (Pty) Ltd',
        academy_name: 'SPAR Academy of Learning',
        tax_registration: '9840291840',
        cycle_name: run.cycle_name,
        period_start: run.period_start,
        period_end: run.period_end,
        reconciliation_status: run.status,
        learner: item,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
