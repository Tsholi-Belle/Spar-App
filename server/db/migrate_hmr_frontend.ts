import { db } from './database.js';

export function migrateToHmrAndFrontEnd() {
  console.log('Migrating departments: HRM -> HMR and Produce -> Front End...');

  const updateStmt = db.transaction(() => {
    // Update programmes
    db.prepare("UPDATE programmes SET department = 'HMR' WHERE department = 'HRM'").run();
    db.prepare("UPDATE programmes SET department = 'Front End' WHERE department = 'Produce'").run();

    // Update programme titles
    db.prepare(`
      UPDATE programmes 
      SET name = 'Home Meal Replacement & Hot Prepared Foods (HMR)',
          cohort_code = 'HMR-2026-Q3'
      WHERE department = 'HMR'
    `).run();

    db.prepare(`
      UPDATE programmes 
      SET name = 'Front End Cashiers, Point of Sale & Customer Care',
          cohort_code = 'FEND-2026-Q3'
      WHERE department = 'Front End'
    `).run();
  });

  updateStmt();
  console.log('Migration to HMR and Front End completed.');
}

migrateToHmrAndFrontEnd();
