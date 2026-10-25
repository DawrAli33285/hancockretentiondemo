// Generates the Hancock Health demo files. Every person is FICTIONAL
// (example.com addresses, 555-01xx phones):
//   samples/Hancock Health - Current Staff Demo.xlsx (and .csv)  nurses, physicians and staff, with recent leavers
//   samples/Hancock Health - Pre-hire Demo.xlsx (and .csv)       candidates for the same roles
//   public/templates/current_staff_sample.csv, prehire_sample.csv (same data, downloadable from the Upload page)
// Upload the staff file first: its leavers build the job-class turnover table the pre-hire run then uses.
//   node scripts/make-hancock-samples.js
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const { seededRandom } = require('../server/providers/util');

const rnd = seededRandom('hancock-health-demo-v1');
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = (a, b) => a + rnd() * (b - a);
const FIRST = ['Avery', 'Blake', 'Carter', 'Delaney', 'Emerson', 'Finley', 'Grace', 'Harper', 'Jordan', 'Kendall', 'Logan', 'Morgan', 'Noah', 'Olivia', 'Parker', 'Quinn', 'Riley', 'Sawyer', 'Taylor', 'Wren'];
const LAST = ['Abbott', 'Brewer', 'Collins', 'Dawson', 'Ellis', 'Fowler', 'Garrett', 'Holloway', 'Ingram', 'Jarvis', 'Keller', 'Lambert', 'Mercer', 'Norris', 'Osborne', 'Pruitt', 'Ramsey', 'Sutton', 'Tanner', 'Whitaker'];
// Towns near Greenfield and approximate miles (ZIP centre) to Hancock Regional Hospital.
const TOWNS = [
  ['Greenfield', 'IN', '46140', 2.4], ['Greenfield', 'IN', '46140', 3.1], ['New Palestine', 'IN', '46163', 8.8], ['McCordsville', 'IN', '46055', 11.2],
  ['Fortville', 'IN', '46040', 10.2], ['Indianapolis', 'IN', '46229', 11.1], ['Indianapolis', 'IN', '46236', 12.0], ['Shelbyville', 'IN', '46176', 20.2],
  ['Knightstown', 'IN', '46148', 13.0], ['Fishers', 'IN', '46037', 14.9], ['Pendleton', 'IN', '46064', 13.9], ['Wilkinson', 'IN', '46186', 10.7], ['Carthage', 'IN', '46115', 10.9],
];
const STREETS = ['State', 'Main', 'Broadway', 'Apple', 'Pennsylvania', 'Franklin', 'Morristown', 'Brandywine', 'Meridian', 'Davis'];
// Roles: [job class, department, division, active, leavers in last 12 months, salary range, years on the job]
const ROLES = [
  ['Staff Nurse RN', 'HRH 3N Med-Surg', 'Nursing', 18, 5, [68000, 86000], [0.3, 14]],
  ['Staff Nurse RN', 'HRH E R', 'Nursing', 14, 4, [70000, 90000], [0.3, 12]],
  ['Staff Nurse RN', 'HRH Hancock OB Svcs', 'Nursing', 8, 2, [70000, 88000], [0.5, 16]],
  ['Staff Nurse RN', 'HRH CCU', 'Nursing', 7, 2, [74000, 94000], [0.5, 15]],
  ['Staff Nurse RN', 'HRH Surgery', 'Nursing', 8, 1, [72000, 92000], [1, 18]],
  ['Nurse RN Outpatient', 'HRH Med Oncology', 'Nursing', 6, 1, [70000, 86000], [1, 15]],
  ['LPN', 'HRH Gateway Primary Care', 'Nursing', 5, 2, [46000, 56000], [0.3, 10]],
  ['Hospitalist Physician', 'HRH Hospitalists', 'Medical Staff', 6, 1, [255000, 320000], [0.5, 12]],
  ['Family Medicine Physician', 'HRH Gateway Primary Care', 'Medical Staff', 6, 1, [235000, 290000], [1, 20]],
  ['Emergency Physician', 'HRH E R', 'Medical Staff', 5, 0, [320000, 390000], [1, 15]],
  ['Nurse Practitioner', 'HRH Gateway Primary Care', 'Medical Staff', 5, 1, [112000, 135000], [0.5, 10]],
  ['Patient Care Tech', 'HRH 3N Med-Surg', 'Clinical Support', 10, 4, [34000, 40000], [0.2, 8]],
  ['ER Tech', 'HRH E R', 'Clinical Support', 6, 3, [35000, 42000], [0.2, 6]],
  ['Medical Assistant', 'HRH Gateway Primary Care', 'Clinical Support', 10, 4, [36000, 43000], [0.2, 9]],
  ['Respiratory Therapist', 'HRH Cardiopulmonary', 'Clinical Support', 5, 1, [62000, 76000], [0.5, 15]],
  ['Radiologic Technologist', 'HRH Diag Imaging', 'Clinical Support', 6, 1, [56000, 70000], [0.5, 15]],
  ['Surgical Technologist', 'HRH Surgery', 'Clinical Support', 5, 1, [47000, 58000], [0.5, 12]],
  ['Pharmacy Technician', 'HRH Pharmacy', 'Clinical Support', 5, 2, [37000, 45000], [0.3, 10]],
  ['Housekeeper', 'HRH Housekeeping', 'Support Services', 12, 5, [30000, 35000], [0.2, 10]],
  ['Nutrition Technician', 'HRH Nutritional Ser', 'Support Services', 9, 4, [29000, 34000], [0.2, 8]],
  ['Patient Access Advocate', 'HRH Network Navigation', 'Support Services', 8, 1, [34000, 41000], [0.3, 12]],
  ['Public Safety Officer', 'HRH Public Safety', 'Support Services', 5, 1, [38000, 47000], [0.5, 12]],
];
const REASONS = ['Resigned', 'Another Job', 'Better Pay Elsewhere', 'Relocation', 'Schedule Conflict', 'Personal Reasons'];
const fmt = (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
const daysAgo = (n) => new Date(Date.now() - Math.round(n) * 86400000);
const person = (i) => {
  const first = FIRST[(i * 7 + 3) % FIRST.length]; const last = LAST[(i * 11 + Math.floor(i / FIRST.length)) % LAST.length];
  const [city, st, zip, miles] = pick(TOWNS);
  return { first, last, city, st, zip, miles: Math.round(Math.max(0.8, miles + between(-1.2, 2)) * 10) / 10, street: `${100 + Math.floor(rnd() * 9800)} ${pick(STREETS)} ${pick(['St', 'Rd', 'Dr', 'Ln', 'Ct'])}`, phone: `(317) 555-01${String(i % 100).padStart(2, '0')}`, email: `${first}.${last}${i}@example.com`.toLowerCase() };
};

let serial = 0;
const staff = [];
function addStaff([job, dept, division, , , salary, years], left) {
  const i = serial++; const p = person(i); const termDays = left ? between(15, 340) : 0;
  staff.push({
    'Employee Number': String(900100 + i).padStart(6, '0'), 'Employee Name (Last Suffix, First MI)': `${p.last}, ${p.first} ${'ABCDEFGHJKLMNPRSTW'[i % 18]}`,
    'Address Line 1 + Address Line 2': p.street, 'City, State Zip Code (Formatted)': `${p.city}, ${p.st} ${p.zip}`, 'E-mail Address': p.email, 'Home Phone (Formatted)': p.phone,
    'Hire Date': fmt(daysAgo(termDays + between(...years) * 365)), 'Term Date': left ? fmt(daysAgo(termDays)) : '', 'Termination Reason': left ? pick(REASONS) : '',
    'Employment Status': left ? 'Terminated' : 'Active', Organization: 'Hancock Health', Division: division, Department: dept, 'Job Class': job,
    'Distance (Miles)': p.miles, 'Annual Salary': Math.round(between(...salary) / 500) * 500,
  });
}
for (const r of ROLES) { for (let k = 0; k < r[3]; k++) addStaff(r, false); for (let k = 0; k < r[4]; k++) addStaff(r, true); }
for (let i = staff.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [staff[i], staff[j]] = [staff[j], staff[i]]; }

const prehire = [];
const OPEN = [ROLES[0], ROLES[1], ROLES[2], ROLES[3], ROLES[7], ROLES[8], ROLES[10], ROLES[11], ROLES[12], ROLES[13], ROLES[15], ROLES[18], ROLES[19]];
for (let i = 0; i < 20; i++) {
  const p = person(400 + i); const [job, dept] = OPEN[i % OPEN.length];
  prehire.push({
    'Candidate (Last, Suffix First MI)': `${p.last}, ${p.first}`, 'Source Job': job, 'Opportunity Title': `${job} - ${dept.replace('HRH ', '')}`,
    'Source Job Code': `HH-${1000 + OPEN.indexOf(OPEN[i % OPEN.length])}`, 'Department Name': dept, 'Email Address': p.email, 'Primary Phone': p.phone,
    'Address 1': p.street, City: p.city, 'State/Province Code': p.st, 'Zip/Postal Code': p.zip, 'Distance (Miles)': p.miles,
  });
}

async function xlsx(file, sheet, rows) {
  const wb = new ExcelJS.Workbook(); wb.creator = 'Hancock Health';
  const ws = wb.addWorksheet(sheet);
  ws.columns = Object.keys(rows[0]).map((h) => ({ header: h, key: h, width: Math.max(12, Math.min(38, h.length + 2)) }));
  rows.forEach((r) => ws.addRow(r)); ws.getRow(1).font = { bold: true };
  await wb.xlsx.writeFile(file);
}

(async () => {
  const root = path.join(__dirname, '..');
  const S = (f) => path.join(root, 'samples', f);
  fs.mkdirSync(path.join(root, 'samples'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public', 'templates', 'current_staff_sample.csv'), Papa.unparse(staff));
  fs.writeFileSync(path.join(root, 'public', 'templates', 'prehire_sample.csv'), Papa.unparse(prehire));
  fs.writeFileSync(S('Hancock Health - Current Staff Demo.csv'), Papa.unparse(staff));
  fs.writeFileSync(S('Hancock Health - Pre-hire Demo.csv'), Papa.unparse(prehire));
  await xlsx(S('Hancock Health - Current Staff Demo.xlsx'), 'Active Staff', staff);
  await xlsx(S('Hancock Health - Pre-hire Demo.xlsx'), 'Summary', prehire);
  const left = staff.filter((r) => r['Employment Status'] === 'Terminated').length;
  console.log(`Hancock demo: ${staff.length} staff rows (${left} leavers), ${prehire.length} candidates`);
})();
