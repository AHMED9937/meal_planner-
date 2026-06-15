const fs = require('fs');
const path = require('path');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node scripts/extract-default-plan.js <url-with-plan-param>');
    process.exit(1);
}

const u = new URL(url);
const base64 = u.searchParams.get('plan');
if (!base64) {
    console.error('No plan param in URL');
    process.exit(1);
}

const plan = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

// Fresh start: no personal tracking history in defaults
delete plan.intakeHistory;
plan.bodyMetricsLog = [];
plan.dailyIntake = {
    sat: { eatenSchedule: {}, extras: [] },
    sun: { eatenSchedule: {}, extras: [] },
    mon: { eatenSchedule: {}, extras: [] },
    tue: { eatenSchedule: {}, extras: [] },
    wed: { eatenSchedule: {}, extras: [] },
    thu: { eatenSchedule: {}, extras: [] },
    fri: { eatenSchedule: {}, extras: [] }
};
if (plan.groceryState) {
    plan.groceryState.checked = {};
    plan.groceryState.customItems = [];
    plan.groceryState.weekCount = plan.groceryState.weekCount || 1;
}

const outPath = path.join(__dirname, '..', 'default-plan.json');
fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf8');
console.log('Wrote', outPath);
console.log('Foods:', Object.keys(plan.foodsLibrary).length);
console.log('Meals:', Object.keys(plan.mealsLibrary).length);
