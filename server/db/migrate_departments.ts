import { db } from './database.js';

export function migrateDepartments() {
  console.log('Migrating departments to: Floor, HRM, Bakery, Butchery, Deli, Produce...');

  const migrationMap: Record<string, string> = {
    'Baking': 'Bakery',
    'Culinary': 'Deli',
    'Cashier': 'Floor',
    'Merchandising': 'Produce',
    'Admin': 'HRM',
    'Butchery': 'Butchery',
  };

  const updateProgrammes = db.transaction(() => {
    for (const [oldDept, newDept] of Object.entries(migrationMap)) {
      db.prepare('UPDATE programmes SET department = ? WHERE department = ?').run(newDept, oldDept);
    }

    // Ensure we have an HRM programme
    const hrmProg = db.prepare("SELECT id FROM programmes WHERE department = 'HRM'").get();
    if (!hrmProg) {
      db.prepare(`
        INSERT INTO programmes (
          id, name, department, cohort_code, branch_location, start_date, end_date,
          target_headcount, stipend_type, monthly_stipend, daily_rate, shift_start,
          shift_end, supervisor_name, supervisor_email, status
        ) VALUES (
          'prog-hrm-06', 'Store Human Resource Management & Training (HRM)', 'HRM',
          'HRM-2026-Q3', 'SUPERSPAR Sandton City Flagship', '2026-06-01', '2026-11-30',
          6, 'monthly', 3800.0, 190.0, '08:00', '16:30', 'Brenda Khanyile',
          'brenda.khanyile@spar.co.za', 'active'
        )
      `).run();
    }

    // Update programme names
    db.prepare(`
      UPDATE programmes 
      SET name = 'Artisan Bakery & Pastry Arts Programme',
          branch_location = 'SUPERSPAR Sandton City Flagship'
      WHERE department = 'Bakery'
    `).run();

    db.prepare(`
      UPDATE programmes 
      SET name = 'Culinary Arts & Hot Deli Operations',
          branch_location = 'SUPERSPAR Sandton City Flagship'
      WHERE department = 'Deli'
    `).run();

    db.prepare(`
      UPDATE programmes 
      SET name = 'Retail Floor Operations, Customer Care & POS',
          branch_location = 'SUPERSPAR Sandton City Flagship'
      WHERE department = 'Floor'
    `).run();

    db.prepare(`
      UPDATE programmes 
      SET name = 'Fresh Produce, Fruit & Veg Merchandising',
          branch_location = 'SUPERSPAR Sandton City Flagship'
      WHERE department = 'Produce'
    `).run();

    db.prepare(`
      UPDATE programmes 
      SET name = 'Retail Meat Processing & Butchery Apprenticeship',
          branch_location = 'SUPERSPAR Sandton City Flagship'
      WHERE department = 'Butchery'
    `).run();
  });

  updateProgrammes();
  console.log('Department migration completed successfully.');
}

migrateDepartments();
