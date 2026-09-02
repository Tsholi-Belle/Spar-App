import { db } from './database.js';

export function updateProgramNamesStrict() {
  console.log('Cleaning up program names to strictly HMR, Floor, Bakery, Butchery, Deli, Front End...');

  const updateStmt = db.transaction(() => {
    // Set program name strictly equal to department name
    db.prepare("UPDATE programmes SET name = 'Bakery' WHERE department = 'Bakery'").run();
    db.prepare("UPDATE programmes SET name = 'Deli' WHERE department = 'Deli'").run();
    db.prepare("UPDATE programmes SET name = 'Floor' WHERE department = 'Floor'").run();
    db.prepare("UPDATE programmes SET name = 'Butchery' WHERE department = 'Butchery'").run();
    db.prepare("UPDATE programmes SET name = 'HMR' WHERE department = 'HMR'").run();
    db.prepare("UPDATE programmes SET name = 'Front End' WHERE department = 'Front End'").run();

    // Verify all rows in programmes table
    const allProgs = db.prepare('SELECT id, name, department, cohort_code FROM programmes').all();
    console.log('Current programmes in database:');
    console.table(allProgs);
  });

  updateStmt();
  console.log('Strict program names updated successfully.');
}

updateProgramNamesStrict();
