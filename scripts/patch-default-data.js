const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const planPath = path.join(root, 'default-plan.json');
const dataPath = path.join(root, 'data.js');

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

// Shared plan references this food but omits it from the library
if (!plan.foodsLibrary.f_potato_200) {
    plan.foodsLibrary.f_potato_200 = {
        name: 'بطاطا مشوية او مسلوقة',
        category: 'carbs',
        minQuantity: { amount: 200, unit: 'g' },
        standardQuantity: { amount: 200, unit: 'g' },
        macros: { p: 4, c: 40, f: 0, cal: 170 }
    };
}

plan.dailyIntake = {
    sat: { eatenSchedule: {}, extras: [] },
    sun: { eatenSchedule: {}, extras: [] },
    mon: { eatenSchedule: {}, extras: [] },
    tue: { eatenSchedule: {}, extras: [] },
    wed: { eatenSchedule: {}, extras: [] },
    thu: { eatenSchedule: {}, extras: [] },
    fri: { eatenSchedule: {}, extras: [] }
};
plan.intakeHistory = {};
plan.bodyMetricsLog = [];
if (!plan.groceryState) {
    plan.groceryState = {
        checked: {},
        customItems: [],
        weekCount: 1,
        includedDays: {
            sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: true
        }
    };
}

fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

const defaultBlock = `// Default nutrition plan (from shared Mind2Muscle template)
const defaultData = ${JSON.stringify(plan, null, 4)};`;

let dataJs = fs.readFileSync(dataPath, 'utf8');
const startMarker = '// The default schema representing the relational database concept';
const endMarker = 'const DataManager = {';

const startIdx = dataJs.indexOf(startMarker);
const endIdx = dataJs.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Could not find defaultData block markers in data.js');
    process.exit(1);
}

dataJs = dataJs.slice(0, startIdx) + defaultBlock + '\n\n' + dataJs.slice(endIdx);
fs.writeFileSync(dataPath, dataJs, 'utf8');
console.log('Updated defaultData in data.js');
