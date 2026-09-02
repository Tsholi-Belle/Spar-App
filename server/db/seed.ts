import { db } from './database.js';
import { initSchema } from './schema.js';
import { randomUUID } from 'crypto';

export function seedData() {
  initSchema();

  // Check if programmes already exist
  const existingProg = db.prepare('SELECT COUNT(*) as count FROM programmes').get() as { count: number };
  if (existingProg.count > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding fresh retail youth skills development data...');

  const programmes = [
    {
      id: 'prog-baking-01',
      name: 'Bakery',
      department: 'Bakery',
      cohort_code: 'BAKE-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-06-01',
      end_date: '2026-11-30',
      target_headcount: 8,
      stipend_type: 'monthly',
      monthly_stipend: 3800.0,
      daily_rate: 190.0,
      shift_start: '06:30',
      shift_end: '15:00',
      supervisor_name: 'Chef Thabo Mokoena',
      supervisor_email: 'thabo.mokoena@spar.co.za',
      status: 'active',
    },
    {
      id: 'prog-culinary-02',
      name: 'Deli',
      department: 'Deli',
      cohort_code: 'DELI-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-06-01',
      end_date: '2026-11-30',
      target_headcount: 8,
      stipend_type: 'monthly',
      monthly_stipend: 3800.0,
      daily_rate: 190.0,
      shift_start: '07:00',
      shift_end: '15:30',
      supervisor_name: 'Chef Sarah Naidoo',
      supervisor_email: 'sarah.naidoo@spar.co.za',
      status: 'active',
    },
    {
      id: 'prog-cashier-03',
      name: 'Floor',
      department: 'Floor',
      cohort_code: 'CASH-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      target_headcount: 10,
      stipend_type: 'monthly',
      monthly_stipend: 3500.0,
      daily_rate: 175.0,
      shift_start: '08:00',
      shift_end: '16:30',
      supervisor_name: 'Nomvula Khumalo',
      supervisor_email: 'nomvula.khumalo@spar.co.za',
      status: 'active',
    },
    {
      id: 'prog-butchery-04',
      name: 'Butchery',
      department: 'Butchery',
      cohort_code: 'BUTCH-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-05-01',
      end_date: '2026-10-31',
      target_headcount: 6,
      stipend_type: 'monthly',
      monthly_stipend: 4000.0,
      daily_rate: 200.0,
      shift_start: '06:00',
      shift_end: '14:30',
      supervisor_name: 'Johan van der Merwe',
      supervisor_email: 'johan.vdm@spar.co.za',
      status: 'active',
    },
    {
      id: 'prog-merchandising-05',
      name: 'Front End',
      department: 'Front End',
      cohort_code: 'FEND-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      target_headcount: 8,
      stipend_type: 'monthly',
      monthly_stipend: 3500.0,
      daily_rate: 175.0,
      shift_start: '07:30',
      shift_end: '16:00',
      supervisor_name: 'Bongani Sithole',
      supervisor_email: 'bongani.s@spar.co.za',
      status: 'active',
    },
    {
      id: 'prog-hrm-06',
      name: 'HMR',
      department: 'HMR',
      cohort_code: 'HMR-2026-Q3',
      branch_location: 'SUPERSPAR Sandton City Flagship',
      start_date: '2026-06-01',
      end_date: '2026-11-30',
      target_headcount: 6,
      stipend_type: 'monthly',
      monthly_stipend: 3800.0,
      daily_rate: 190.0,
      shift_start: '08:00',
      shift_end: '16:30',
      supervisor_name: 'Brenda Khanyile',
      supervisor_email: 'brenda.khanyile@spar.co.za',
      status: 'active',
    },
  ];

  const insertProg = db.prepare(`
    INSERT INTO programmes (
      id, name, department, cohort_code, branch_location, start_date, end_date,
      target_headcount, stipend_type, monthly_stipend, daily_rate, shift_start, shift_end,
      supervisor_name, supervisor_email, status
    ) VALUES (
      @id, @name, @department, @cohort_code, @branch_location, @start_date, @end_date,
      @target_headcount, @stipend_type, @monthly_stipend, @daily_rate, @shift_start, @shift_end,
      @supervisor_name, @supervisor_email, @status
    )
  `);

  programmes.forEach((p) => insertProg.run(p));

  const learnersRaw = [
    // Bakery (8)
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-001',
      pin: '1001',
      first: 'Katlego',
      last: 'Molefe',
      idNum: '0304155123088',
      phone: '071 884 9201',
      email: 'katlego.m@example.com',
      bank: 'Capitec Bank',
      acc: '1489201948',
      branch: '470010',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-002',
      pin: '1002',
      first: 'Sipho',
      last: 'Dlamini',
      idNum: '0208225890081',
      phone: '082 491 3029',
      email: 'sipho.d@example.com',
      bank: 'Standard Bank',
      acc: '2938102941',
      branch: '051001',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-003',
      pin: '1003',
      first: 'Lerato',
      last: 'Mahlangu',
      idNum: '0401105432087',
      phone: '063 902 4110',
      email: 'lerato.m@example.com',
      bank: 'FNB',
      acc: '62890182391',
      branch: '250655',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-004',
      pin: '1004',
      first: 'Zanele',
      last: 'Gumede',
      idNum: '0112055981084',
      phone: '076 331 9082',
      email: 'zanele.g@example.com',
      bank: 'Nedbank',
      acc: '1982019482',
      branch: '198765',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-005',
      pin: '1005',
      first: 'Thando',
      last: 'Zulu',
      idNum: '0309185201089',
      phone: '079 401 2938',
      email: 'thando.z@example.com',
      bank: 'Capitec Bank',
      acc: '1592019481',
      branch: '470010',
      status: 'dropped_out',
      joined: '2026-06-01',
      exit_date: '2026-08-12',
      exit_reason: 'Offered full-time Baker position at regional artisan bakery',
      exit_notes: 'Learner excelled early and was recruited directly by artisan partner bakery. Positive exit.',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-006',
      pin: '1006',
      first: 'Nandi',
      last: 'Ndlovu',
      idNum: '0405195029083',
      phone: '081 229 4810',
      email: 'nandi.n@example.com',
      bank: 'Absa Bank',
      acc: '4089102941',
      branch: '632005',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-baking-01',
      code: 'LRN-BAK-007',
      pin: '1007',
      first: 'Kagiso',
      last: 'Moshoeshoe',
      idNum: '0211145391086',
      phone: '073 194 0294',
      email: 'kagiso.m@example.com',
      bank: 'TymeBank',
      acc: '51029481920',
      branch: '678910',
      status: 'active',
      joined: '2026-06-01',
    },

    // Culinary & Deli (7)
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-001',
      pin: '2001',
      first: 'Ayanda',
      last: 'Nkosi',
      idNum: '0303125192080',
      phone: '072 901 8294',
      email: 'ayanda.n@example.com',
      bank: 'Standard Bank',
      acc: '3019284910',
      branch: '051001',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-002',
      pin: '2002',
      first: 'Banele',
      last: 'Khoza',
      idNum: '0107295820085',
      phone: '084 102 9384',
      email: 'banele.k@example.com',
      bank: 'Capitec Bank',
      acc: '1490291823',
      branch: '470010',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-003',
      pin: '2003',
      first: 'Precious',
      last: 'Sithole',
      idNum: '0406085029088',
      phone: '061 930 1928',
      email: 'precious.s@example.com',
      bank: 'FNB',
      acc: '62901928471',
      branch: '250655',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-004',
      pin: '2004',
      first: 'Lungile',
      last: 'Mabaso',
      idNum: '0204175390082',
      phone: '078 291 0491',
      email: 'lungile.m@example.com',
      bank: 'Nedbank',
      acc: '1902849102',
      branch: '198765',
      status: 'medical_leave',
      joined: '2026-06-01',
      exit_notes: 'Undergoing recovery from knee surgery. Doctor notes on file for Aug 10 - Aug 28.',
    },
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-005',
      pin: '2005',
      first: 'Mpho',
      last: 'Radebe',
      idNum: '0310235910084',
      phone: '079 501 8293',
      email: 'mpho.r@example.com',
      bank: 'Absa Bank',
      acc: '4091820491',
      branch: '632005',
      status: 'active',
      joined: '2026-06-01',
    },
    {
      prog: 'prog-culinary-02',
      code: 'LRN-DEL-006',
      pin: '2006',
      first: 'Kgothatso',
      last: 'Moeketsi',
      idNum: '0402195829081',
      phone: '083 491 0293',
      email: 'kgothatso.m@example.com',
      bank: 'Capitec Bank',
      acc: '1589201940',
      branch: '470010',
      status: 'active',
      joined: '2026-06-01',
    },

    // Cashiers (9)
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-001',
      pin: '3001',
      first: 'Tshepo',
      last: 'Mthembu',
      idNum: '0408155290089',
      phone: '071 902 4810',
      email: 'tshepo.m@example.com',
      bank: 'Standard Bank',
      acc: '3109284019',
      branch: '051001',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-002',
      pin: '3002',
      first: 'Nthabiseng',
      last: 'Modise',
      idNum: '0305145920087',
      phone: '082 109 3847',
      email: 'nthabiseng.m@example.com',
      bank: 'Capitec Bank',
      acc: '1498201948',
      branch: '470010',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-003',
      pin: '3003',
      first: 'Busisiwe',
      last: 'Shabalala',
      idNum: '0209305019083',
      phone: '064 892 0194',
      email: 'busisiwe.s@example.com',
      bank: 'FNB',
      acc: '62948102941',
      branch: '250655',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-004',
      pin: '3004',
      first: 'Sibusiso',
      last: 'Ntuli',
      idNum: '0312105820080',
      phone: '076 491 0293',
      email: 'sibusiso.n@example.com',
      bank: 'Nedbank',
      acc: '1904829104',
      branch: '198765',
      status: 'dropped_out',
      joined: '2026-07-01',
      exit_date: '2026-08-18',
      exit_reason: 'Relocated with family to KwaZulu-Natal',
      exit_notes: 'Learner gave 1-week notice before family relocation. All store uniform returned.',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-005',
      pin: '3005',
      first: 'Keabetswe',
      last: 'Kekana',
      idNum: '0404045192082',
      phone: '079 192 8401',
      email: 'keabetswe.k@example.com',
      bank: 'Capitec Bank',
      acc: '1509284019',
      branch: '470010',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-006',
      pin: '3006',
      first: 'Simphiwe',
      last: 'Hlongwane',
      idNum: '0202205829088',
      phone: '081 402 9184',
      email: 'simphiwe.h@example.com',
      bank: 'Absa Bank',
      acc: '4094820194',
      branch: '632005',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-007',
      pin: '3007',
      first: 'Dineo',
      last: 'Chauke',
      idNum: '0306195029085',
      phone: '073 892 0192',
      email: 'dineo.c@example.com',
      bank: 'Standard Bank',
      acc: '3190284910',
      branch: '051001',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-cashier-03',
      code: 'LRN-CSH-008',
      pin: '3008',
      first: 'Kholofelo',
      last: 'Phiri',
      idNum: '0409095819081',
      phone: '065 918 2049',
      email: 'kholofelo.p@example.com',
      bank: 'Capitec Bank',
      acc: '1481029482',
      branch: '470010',
      status: 'active',
      joined: '2026-07-01',
    },

    // Butchery (5)
    {
      prog: 'prog-butchery-04',
      code: 'LRN-BUT-001',
      pin: '4001',
      first: 'Mlungisi',
      last: 'Sibeko',
      idNum: '0205125920084',
      phone: '072 491 0293',
      email: 'mlungisi.s@example.com',
      bank: 'FNB',
      acc: '62981029481',
      branch: '250655',
      status: 'active',
      joined: '2026-05-01',
    },
    {
      prog: 'prog-butchery-04',
      code: 'LRN-BUT-002',
      pin: '4002',
      first: 'Junior',
      last: 'Mabena',
      idNum: '0307185019089',
      phone: '083 910 2938',
      email: 'junior.m@example.com',
      bank: 'Capitec Bank',
      acc: '1590291840',
      branch: '470010',
      status: 'active',
      joined: '2026-05-01',
    },
    {
      prog: 'prog-butchery-04',
      code: 'LRN-BUT-003',
      pin: '4003',
      first: 'Siyabonga',
      last: 'Khumalo',
      idNum: '0403155829086',
      phone: '076 109 2840',
      email: 'siyabonga.k@example.com',
      bank: 'Standard Bank',
      acc: '3209184019',
      branch: '051001',
      status: 'active',
      joined: '2026-05-01',
    },
    {
      prog: 'prog-butchery-04',
      code: 'LRN-BUT-004',
      pin: '4004',
      first: 'Gontse',
      last: 'Seboko',
      idNum: '0111295910087',
      phone: '079 901 8294',
      email: 'gontse.s@example.com',
      bank: 'Nedbank',
      acc: '1908492019',
      branch: '198765',
      status: 'active',
      joined: '2026-05-01',
    },
    {
      prog: 'prog-butchery-04',
      code: 'LRN-BUT-005',
      pin: '4005',
      first: 'Anele',
      last: 'Mbanjwa',
      idNum: '0408225019081',
      phone: '061 402 9184',
      email: 'anele.m@example.com',
      bank: 'Absa Bank',
      acc: '4098201948',
      branch: '632005',
      status: 'active',
      joined: '2026-05-01',
    },

    // Merchandising (6)
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-001',
      pin: '5001',
      first: 'Thapelo',
      last: 'Semenya',
      idNum: '0308055290082',
      phone: '071 491 0294',
      email: 'thapelo.s@example.com',
      bank: 'Capitec Bank',
      acc: '1489102948',
      branch: '470010',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-002',
      pin: '5002',
      first: 'Karabo',
      last: 'Mokoena',
      idNum: '0401205910088',
      phone: '082 901 8293',
      email: 'karabo.m@example.com',
      bank: 'Standard Bank',
      acc: '3109482019',
      branch: '051001',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-003',
      pin: '5003',
      first: 'Bontle',
      last: 'Letsoalo',
      idNum: '0206145029085',
      phone: '064 102 9481',
      email: 'bontle.l@example.com',
      bank: 'FNB',
      acc: '62910294819',
      branch: '250655',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-004',
      pin: '5004',
      first: 'Nhlanhla',
      last: 'Zwane',
      idNum: '0311095819083',
      phone: '076 902 4819',
      email: 'nhlanhla.z@example.com',
      bank: 'Nedbank',
      acc: '1909482019',
      branch: '198765',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-005',
      pin: '5005',
      first: 'Refilwe',
      last: 'Tladi',
      idNum: '0404165920087',
      phone: '079 491 0293',
      email: 'refilwe.t@example.com',
      bank: 'Capitec Bank',
      acc: '1509182940',
      branch: '470010',
      status: 'active',
      joined: '2026-07-01',
    },
    {
      prog: 'prog-merchandising-05',
      code: 'LRN-MRC-006',
      pin: '5006',
      first: 'Kgomotso',
      last: 'Phalane',
      idNum: '0309285019084',
      phone: '081 902 4810',
      email: 'kgomotso.p@example.com',
      bank: 'Absa Bank',
      acc: '4091029482',
      branch: '632005',
      status: 'active',
      joined: '2026-07-01',
    },
  ];

  const insertLearner = db.prepare(`
    INSERT INTO learners (
      id, programme_id, learner_code, pin_code, first_name, last_name, id_number,
      phone, email, bank_name, account_number, branch_code, account_type,
      status, joined_date, exit_date, exit_reason, exit_notes
    ) VALUES (
      @id, @prog, @code, @pin, @first, @last, @idNum,
      @phone, @email, @bank, @acc, @branch, 'savings',
      @status, @joined, @exit_date, @exit_reason, @exit_notes
    )
  `);

  const createdLearners: any[] = [];
  learnersRaw.forEach((lrn) => {
    const id = `lrn-${randomUUID().slice(0, 8)}`;
    const record = {
      id,
      prog: lrn.prog,
      code: lrn.code,
      pin: lrn.pin,
      first: lrn.first,
      last: lrn.last,
      idNum: lrn.idNum,
      phone: lrn.phone,
      email: lrn.email,
      bank: lrn.bank,
      acc: lrn.acc,
      branch: lrn.branch,
      status: lrn.status,
      joined: lrn.joined,
      exit_date: (lrn as any).exit_date || null,
      exit_reason: (lrn as any).exit_reason || null,
      exit_notes: (lrn as any).exit_notes || null,
    };
    insertLearner.run(record);
    createdLearners.push(record);
  });

  // Seed Attendance for August 2026 (weekdays from Aug 3, 2026 up to Aug 25, 2026)
  console.log('Generating realistic August 2026 attendance records...');
  const augustWorkingDays = [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25',
  ];

  const insertAtt = db.prepare(`
    INSERT INTO attendance_records (
      id, learner_id, programme_id, date, status, clock_in_time, clock_out_time,
      hours_worked, supervisor_notes, has_medical_note
    ) VALUES (
      @id, @learner_id, @programme_id, @date, @status, @clock_in_time, @clock_out_time,
      @hours_worked, @supervisor_notes, @has_medical_note
    )
  `);

  createdLearners.forEach((lrn) => {
    augustWorkingDays.forEach((dayStr, dayIndex) => {
      // Check if learner has dropped out before this date
      if (lrn.exit_date && dayStr > lrn.exit_date) {
        // Record as left_program
        insertAtt.run({
          id: `att-${randomUUID().slice(0, 8)}`,
          learner_id: lrn.id,
          programme_id: lrn.prog,
          date: dayStr,
          status: 'left_program',
          clock_in_time: null,
          clock_out_time: null,
          hours_worked: 0,
          supervisor_notes: `Learner exited programme on ${lrn.exit_date}. Reason: ${lrn.exit_reason}`,
          has_medical_note: 0,
        });
        return;
      }

      // Check if learner is on medical leave
      if (lrn.status === 'medical_leave' && dayIndex >= 5) {
        insertAtt.run({
          id: `att-${randomUUID().slice(0, 8)}`,
          learner_id: lrn.id,
          programme_id: lrn.prog,
          date: dayStr,
          status: 'excused_sick',
          clock_in_time: null,
          clock_out_time: null,
          hours_worked: 0,
          supervisor_notes: 'Medical leave certificate on file (Surgery & recovery)',
          has_medical_note: 1,
        });
        return;
      }

      // Realistic pseudo-random deterministic status based on hash
      const hash = (lrn.code.charCodeAt(lrn.code.length - 1) * 31 + dayIndex * 17) % 100;

      let status = 'present';
      let inTime = '07:25';
      let outTime = '16:05';
      let hours = 8.5;
      let notes: string | null = null;
      let medNote = 0;

      if (hash < 3) {
        // Unexcused absent
        status = 'unexcused_absent';
        inTime = '';
        outTime = '';
        hours = 0;
        notes = 'No call, no show. Supervisor contacted learner.';
      } else if (hash < 6) {
        // Excused sick
        status = 'excused_sick';
        inTime = '';
        outTime = '';
        hours = 0;
        notes = 'Clinic certificate submitted via WhatsApp';
        medNote = 1;
      } else if (hash < 11) {
        // Late
        status = 'late';
        inTime = '08:15';
        outTime = '16:05';
        hours = 7.75;
        notes = 'Transport delay / taxi strike';
      } else if (hash < 14) {
        // Half day
        status = 'half_day';
        inTime = '07:30';
        outTime = '12:00';
        hours = 4.5;
        notes = 'Permission granted for family appointment';
      }

      insertAtt.run({
        id: `att-${randomUUID().slice(0, 8)}`,
        learner_id: lrn.id,
        programme_id: lrn.prog,
        date: dayStr,
        status,
        clock_in_time: inTime || null,
        clock_out_time: outTime || null,
        hours_worked: hours,
        supervisor_notes: notes,
        has_medical_note: medNote,
      });
    });
  });

  // Seed July 2026 Completed Reconciliation Cycle as Historical Reference
  console.log('Seeding July 2026 reconciled pay cycle...');
  const recId = 'rec-july-2026-baking';
  const insertRec = db.prepare(`
    INSERT INTO reconciliations (
      id, programme_id, cycle_name, period_start, period_end, total_learners,
      total_gross_amount, total_deductions, total_net_payout, status, notes,
      approved_by, approved_at, paid_at
    ) VALUES (
      @id, @programme_id, @cycle_name, @period_start, @period_end, @total_learners,
      @total_gross_amount, @total_deductions, @total_net_payout, 'paid', @notes,
      'Store Manager - Brenda Khanyile', '2026-07-31 14:30:00', '2026-08-01 09:00:00'
    )
  `);

  insertRec.run({
    id: recId,
    programme_id: 'prog-baking-01',
    cycle_name: 'July 2026 Baking Programme Stipend Settlement',
    period_start: '2026-07-01',
    period_end: '2026-07-31',
    total_learners: 7,
    total_gross_amount: 26600.0,
    total_deductions: 570.0,
    total_net_payout: 26030.0,
    notes: 'Standard July monthly stipend reconciliation. All verified by Chef Thabo.',
  });

  // Audit log entry
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    randomUUID(),
    'SYSTEM_INIT',
    'system',
    'root',
    'Database initialized and seeded with retail programmes and learners.',
    'System Admin'
  );

  console.log('Database seeding complete! Total learners:', createdLearners.length);
}

// If executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedData();
}
