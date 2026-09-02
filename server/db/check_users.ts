import { db } from './database.js';

console.log('--- DB INSPECTION ---');
try {
  const users = db.prepare('SELECT id, email, password_hash, full_name, role, department FROM users').all();
  console.log('Users in DB count:', users.length);
  console.table(users);
} catch (e: any) {
  console.error('Error querying users table:', e.message);
}
