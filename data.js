// data.js - Relational Database State Manager (Contextual Alternatives + Macros)

const STORAGE_KEY = 'm2m_relational_plan_v12';

const WEEK_DAY_ORDER = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

const WEEK_DAYS = {
    sat: { id: 'sat', label: 'السبت', short: 'سب' },
    sun: { id: 'sun', label: 'الأحد', short: 'أحد' },
    mon: { id: 'mon', label: 'الإثنين', short: 'إث' },
    tue: { id: 'tue', label: 'الثلاثاء', short: 'ثلا' },
    wed: { id: 'wed', label: 'الأربعاء', short: 'أرب' },
    thu: { id: 'thu', label: 'الخميس', short: 'خم' },
    fri: { id: 'fri', label: 'الجمعة', short: 'جم' }
};

const DEFAULT_DAY_SCHEDULE = [
    { id: 'schedule_1', time: 'الساعة (5:00)', mealTemplateId: 'mt_1', allowedMealAlternatives: [] },
    { id: 'schedule_2', time: 'الساعة ( 6:10 )', mealTemplateId: 'mt_2', allowedMealAlternatives: [] },
    { id: 'schedule_3', time: 'الساعة (9:00)', mealTemplateId: 'mt_3', allowedMealAlternatives: [] },
    { id: 'schedule_4', time: 'الساعة (11:00)', mealTemplateId: 'mt_4', allowedMealAlternatives: [] },
    { id: 'schedule_5', time: 'الساعة ( 4:30 )', mealTemplateId: 'mt_5', allowedMealAlternatives: [] }
];

function buildEmptyWeeklyPlan() {
    const wp = {};
    WEEK_DAY_ORDER.forEach(dayId => {
        wp[dayId] = [];
    });
    return wp;
}

function buildDefaultWeeklyPlan() {
    const wp = buildEmptyWeeklyPlan();
    const cloned = JSON.parse(JSON.stringify(DEFAULT_DAY_SCHEDULE));
    WEEK_DAY_ORDER.forEach(dayId => {
        wp[dayId] = JSON.parse(JSON.stringify(cloned));
    });
    return wp;
}

function buildEmptyDailyIntake() {
    const di = {};
    WEEK_DAY_ORDER.forEach(dayId => {
        di[dayId] = { eatenSchedule: {}, extras: [] };
    });
    return di;
}

const FOOD_CATEGORY_ORDER = ['protein', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'other'];

const MEAL_CATEGORY_ORDER = [
    'pre_workout',
    'post_workout',
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'late_snack',
    'other'
];

const MEAL_CATEGORIES = {
    pre_workout: { id: 'pre_workout', label: 'قبل التمرين', icon: 'fa-person-running' },
    post_workout: { id: 'post_workout', label: 'بعد التمرين', icon: 'fa-dumbbell' },
    breakfast: { id: 'breakfast', label: 'فطور', icon: 'fa-mug-saucer' },
    lunch: { id: 'lunch', label: 'غداء', icon: 'fa-sun' },
    dinner: { id: 'dinner', label: 'عشاء', icon: 'fa-moon' },
    snack: { id: 'snack', label: 'وجبة خفيفة', icon: 'fa-cookie-bite' },
    late_snack: { id: 'late_snack', label: 'وجبة متأخرة', icon: 'fa-clock' },
    other: { id: 'other', label: 'أخرى', icon: 'fa-ellipsis' }
};

const FOOD_CATEGORIES = {
    protein: { id: 'protein', label: 'بروتين', icon: 'fa-drumstick-bite' },
    carbs: { id: 'carbs', label: 'كربوهيدرات', icon: 'fa-bread-slice' },
    vegetables: { id: 'vegetables', label: 'خضار', icon: 'fa-leaf' },
    fruits: { id: 'fruits', label: 'فواكه', icon: 'fa-apple-whole' },
    dairy: { id: 'dairy', label: 'ألبان', icon: 'fa-cheese' },
    fats: { id: 'fats', label: 'دهون', icon: 'fa-bottle-droplet' },
    other: { id: 'other', label: 'أخرى', icon: 'fa-ellipsis' }
};

const QUANTITY_UNITS = [
    { id: 'g', label: 'غرام (g)' },
    { id: 'kg', label: 'كيلوغرام (kg)' },
    { id: 'ml', label: 'مليلتر (ml)' },
    { id: 'num', label: 'عدد / قطعة' },
    { id: 'cup', label: 'كوب' },
    { id: 'tbsp', label: 'ملعقة' }
];

const QUANTITY_UNIT_SHORT = {
    g: 'غ',
    kg: 'كغ',
    ml: 'مل',
    num: 'قطعة',
    cup: 'كوب',
    tbsp: 'ملعقة'
};

// The default schema representing the relational database concept
const defaultData = {
    planTitle: "Nutrition Plan",
    planSubtitle: "خطة التغذية المخصصة",
    rules: [
        "شرب 3 لتر على مدار اليوم (مهم جدا!!)",
        "مراعات النوم الجيد",
        "أيام بدون تمرين ( الجمعة )"
    ],

    // Table 1: Global Food Library
    // An object mapping foodId -> foodObject (Foods are now just primitive naming blocks)
    foodsLibrary: {
        "f_dates": {
            name: "تمرات",
            category: "fruits",
            standardQuantity: { amount: 3, unit: "num" },
            macros: { p: 1, c: 20, f: 0, cal: 85 }
        },
        "f_juice": {
            name: "عصير ( 1 موزة + نص كوب لبن قليل الدسم 120مل )",
            category: "fruits",
            standardQuantity: { amount: 1, unit: "cup" },
            macros: { p: 5, c: 35, f: 2, cal: 170 }
        },
        "f_chicken_400": {
            name: "صدر فرخة مشوي",
            category: "protein",
            standardQuantity: { amount: 400, unit: "g" },
            macros: { p: 124, c: 0, f: 14, cal: 660 }
        },
        "f_meat_150": {
            name: "لحمة مشوية او مسلوقة",
            category: "protein",
            standardQuantity: { amount: 150, unit: "g" },
            macros: { p: 39, c: 0, f: 12, cal: 260 }
        },
        "f_fish_450": {
            name: "سمك مشوي",
            category: "protein",
            standardQuantity: { amount: 450, unit: "g" },
            macros: { p: 90, c: 0, f: 10, cal: 480 }
        },
        "f_tuna_420": {
            name: "تونة مصفاة",
            category: "protein",
            standardQuantity: { amount: 420, unit: "g" },
            macros: { p: 95, c: 0, f: 4, cal: 440 }
        },
        "f_rice_150": {
            name: "ارز ابيض",
            category: "carbs",
            standardQuantity: { amount: 150, unit: "g" },
            macros: { p: 4, c: 42, f: 0, cal: 195 }
        },
        "f_salad": {
            name: "طبق سلطة بالليمون",
            category: "vegetables",
            standardQuantity: { amount: 1, unit: "num" },
            macros: { p: 2, c: 10, f: 0, cal: 50 }
        },
        "f_veg_250": {
            name: "خضار مطبوخ",
            category: "vegetables",
            standardQuantity: { amount: 250, unit: "g" },
            macros: { p: 5, c: 20, f: 0, cal: 100 }
        },
        "f_orange": {
            name: "برتقالة متوسطة",
            category: "fruits",
            standardQuantity: { amount: 1, unit: "num" },
            macros: { p: 1, c: 15, f: 0, cal: 62 }
        },
        "f_potato_200": {
            name: "بطاطا مشوية او مسلوقة",
            category: "carbs",
            standardQuantity: { amount: 200, unit: "g" },
            macros: { p: 4, c: 40, f: 0, cal: 170 }
        },
        "f_yogurt_250": {
            name: "علبة زبادي يوناني لايت",
            category: "dairy",
            standardQuantity: { amount: 250, unit: "g" },
            macros: { p: 15, c: 10, f: 0, cal: 100 }
        },
        "f_chicken_250": {
            name: "صدر فراخ مشوية",
            category: "protein",
            standardQuantity: { amount: 250, unit: "g" },
            macros: { p: 77, c: 0, f: 9, cal: 412 }
        },
        "f_thighs_200": {
            name: "وراك فراخ مشوية - ملاحظة: استبدل بيضة كاملة ببياض في الوجبة 5",
            category: "protein",
            standardQuantity: { amount: 200, unit: "g" },
            macros: { p: 48, c: 0, f: 16, cal: 350 }
        },
        "f_eggs": {
            name: "1 بيضة كاملة + 5 بياض بيض",
            category: "protein",
            standardQuantity: { amount: 6, unit: "num" },
            macros: { p: 24, c: 1, f: 5, cal: 150 }
        },
        "f_cottage_100": {
            name: "جبنة قريش",
            category: "dairy",
            standardQuantity: { amount: 100, unit: "g" },
            macros: { p: 11, c: 3, f: 4, cal: 98 }
        },
        "f_beans_250": {
            name: "فول",
            category: "carbs",
            standardQuantity: { amount: 250, unit: "g" },
            macros: { p: 15, c: 40, f: 1, cal: 230 }
        }
    },

    // Table 2: Global Meal Templates Library
    // An object mapping mealTemplateId -> mealObject
    // Alternatives are now securely defined in the Component slot
    mealsLibrary: {
        "mt_1": {
            name: "MEAL 1 (Pre-workout)",
            category: "pre_workout",
            allowedMealAlternatives: [],
            components: [
                { activeFoodId: "f_dates", allowedAlternatives: [] },
                { activeFoodId: "f_juice", allowedAlternatives: [] }
            ]
        },
        "mt_2": {
            name: "MEAL 2 (Post-workout)",
            category: "post_workout",
            allowedMealAlternatives: [],
            components: [
                { activeFoodId: "f_chicken_400", allowedAlternatives: ["f_meat_150", "f_fish_450", "f_tuna_420"] },
                { activeFoodId: "f_rice_150", allowedAlternatives: [] },
                { activeFoodId: "f_salad", allowedAlternatives: [] },
                { activeFoodId: "f_veg_250", allowedAlternatives: [] }
            ]
        },
        "mt_3": {
            name: "MEAL 3 (Snack)",
            category: "snack",
            allowedMealAlternatives: [],
            components: [
                { activeFoodId: "f_orange", allowedAlternatives: [] },
                { activeFoodId: "f_potato_200", allowedAlternatives: [] }
            ]
        },
        "mt_4": {
            name: "MEAL 4 (Dinner)",
            category: "dinner",
            allowedMealAlternatives: [],
            components: [
                { activeFoodId: "f_yogurt_250", allowedAlternatives: [] },
                { activeFoodId: "f_chicken_250", allowedAlternatives: ["f_thighs_200"] }
            ]
        },
        "mt_5": {
            name: "MEAL 5 (Late Snack)",
            category: "late_snack",
            allowedMealAlternatives: [],
            components: [
                { activeFoodId: "f_eggs", allowedAlternatives: [] },
                { activeFoodId: "f_cottage_100", allowedAlternatives: [] },
                { activeFoodId: "f_beans_250", allowedAlternatives: [] }
            ]
        }
    },

    // Table 3: Weekly schedule (7 days)
    weeklyPlan: buildDefaultWeeklyPlan(),

    // Grocery checklist state (checked keys, custom lines, which days to include)
    groceryState: {
        checked: {},
        customItems: [],
        weekCount: 1,
        includedDays: {
            sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: true
        }
    },

    // Daily food diary: what was actually eaten per plan week-day (rotating template)
    dailyIntake: buildEmptyDailyIntake(),

    // Calendar-based history for weekly/monthly reports (YYYY-MM-DD)
    intakeHistory: {},

    // Body progress: weight, body fat %, muscle mass, etc.
    bodyMetricsLog: []
};

const DataManager = {
    FOOD_CATEGORY_ORDER,
    FOOD_CATEGORIES,
    MEAL_CATEGORY_ORDER,
    MEAL_CATEGORIES,
    WEEK_DAY_ORDER,
    WEEK_DAYS,
    QUANTITY_UNITS,
    QUANTITY_UNIT_SHORT,

    getTodayDayId: function () {
        const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return map[new Date().getDay()];
    },

    getDayLabel: function (dayId) {
        return WEEK_DAYS[dayId]?.label || dayId;
    },

    ensureWeeklyPlan: function (plan) {
        if (!plan.weeklyPlan) {
            if (plan.activePlan && Array.isArray(plan.activePlan)) {
                plan.weeklyPlan = buildEmptyWeeklyPlan();
                const legacy = JSON.parse(JSON.stringify(plan.activePlan));
                WEEK_DAY_ORDER.forEach(dayId => {
                    plan.weeklyPlan[dayId] = JSON.parse(JSON.stringify(legacy));
                });
                delete plan.activePlan;
            } else {
                plan.weeklyPlan = buildEmptyWeeklyPlan();
            }
        }
        WEEK_DAY_ORDER.forEach(dayId => {
            if (!Array.isArray(plan.weeklyPlan[dayId])) {
                plan.weeklyPlan[dayId] = [];
            }
        });
        return plan.weeklyPlan;
    },

    getDaySchedule: function (plan, dayId) {
        const wp = this.ensureWeeklyPlan(plan);
        return wp[dayId] || [];
    },

    computeDayMacros: function (plan, dayId) {
        const slots = this.getDaySchedule(plan, dayId);
        let totals = this.emptyMacros();
        const mealsLibrary = plan.mealsLibrary;
        const foodsLibrary = plan.foodsLibrary;
        slots.forEach(entry => {
            if (!entry || !entry.mealTemplateId) return;
            this.normalizeScheduleEntry(entry);
            totals = this.addMacros(totals, this.computeScheduleSlotMacros(plan, entry));
        });
        return totals;
    },

    formatMacrosSummary: function (macros, options) {
        options = options || {};
        macros = this.normalizeMacros(macros);
        const fmt = (n) => this.formatMacroDisplay(n);
        if (options.compact) {
            return `${fmt(macros.cal)} Cal`;
        }
        return `P: ${fmt(macros.p)}g · C: ${fmt(macros.c)}g · F: ${fmt(macros.f)}g · ${fmt(macros.cal)} Cal`;
    },

    ensureDailyIntake: function (plan) {
        if (!plan.dailyIntake) {
            plan.dailyIntake = buildEmptyDailyIntake();
        }
        WEEK_DAY_ORDER.forEach(dayId => {
            if (!plan.dailyIntake[dayId]) {
                plan.dailyIntake[dayId] = { eatenSchedule: {}, extras: [] };
            }
            const day = plan.dailyIntake[dayId];
            if (!day.eatenSchedule || typeof day.eatenSchedule !== 'object') {
                day.eatenSchedule = {};
            }
            if (!Array.isArray(day.extras)) day.extras = [];
            day.extras = day.extras.map(e => this.normalizeIntakeExtra(e, plan));
        });
        return plan.dailyIntake;
    },

    getDayIntake: function (plan, dayId) {
        this.ensureDailyIntake(plan);
        return plan.dailyIntake[dayId];
    },

    isScheduleEaten: function (plan, dayId, scheduleId) {
        const day = this.getDayIntake(plan, dayId);
        return !!day.eatenSchedule[scheduleId];
    },

    setScheduleEaten: function (plan, dayId, scheduleId, eaten) {
        const day = this.getDayIntake(plan, dayId);
        if (eaten) {
            day.eatenSchedule[scheduleId] = true;
        } else {
            delete day.eatenSchedule[scheduleId];
        }
    },

    normalizeIntakeExtra: function (entry, plan) {
        if (!entry) return entry;
        if (!entry.id) entry.id = this.generateId('intake');
        if (!entry.type) entry.type = 'custom';
        if (typeof entry.flagged !== 'boolean') entry.flagged = false;
        if (!entry.note) entry.note = '';

        if (entry.type === 'meal') {
            entry.servings = parseFloat(entry.servings);
            if (!entry.servings || entry.servings < 0.25) entry.servings = 1;
            return entry;
        }

        if (entry.type === 'food') {
            const food = entry.foodId && plan.foodsLibrary && plan.foodsLibrary[entry.foodId];
            const minQ = food ? this.getFoodMinQuantity(food) : { amount: 1, unit: 'num' };
            if (!entry.mealQuantity) {
                entry.mealQuantity = { amount: minQ.amount, unit: minQ.unit };
            } else {
                entry.mealQuantity.unit = minQ.unit;
                entry.mealQuantity.amount = parseFloat(entry.mealQuantity.amount);
                if (!entry.mealQuantity.amount || entry.mealQuantity.amount <= 0) {
                    entry.mealQuantity.amount = minQ.amount;
                }
            }
            this.normalizeQuantity(entry.mealQuantity, minQ.unit);
            return entry;
        }

        entry.type = 'custom';
        entry.name = (entry.name || 'وجبة').trim() || 'وجبة';
        if (!entry.macros) entry.macros = { p: 0, c: 0, f: 0, cal: 0 };
        entry.macros = this.normalizeMacros(entry.macros);
        return entry;
    },

    getLocalDateStr: function (date) {
        const d = date ? new Date(date) : new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    formatDisplayDate: function (dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('ar', { weekday: 'short', day: 'numeric', month: 'short' });
    },

    parseLocalDate: function (dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    },

    addDaysToDateStr: function (dateStr, days) {
        const d = this.parseLocalDate(dateStr);
        d.setDate(d.getDate() + days);
        return this.getLocalDateStr(d);
    },

    getWeekRangeSaturday: function (dateStr) {
        const d = dateStr ? this.parseLocalDate(dateStr) : new Date();
        const day = d.getDay();
        const diffToSat = (day + 1) % 7;
        const start = new Date(d);
        start.setDate(d.getDate() - diffToSat);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return {
            start: this.getLocalDateStr(start),
            end: this.getLocalDateStr(end)
        };
    },

    getMonthRange: function (year, month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return {
            start: this.getLocalDateStr(start),
            end: this.getLocalDateStr(end),
            year,
            month
        };
    },

    listDatesInclusive: function (startStr, endStr) {
        const dates = [];
        let cur = startStr;
        while (cur <= endStr) {
            dates.push(cur);
            cur = this.addDaysToDateStr(cur, 1);
        }
        return dates;
    },

    ensureProgressTracking: function (plan) {
        if (!plan.intakeHistory || typeof plan.intakeHistory !== 'object') {
            plan.intakeHistory = {};
        }
        if (!Array.isArray(plan.bodyMetricsLog)) {
            plan.bodyMetricsLog = [];
        }
        plan.bodyMetricsLog = plan.bodyMetricsLog.map(entry => this.normalizeBodyMetric(entry));
        Object.keys(plan.intakeHistory).forEach(dateStr => {
            plan.intakeHistory[dateStr] = this.normalizeIntakeSnapshot(
                plan.intakeHistory[dateStr],
                plan
            );
        });
        return plan;
    },

    normalizeBodyMetric: function (entry) {
        if (!entry) return entry;
        if (!entry.id) entry.id = this.generateId('body');
        if (!entry.date) entry.date = this.getLocalDateStr();
        entry.weightKg = entry.weightKg !== '' && entry.weightKg != null
            ? parseFloat(entry.weightKg) : null;
        entry.bodyFatPct = entry.bodyFatPct !== '' && entry.bodyFatPct != null
            ? parseFloat(entry.bodyFatPct) : null;
        entry.muscleMassKg = entry.muscleMassKg !== '' && entry.muscleMassKg != null
            ? parseFloat(entry.muscleMassKg) : null;
        entry.waistCm = entry.waistCm !== '' && entry.waistCm != null
            ? parseFloat(entry.waistCm) : null;
        if (!entry.note) entry.note = '';
        return entry;
    },

    normalizeIntakeSnapshot: function (snap, plan) {
        if (!snap) snap = {};
        if (!snap.eatenSchedule || typeof snap.eatenSchedule !== 'object') {
            snap.eatenSchedule = {};
        }
        if (!Array.isArray(snap.extras)) snap.extras = [];
        snap.extras = snap.extras.map(e => this.normalizeIntakeExtra(e, plan));
        if (!snap.plannedMacros) snap.plannedMacros = this.emptyMacros();
        if (!snap.eatenMacros) snap.eatenMacros = this.emptyMacros();
        if (!snap.recordedAt) snap.recordedAt = new Date().toISOString();
        return snap;
    },

    recordDayIntakeSnapshot: function (plan, planDayId, dateStr) {
        this.ensureDailyIntake(plan);
        this.ensureProgressTracking(plan);
        dateStr = dateStr || this.getLocalDateStr();
        const day = plan.dailyIntake[planDayId];
        if (!day) return null;

        const snapshot = {
            planDayId,
            recordedAt: new Date().toISOString(),
            eatenSchedule: { ...day.eatenSchedule },
            extras: JSON.parse(JSON.stringify(day.extras)),
            plannedMacros: this.computeDayMacros(plan, planDayId),
            eatenMacros: this.computeDayEatenMacros(plan, planDayId)
        };
        plan.intakeHistory[dateStr] = this.normalizeIntakeSnapshot(snapshot, plan);
        return plan.intakeHistory[dateStr];
    },

    getIntakeSnapshot: function (plan, dateStr) {
        this.ensureProgressTracking(plan);
        const snap = plan.intakeHistory[dateStr];
        return snap ? this.normalizeIntakeSnapshot(JSON.parse(JSON.stringify(snap)), plan) : null;
    },

    setIntakeExtraFlagged: function (plan, dayId, extraId, flagged) {
        const day = this.getDayIntake(plan, dayId);
        const extra = day.extras.find(e => e.id === extraId);
        if (extra) {
            extra.flagged = !!flagged;
        }
    },

    setIntakeExtraNote: function (plan, dayId, extraId, note) {
        const day = this.getDayIntake(plan, dayId);
        const extra = day.extras.find(e => e.id === extraId);
        if (extra) extra.note = note || '';
    },

    setIntakeExtraFlaggedInHistory: function (plan, dateStr, extraId, flagged) {
        this.ensureProgressTracking(plan);
        const snap = plan.intakeHistory[dateStr];
        if (!snap || !snap.extras) return false;
        const extra = snap.extras.find(e => e.id === extraId);
        if (!extra) return false;
        extra.flagged = !!flagged;
        if (snap.planDayId) {
            const day = plan.dailyIntake && plan.dailyIntake[snap.planDayId];
            if (day) {
                const live = day.extras.find(e => e.id === extraId);
                if (live) live.flagged = !!flagged;
            }
        }
        return true;
    },

    addBodyMetric: function (plan, data) {
        this.ensureProgressTracking(plan);
        const entry = this.normalizeBodyMetric({
            id: this.generateId('body'),
            date: data.date || this.getLocalDateStr(),
            weightKg: data.weightKg,
            bodyFatPct: data.bodyFatPct,
            muscleMassKg: data.muscleMassKg,
            waistCm: data.waistCm,
            note: data.note || ''
        });
        plan.bodyMetricsLog.push(entry);
        plan.bodyMetricsLog.sort((a, b) => a.date.localeCompare(b.date));
        return entry;
    },

    removeBodyMetric: function (plan, entryId) {
        this.ensureProgressTracking(plan);
        plan.bodyMetricsLog = plan.bodyMetricsLog.filter(e => e.id !== entryId);
    },

    getBodyMetricsInRange: function (plan, startStr, endStr) {
        this.ensureProgressTracking(plan);
        return plan.bodyMetricsLog.filter(e => e.date >= startStr && e.date <= endStr);
    },

    buildNutritionPeriodReport: function (plan, startStr, endStr) {
        this.ensureProgressTracking(plan);
        const dates = this.listDatesInclusive(startStr, endStr);
        const days = [];
        let totalPlanned = this.emptyMacros();
        let totalEaten = this.emptyMacros();

        dates.forEach(dateStr => {
            const snap = plan.intakeHistory[dateStr];
            if (!snap) {
                days.push({ dateStr, hasData: false });
                return;
            }
            const normalized = this.normalizeIntakeSnapshot(snap, plan);
            const planned = normalized.plannedMacros;
            const eaten = normalized.eatenMacros;
            totalPlanned = this.addMacros(totalPlanned, planned);
            totalEaten = this.addMacros(totalEaten, eaten);
            days.push({
                dateStr,
                hasData: true,
                planDayId: normalized.planDayId,
                planDayLabel: this.getDayLabel(normalized.planDayId),
                planned,
                eaten,
                diff: this.computeMacroDiff(planned, eaten),
                extras: normalized.extras,
                flaggedExtras: normalized.extras.filter(e => e.flagged)
            });
        });

        return {
            startStr,
            endStr,
            days,
            totals: {
                planned: totalPlanned,
                eaten: totalEaten,
                diff: this.computeMacroDiff(totalPlanned, totalEaten)
            },
            daysWithData: days.filter(d => d.hasData).length,
            totalDays: dates.length
        };
    },

    collectFoodLogEntries: function (plan, startStr, endStr, options) {
        options = options || {};
        this.ensureProgressTracking(plan);
        const entries = [];
        const dates = this.listDatesInclusive(startStr, endStr);

        dates.forEach(dateStr => {
            const snap = plan.intakeHistory[dateStr];
            if (!snap || !snap.extras) return;
            snap.extras.forEach(extra => {
                const normalized = this.normalizeIntakeExtra(extra, plan);
                if (options.flaggedOnly && !normalized.flagged) return;
                const macros = this.computeIntakeExtraMacros(normalized, plan);
                entries.push({
                    dateStr,
                    dateLabel: this.formatDisplayDate(dateStr),
                    extra: normalized,
                    label: this.getIntakeExtraLabel(normalized, plan),
                    macros,
                    flagged: normalized.flagged
                });
            });
        });

        entries.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
        return entries;
    },

    getIntakeExtraLabel: function (entry, plan) {
        this.normalizeIntakeExtra(entry, plan);
        if (entry.type === 'meal') {
            const meal = entry.mealTemplateId && plan.mealsLibrary[entry.mealTemplateId];
            const name = meal ? meal.name : 'وجبة محذوفة';
            return entry.servings !== 1 ? `${name} × ${entry.servings}` : name;
        }
        if (entry.type === 'food') {
            const food = entry.foodId && plan.foodsLibrary[entry.foodId];
            const name = food ? food.name : 'طعام محذوف';
            return `${name} · ${this.formatQuantity(entry.mealQuantity)}`;
        }
        return entry.name;
    },

    computeIntakeExtraMacros: function (entry, plan) {
        this.normalizeIntakeExtra(entry, plan);
        const empty = this.emptyMacros();
        if (entry.type === 'meal') {
            if (!entry.mealTemplateId) return empty;
            const base = this.computeMealMacros(
                entry.mealTemplateId,
                plan.mealsLibrary,
                plan.foodsLibrary
            );
            return this.scaleMacros(base, entry.servings || 1);
        }
        if (entry.type === 'food') {
            const food = entry.foodId && plan.foodsLibrary[entry.foodId];
            return food ? (this.getScaledMacros(food, entry.mealQuantity) || empty) : empty;
        }
        return { ...entry.macros };
    },

    computeDayEatenMacros: function (plan, dayId) {
        this.ensureDailyIntake(plan);
        const day = plan.dailyIntake[dayId];
        let totals = this.emptyMacros();
        const slots = this.getDaySchedule(plan, dayId);

        slots.forEach(entry => {
            if (!entry || !entry.id || !entry.mealTemplateId) return;
            if (!day.eatenSchedule[entry.id]) return;
            this.normalizeScheduleEntry(entry);
            totals = this.addMacros(totals, this.computeScheduleSlotMacros(plan, entry));
        });

        day.extras.forEach(extra => {
            totals = this.addMacros(totals, this.computeIntakeExtraMacros(extra, plan));
        });

        return totals;
    },

    computeMacroDiff: function (planned, eaten) {
        const round = (n) => this.roundMacroDisplay(n);
        return {
            p: round((eaten.p || 0) - (planned.p || 0)),
            c: round((eaten.c || 0) - (planned.c || 0)),
            f: round((eaten.f || 0) - (planned.f || 0)),
            cal: round((eaten.cal || 0) - (planned.cal || 0))
        };
    },

    formatMacroDiff: function (diff, key) {
        const v = this.roundMacroDisplay(diff[key]);
        if (v === 0) return '0.0';
        const s = this.formatMacroDisplay(Math.abs(v));
        return v > 0 ? `+${s}` : `-${s}`;
    },

    addIntakeExtra: function (plan, dayId, entry) {
        const day = this.getDayIntake(plan, dayId);
        const normalized = this.normalizeIntakeExtra(
            { id: this.generateId('intake'), ...entry },
            plan
        );
        day.extras.push(normalized);
        return normalized;
    },

    removeIntakeExtra: function (plan, dayId, entryId) {
        const day = this.getDayIntake(plan, dayId);
        day.extras = day.extras.filter(e => e.id !== entryId);
    },

    findScheduleEntry: function (plan, scheduleId) {
        const wp = this.ensureWeeklyPlan(plan);
        for (const dayId of WEEK_DAY_ORDER) {
            const entry = wp[dayId].find(e => e.id === scheduleId);
            if (entry) return { entry, dayId };
        }
        return null;
    },

    removeScheduleEntry: function (plan, scheduleId) {
        const wp = this.ensureWeeklyPlan(plan);
        WEEK_DAY_ORDER.forEach(dayId => {
            wp[dayId] = wp[dayId].filter(e => e.id !== scheduleId);
        });
    },

    reorderScheduleEntry: function (plan, dayId, fromIndex, toIndex) {
        const wp = this.ensureWeeklyPlan(plan);
        const slots = wp[dayId];
        if (!slots || fromIndex === toIndex) return false;
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= slots.length || toIndex >= slots.length) {
            return false;
        }
        const [item] = slots.splice(fromIndex, 1);
        slots.splice(toIndex, 0, item);
        return true;
    },

    cloneScheduleEntry: function (entry) {
        if (!entry) return null;
        this.normalizeScheduleEntry(entry);
        const copy = JSON.parse(JSON.stringify(entry));
        copy.id = this.generateId('schedule');
        return this.normalizeScheduleEntry(copy);
    },

    /** Copy all meals/times from one weekday to one or more other days (replaces target day by default). */
    copyScheduleDay: function (plan, fromDayId, toDayIds, options) {
        options = options || {};
        const replace = options.replace !== false;
        const wp = this.ensureWeeklyPlan(plan);
        const sourceEntries = wp[fromDayId] || [];
        if (!sourceEntries.length) {
            return { ok: false, reason: 'empty_source' };
        }
        const targets = (Array.isArray(toDayIds) ? toDayIds : [toDayIds])
            .filter(dayId => dayId && dayId !== fromDayId && WEEK_DAY_ORDER.includes(dayId));
        if (!targets.length) {
            return { ok: false, reason: 'no_targets' };
        }
        targets.forEach(dayId => {
            const cloned = sourceEntries.map(e => this.cloneScheduleEntry(e));
            if (replace) {
                wp[dayId] = cloned;
            } else {
                if (!wp[dayId]) wp[dayId] = [];
                wp[dayId].push(...cloned.map(e => this.cloneScheduleEntry(e)));
            }
        });
        return { ok: true, count: sourceEntries.length, targets };
    },

    normalizeMeal: function (meal) {
        if (!meal) return meal;
        if (!meal.components) meal.components = [];
        if (!meal.category || !MEAL_CATEGORIES[meal.category]) meal.category = 'other';
        if (!meal.allowedMealAlternatives) meal.allowedMealAlternatives = [];
        return meal;
    },

    getMealCategoryLabel: function (categoryId) {
        return MEAL_CATEGORIES[categoryId]?.label || MEAL_CATEGORIES.other.label;
    },

    getMealCategoryIcon: function (categoryId) {
        return MEAL_CATEGORIES[categoryId]?.icon || MEAL_CATEGORIES.other.icon;
    },

    inferLegacyMealMetadata: function (mealId, meal) {
        const defaults = defaultData.mealsLibrary[mealId];
        if (defaults && defaults.category) {
            if (!meal.category || meal.category === 'other') {
                meal.category = defaults.category;
            }
            return;
        }

        const name = (meal.name || '').toLowerCase();
        if (meal.category && meal.category !== 'other') return;

        if (/pre-workout|pre workout|قبل التمرين|before workout/.test(name)) {
            meal.category = 'pre_workout';
        } else if (/post-workout|post workout|بعد التمرين|after workout/.test(name)) {
            meal.category = 'post_workout';
        } else if (/breakfast|فطور/.test(name)) {
            meal.category = 'breakfast';
        } else if (/lunch|غداء/.test(name)) {
            meal.category = 'lunch';
        } else if (/dinner|عشاء/.test(name)) {
            meal.category = 'dinner';
        } else if (/late snack|late|متأخر/.test(name)) {
            meal.category = 'late_snack';
        } else if (/snack|خفيفة/.test(name)) {
            meal.category = 'snack';
        }
    },

    createDefaultMeal: function (overrides = {}) {
        return this.normalizeMeal({
            name: 'قالب وجبة جديد',
            category: 'other',
            allowedMealAlternatives: [],
            components: [],
            ...overrides
        });
    },

    normalizeQuantity: function (q, fallbackUnit) {
        if (!q) q = { amount: 1, unit: fallbackUnit || 'num' };
        q.amount = parseFloat(q.amount);
        if (!q.amount || q.amount <= 0) q.amount = 1;
        const validUnit = QUANTITY_UNITS.some(u => u.id === q.unit);
        if (!validUnit) q.unit = fallbackUnit || 'num';
        return q;
    },

    formatQuantity: function (q) {
        if (!q) return '';
        const unitShort = QUANTITY_UNIT_SHORT[q.unit] || q.unit;
        const amt = parseFloat(q.amount);
        const display = Number.isFinite(amt)
            ? (Math.round(amt * 10) / 10).toFixed(1)
            : '0.0';
        return `${display} ${unitShort}`;
    },

    normalizeFood: function (food) {
        if (!food) return food;
        if (!food.macros) food.macros = { p: 0, c: 0, f: 0, cal: 0 };
        food.macros = this.normalizeMacros(food.macros);
        if (!food.category || !FOOD_CATEGORIES[food.category]) food.category = 'other';
        if (food.standardQuantity && !food.minQuantity) {
            food.minQuantity = { ...food.standardQuantity };
        }
        if (!food.minQuantity) {
            food.minQuantity = { amount: 1, unit: 'num' };
        }
        this.normalizeQuantity(food.minQuantity);
        food.standardQuantity = { ...food.minQuantity };
        return food;
    },

    getFoodMinQuantity: function (food) {
        if (!food) return { amount: 1, unit: 'num' };
        this.normalizeFood(food);
        return { ...food.minQuantity };
    },

    getFoodAlternativeId: function (alt) {
        if (!alt) return null;
        if (typeof alt === 'string') return alt;
        return alt.foodId || null;
    },

    normalizeFoodAlternative: function (entry, foodsLibrary) {
        if (entry === null || entry === undefined) {
            return { foodId: null, mealQuantity: { amount: 1, unit: 'num' } };
        }
        if (typeof entry === 'string') {
            entry = { foodId: entry };
        }
        const foodId = entry.foodId || null;
        if (!foodId) {
            const mq = entry.mealQuantity || { amount: 1, unit: 'num' };
            this.normalizeQuantity(mq);
            return { foodId: null, mealQuantity: mq };
        }
        const food = foodsLibrary && foodsLibrary[foodId];
        const minQ = food ? this.getFoodMinQuantity(food) : { amount: 1, unit: 'num' };
        if (!entry.mealQuantity) {
            entry.mealQuantity = { ...minQ };
        } else {
            entry.mealQuantity.unit = minQ.unit;
            entry.mealQuantity.amount = parseFloat(entry.mealQuantity.amount);
            if (!entry.mealQuantity.amount || entry.mealQuantity.amount < minQ.amount) {
                entry.mealQuantity.amount = minQ.amount;
            }
        }
        this.normalizeQuantity(entry.mealQuantity, minQ.unit);
        return { foodId, mealQuantity: entry.mealQuantity };
    },

    formatFoodAlternativeLabel: function (alt, foodsLibrary) {
        const foodId = this.getFoodAlternativeId(alt);
        if (!foodId || !foodsLibrary || !foodsLibrary[foodId]) return 'اختر طعاماً...';
        const food = foodsLibrary[foodId];
        const normalized = this.normalizeFoodAlternative(alt, foodsLibrary);
        const qty = normalized.mealQuantity
            ? ` · ${this.formatQuantity(normalized.mealQuantity)}`
            : '';
        return `${food.name}${qty}`;
    },

    computeFoodAlternativeMacros: function (alt, foodsLibrary) {
        const foodId = this.getFoodAlternativeId(alt);
        if (!foodId || !foodsLibrary || !foodsLibrary[foodId]) return null;
        const normalized = this.normalizeFoodAlternative(alt, foodsLibrary);
        return this.getScaledMacros(foodsLibrary[foodId], normalized.mealQuantity);
    },

    formatMinQuantity: function (food) {
        return this.formatQuantity(this.getFoodMinQuantity(food));
    },

    formatStandardQuantity: function (food) {
        return this.formatMinQuantity(food);
    },

    isMealSlot: function (comp) {
        return comp && comp.type === 'meal';
    },

    emptyMacros: function () {
        return { p: 0, c: 0, f: 0, cal: 0 };
    },

    normalizeMacros: function (macros) {
        const out = macros ? { ...macros } : this.emptyMacros();
        ['p', 'c', 'f', 'cal'].forEach(k => {
            const v = parseFloat(out[k]);
            out[k] = Number.isFinite(v) ? v : 0;
        });
        return out;
    },

    /** Numeric value rounded to 0.1 for comparisons and totals. */
    roundMacroDisplay: function (n) {
        return Math.round((Number(n) || 0) * 10) / 10;
    },

    /** Always show one decimal in UI (e.g. 124.0, 45.7). */
    formatMacroDisplay: function (n) {
        return this.roundMacroDisplay(n).toFixed(1);
    },

    addMacros: function (a, b) {
        return {
            p: (a.p || 0) + (b.p || 0),
            c: (a.c || 0) + (b.c || 0),
            f: (a.f || 0) + (b.f || 0),
            cal: (a.cal || 0) + (b.cal || 0)
        };
    },

    scaleMacros: function (macros, factor) {
        if (!macros) return this.emptyMacros();
        factor = Number(factor) || 0;
        return {
            p: (macros.p || 0) * factor,
            c: (macros.c || 0) * factor,
            f: (macros.f || 0) * factor,
            cal: (macros.cal || 0) * factor
        };
    },

    normalizeComponent: function (comp, foodsLibrary, mealsLibrary) {
        if (!comp) return comp;
        if (!comp.type) {
            comp.type = comp.nestedMealTemplateId ? 'meal' : 'food';
        }

        if (comp.type === 'meal') {
            if (!comp.allowedMealAlternatives) comp.allowedMealAlternatives = [];
            comp.servings = parseFloat(comp.servings);
            if (!comp.servings || comp.servings < 0.25) comp.servings = 1;
            return comp;
        }

        comp.type = 'food';
        if (!comp.allowedAlternatives) comp.allowedAlternatives = [];
        comp.allowedAlternatives = comp.allowedAlternatives.map(alt =>
            this.normalizeFoodAlternative(alt, foodsLibrary)
        );
        const food = comp.activeFoodId && foodsLibrary && foodsLibrary[comp.activeFoodId];
        const minQ = food ? this.getFoodMinQuantity(food) : { amount: 1, unit: 'num' };

        if (!comp.mealQuantity) {
            comp.mealQuantity = { amount: minQ.amount, unit: minQ.unit };
        } else {
            comp.mealQuantity.unit = minQ.unit;
            comp.mealQuantity.amount = parseFloat(comp.mealQuantity.amount);
            if (!comp.mealQuantity.amount || comp.mealQuantity.amount < minQ.amount) {
                comp.mealQuantity.amount = minQ.amount;
            }
        }
        this.normalizeQuantity(comp.mealQuantity, minQ.unit);
        return comp;
    },

    wouldCreateMealCycle: function (parentMealId, nestedMealId, mealsLibrary) {
        if (!parentMealId || !nestedMealId || !mealsLibrary) return false;
        if (parentMealId === nestedMealId) return true;

        const walk = (mealId, stack) => {
            if (mealId === parentMealId) return true;
            if (stack.has(mealId)) return false;
            stack.add(mealId);
            const meal = mealsLibrary[mealId];
            if (!meal || !meal.components) return false;
            for (const c of meal.components) {
                if (c.type === 'meal' && c.nestedMealTemplateId) {
                    if (walk(c.nestedMealTemplateId, stack)) return true;
                }
            }
            return false;
        };

        return walk(nestedMealId, new Set());
    },

    computeMealMacros: function (mealTemplateId, mealsLibrary, foodsLibrary, stack) {
        const empty = this.emptyMacros();
        if (!mealTemplateId || !mealsLibrary) return empty;

        stack = stack || new Set();
        if (stack.has(mealTemplateId)) return empty;
        stack.add(mealTemplateId);

        const meal = mealsLibrary[mealTemplateId];
        if (!meal || !meal.components) {
            stack.delete(mealTemplateId);
            return empty;
        }

        let totals = { ...empty };
        meal.components.forEach(comp => {
            this.normalizeComponent(comp, foodsLibrary, mealsLibrary);
            if (comp.type === 'meal') {
                if (!comp.nestedMealTemplateId) return;
                const nested = this.computeMealMacros(
                    comp.nestedMealTemplateId,
                    mealsLibrary,
                    foodsLibrary,
                    stack
                );
                totals = this.addMacros(totals, this.scaleMacros(nested, comp.servings));
            } else {
                const food = comp.activeFoodId && foodsLibrary && foodsLibrary[comp.activeFoodId];
                const scaled = food && this.getScaledMacros(food, comp.mealQuantity);
                if (scaled) totals = this.addMacros(totals, scaled);
            }
        });

        stack.delete(mealTemplateId);
        return totals;
    },

    computeComponentMacros: function (comp, mealsLibrary, foodsLibrary) {
        this.normalizeComponent(comp, foodsLibrary, mealsLibrary);
        if (comp.type === 'meal') {
            if (!comp.nestedMealTemplateId) return null;
            const base = this.computeMealMacros(
                comp.nestedMealTemplateId,
                mealsLibrary,
                foodsLibrary
            );
            return this.scaleMacros(base, comp.servings);
        }
        const food = comp.activeFoodId && foodsLibrary && foodsLibrary[comp.activeFoodId];
        return food ? this.getScaledMacros(food, comp.mealQuantity) : null;
    },

    getMacroScaleFactor: function (food, mealQuantity) {
        const minQ = this.getFoodMinQuantity(food);
        const mq = mealQuantity || minQ;
        if (!minQ.amount) return 1;
        return mq.amount / minQ.amount;
    },

    getScaledMacros: function (food, mealQuantity) {
        if (!food || !food.macros) return null;
        const factor = this.getMacroScaleFactor(food, mealQuantity);
        return this.scaleMacros(this.normalizeMacros(food.macros), factor);
    },

    createDefaultComponent: function (activeFoodId, foodsLibrary) {
        const comp = {
            type: 'food',
            activeFoodId: activeFoodId || null,
            allowedAlternatives: [],
            mealQuantity: { amount: 1, unit: 'num' }
        };
        if (activeFoodId && foodsLibrary && foodsLibrary[activeFoodId]) {
            comp.mealQuantity = { ...this.getFoodMinQuantity(foodsLibrary[activeFoodId]) };
        }
        return this.normalizeComponent(comp, foodsLibrary);
    },

    createDefaultNestedMealComponent: function (nestedMealTemplateId) {
        return this.normalizeComponent({
            type: 'meal',
            nestedMealTemplateId: nestedMealTemplateId || null,
            servings: 1,
            allowedMealAlternatives: []
        });
    },

    normalizeScheduleEntry: function (entry) {
        if (!entry) return entry;
        if (!entry.allowedMealAlternatives) entry.allowedMealAlternatives = [];
        if (!entry.foodOverrides || typeof entry.foodOverrides !== 'object') {
            entry.foodOverrides = {};
        }
        if (!entry.nestedMealOverrides || typeof entry.nestedMealOverrides !== 'object') {
            entry.nestedMealOverrides = {};
        }
        Object.keys(entry.foodOverrides).forEach(key => {
            const o = entry.foodOverrides[key];
            if (!o || !o.activeFoodId) {
                delete entry.foodOverrides[key];
                return;
            }
            const food = null; // normalized below when plan available
            if (!o.mealQuantity) o.mealQuantity = { amount: 1, unit: 'num' };
            o.mealQuantity.amount = parseFloat(o.mealQuantity.amount) || 1;
        });
        return entry;
    },

    getEffectiveFoodForSchedule: function (comp, compIdx, scheduleEntry, foodsLibrary) {
        this.normalizeComponent(comp, foodsLibrary);
        const key = String(compIdx);
        const override = scheduleEntry?.foodOverrides?.[key];
        if (override?.activeFoodId) {
            const food = foodsLibrary && foodsLibrary[override.activeFoodId];
            const mq = override.mealQuantity
                ? { ...override.mealQuantity }
                : (food ? { ...this.getFoodMinQuantity(food) } : { amount: 1, unit: 'num' });
            if (food) this.normalizeQuantity(mq, this.getFoodMinQuantity(food).unit);
            return { activeFoodId: override.activeFoodId, mealQuantity: mq, isOverride: true };
        }
        return {
            activeFoodId: comp.activeFoodId,
            mealQuantity: comp.mealQuantity,
            isOverride: false
        };
    },

    getEffectiveNestedMealForSchedule: function (comp, compIdx, scheduleEntry) {
        this.normalizeComponent(comp, null, null);
        const key = String(compIdx);
        const overrideId = scheduleEntry?.nestedMealOverrides?.[key];
        if (overrideId) return overrideId;
        return comp.nestedMealTemplateId;
    },

    computeScheduleSlotMacros: function (plan, scheduleEntry) {
        const empty = this.emptyMacros();
        if (!scheduleEntry?.mealTemplateId || !plan.mealsLibrary) return empty;
        this.normalizeScheduleEntry(scheduleEntry);
        const meal = plan.mealsLibrary[scheduleEntry.mealTemplateId];
        if (!meal?.components) return empty;

        let totals = { ...empty };
        meal.components.forEach((comp, compIdx) => {
            const scaled = this.computeEffectiveComponentMacrosForSchedule(
                plan, comp, compIdx, scheduleEntry
            );
            if (scaled) totals = this.addMacros(totals, scaled);
        });
        return totals;
    },

    computeEffectiveComponentMacrosForSchedule: function (plan, comp, compIdx, scheduleEntry) {
        if (!comp) return null;
        const foodsLibrary = plan.foodsLibrary;
        const mealsLibrary = plan.mealsLibrary;
        this.normalizeComponent(comp, foodsLibrary, mealsLibrary);
        if (scheduleEntry) this.normalizeScheduleEntry(scheduleEntry);

        if (comp.type === 'meal') {
            const nestedId = scheduleEntry
                ? this.getEffectiveNestedMealForSchedule(comp, compIdx, scheduleEntry)
                : comp.nestedMealTemplateId;
            if (!nestedId) return null;
            const base = this.computeMealMacros(nestedId, mealsLibrary, foodsLibrary);
            return this.scaleMacros(base, comp.servings);
        }
        const eff = scheduleEntry
            ? this.getEffectiveFoodForSchedule(comp, compIdx, scheduleEntry, foodsLibrary)
            : { activeFoodId: comp.activeFoodId, mealQuantity: comp.mealQuantity };
        const food = eff.activeFoodId && foodsLibrary[eff.activeFoodId];
        return food ? this.getScaledMacros(food, eff.mealQuantity) : null;
    },

    getScheduleMealAlternatives: function (plan, scheduleEntry) {
        this.normalizeScheduleEntry(scheduleEntry);
        const current = scheduleEntry.mealTemplateId;
        const fromSched = (scheduleEntry.allowedMealAlternatives || []).filter(Boolean);
        const meal = current && plan.mealsLibrary && plan.mealsLibrary[current];
        const fromTemplate = meal
            ? (meal.allowedMealAlternatives || []).filter(Boolean)
            : [];
        const combined = fromSched.length > 0 ? fromSched : fromTemplate;
        return combined.filter(id => id && id !== current);
    },

    swapScheduleMeal: function (scheduleEntry, newMealTemplateId, mealsLibrary) {
        this.normalizeScheduleEntry(scheduleEntry);
        if (!newMealTemplateId) return false;
        const oldId = scheduleEntry.mealTemplateId;
        if (oldId === newMealTemplateId) return false;

        let alts = (scheduleEntry.allowedMealAlternatives || []).filter(Boolean);
        alts = alts.filter(id => id !== newMealTemplateId);
        if (oldId && !alts.includes(oldId)) {
            alts.unshift(oldId);
        }
        scheduleEntry.mealTemplateId = newMealTemplateId;

        const newMeal = mealsLibrary && mealsLibrary[newMealTemplateId];
        if (newMeal) {
            this.normalizeMeal(newMeal);
            (newMeal.allowedMealAlternatives || []).filter(Boolean).forEach(id => {
                if (id !== newMealTemplateId && !alts.includes(id)) {
                    alts.push(id);
                }
            });
        }
        scheduleEntry.allowedMealAlternatives = alts;
        scheduleEntry.foodOverrides = {};
        scheduleEntry.nestedMealOverrides = {};
        return true;
    },

    swapScheduleComponentFood: function (scheduleEntry, mealTemplate, compIdx, altIdx, plan) {
        if (!scheduleEntry || !mealTemplate?.components) return false;
        this.normalizeScheduleEntry(scheduleEntry);
        const comp = mealTemplate.components[compIdx];
        if (!comp || comp.type === 'meal') return false;
        if (!comp.allowedAlternatives?.[altIdx]) return false;

        const alt = comp.allowedAlternatives[altIdx];
        const altFoodId = this.getFoodAlternativeId(alt);
        if (!altFoodId || !plan.foodsLibrary[altFoodId]) return false;

        const normalized = this.normalizeFoodAlternative(alt, plan.foodsLibrary);
        scheduleEntry.foodOverrides[String(compIdx)] = {
            activeFoodId: altFoodId,
            mealQuantity: { ...normalized.mealQuantity }
        };
        return true;
    },

    resetScheduleComponentOverride: function (scheduleEntry, compIdx) {
        this.normalizeScheduleEntry(scheduleEntry);
        const key = String(compIdx);
        if (scheduleEntry.foodOverrides[key]) {
            delete scheduleEntry.foodOverrides[key];
            return true;
        }
        if (scheduleEntry.nestedMealOverrides[key]) {
            delete scheduleEntry.nestedMealOverrides[key];
            return true;
        }
        return false;
    },

    swapScheduleNestedMeal: function (scheduleEntry, compIdx, altMealTemplateId) {
        this.normalizeScheduleEntry(scheduleEntry);
        if (!altMealTemplateId) return false;
        scheduleEntry.nestedMealOverrides[String(compIdx)] = altMealTemplateId;
        return true;
    },

    swapNestedMealComponent: function (comp, newNestedMealId, mealsLibrary) {
        this.normalizeComponent(comp, null, mealsLibrary);
        if (comp.type !== 'meal' || !newNestedMealId) return false;
        const oldId = comp.nestedMealTemplateId;
        if (oldId === newNestedMealId) return false;

        let alts = (comp.allowedMealAlternatives || []).filter(Boolean);
        alts = alts.filter(id => id !== newNestedMealId);
        if (oldId && !alts.includes(oldId)) {
            alts.unshift(oldId);
        }
        comp.nestedMealTemplateId = newNestedMealId;

        const newMeal = mealsLibrary && mealsLibrary[newNestedMealId];
        if (newMeal) {
            this.normalizeMeal(newMeal);
            (newMeal.allowedMealAlternatives || []).filter(Boolean).forEach(id => {
                if (id !== newNestedMealId && !alts.includes(id)) {
                    alts.push(id);
                }
            });
        }
        comp.allowedMealAlternatives = alts;
        return true;
    },

    swapComponentFoodWithAlternative: function (comp, altIdx, foodsLibrary) {
        if (!comp || !Array.isArray(comp.allowedAlternatives)) return false;
        const alt = comp.allowedAlternatives[altIdx];
        if (!alt) return false;
        const altFoodId = this.getFoodAlternativeId(alt);
        if (!altFoodId || !foodsLibrary || !foodsLibrary[altFoodId]) return false;

        const oldFoodId = comp.activeFoodId;
        const oldQty = comp.mealQuantity
            ? { ...comp.mealQuantity }
            : (oldFoodId
                ? { ...this.getFoodMinQuantity(foodsLibrary[oldFoodId]) }
                : { amount: 1, unit: 'num' });

        comp.activeFoodId = altFoodId;
        comp.mealQuantity = alt.mealQuantity
            ? { ...alt.mealQuantity }
            : { ...this.getFoodMinQuantity(foodsLibrary[altFoodId]) };

        alt.foodId = oldFoodId;
        alt.mealQuantity = oldQty;
        this.normalizeFoodAlternative(alt, foodsLibrary);
        this.normalizeComponent(comp, foodsLibrary);
        return true;
    },

    /** Copy meal template's allowedMealAlternatives onto a schedule slot */
    syncScheduleAltsFromMealTemplate: function (sched, mealsLibrary) {
        this.normalizeScheduleEntry(sched);
        const meal = sched.mealTemplateId && mealsLibrary && mealsLibrary[sched.mealTemplateId];
        if (!meal) {
            sched.allowedMealAlternatives = [];
            return sched;
        }
        this.normalizeMeal(meal);
        sched.allowedMealAlternatives = [...(meal.allowedMealAlternatives || [])].filter(Boolean);
        return sched;
    },

    getCategoryLabel: function (categoryId) {
        return FOOD_CATEGORIES[categoryId]?.label || FOOD_CATEGORIES.other.label;
    },

    getCategoryIcon: function (categoryId) {
        return FOOD_CATEGORIES[categoryId]?.icon || FOOD_CATEGORIES.other.icon;
    },

    inferLegacyFoodMetadata: function (foodId, food) {
        const defaults = defaultData.foodsLibrary[foodId];
        if (defaults) {
            if (!food.category || food.category === 'other') {
                if (defaults.category) food.category = defaults.category;
            }
            const q = food.minQuantity || food.standardQuantity;
            const defMin = defaults.minQuantity || defaults.standardQuantity;
            const looksUnset = !q || (q.amount === 1 && q.unit === 'num' && defMin?.unit !== 'num');
            if (looksUnset && defMin) {
                food.minQuantity = { ...defMin };
                food.standardQuantity = { ...defMin };
            }
            return;
        }

        const name = food.name || '';

        const gMatch = name.match(/\(g\s*(\d+)\)|\(g(\d+)\)/i);
        if (gMatch) {
            food.minQuantity = {
                amount: parseFloat(gMatch[1] || gMatch[2]),
                unit: 'g'
            };
            food.standardQuantity = { ...food.minQuantity };
        } else {
            const numPrefix = name.match(/^(\d+)\s+/);
            if (numPrefix) {
                food.minQuantity = { amount: parseFloat(numPrefix[1]), unit: 'num' };
                food.standardQuantity = { ...food.minQuantity };
            }
        }

        if (food.category && food.category !== 'other') return;

        if (/فرخ|لحم|سمك|تونة|تونه|بيض|فراخ|دجاج|لحمة|تونه|صدر|وراك/.test(name)) {
            food.category = 'protein';
        } else if (/ارز|بطاط|خبز|معكرونة|فول/.test(name)) {
            food.category = 'carbs';
        } else if (/سلطة|خضار|خضروات/.test(name)) {
            food.category = 'vegetables';
        } else if (/تمر|برتقال|موزة|فاكهة|عصير|تفاح/.test(name)) {
            food.category = 'fruits';
        } else if (/زبادي|جبنة|لبن|قريش/.test(name)) {
            food.category = 'dairy';
        }
    },

    migratePlan: function (plan) {
        if (plan.foodsLibrary) {
            Object.keys(plan.foodsLibrary).forEach(foodId => {
                const food = plan.foodsLibrary[foodId];
                this.inferLegacyFoodMetadata(foodId, food);
                this.normalizeFood(food);
            });
        }
        this.ensureWeeklyPlan(plan);
        WEEK_DAY_ORDER.forEach(dayId => {
            plan.weeklyPlan[dayId].forEach(entry => {
                this.normalizeScheduleEntry(entry);
                if (entry.mealTemplateId && plan.mealsLibrary) {
                    const meal = plan.mealsLibrary[entry.mealTemplateId];
                    if (meal && (meal.allowedMealAlternatives || []).filter(Boolean).length > 0
                        && (entry.allowedMealAlternatives || []).length === 0) {
                        this.syncScheduleAltsFromMealTemplate(entry, plan.mealsLibrary);
                    }
                }
            });
        });
        if (plan.mealsLibrary) {
            Object.keys(plan.mealsLibrary).forEach(mealId => {
                const meal = plan.mealsLibrary[mealId];
                this.inferLegacyMealMetadata(mealId, meal);
                this.normalizeMeal(meal);
                meal.components.forEach(c => {
                    if (!c.type) c.type = c.nestedMealTemplateId ? 'meal' : 'food';
                    if (c.type === 'meal' && c.allowedAlternatives && !c.allowedMealAlternatives) {
                        c.allowedMealAlternatives = c.allowedAlternatives.filter(id =>
                            id && plan.mealsLibrary && plan.mealsLibrary[id]
                        );
                    }
                    this.normalizeComponent(c, plan.foodsLibrary, plan.mealsLibrary);
                });
            });
        }
        this.ensureGroceryState(plan);
        this.ensureDailyIntake(plan);
        this.ensureProgressTracking(plan);
        return plan;
    },

    ensureGroceryState: function (plan) {
        if (!plan.groceryState) {
            plan.groceryState = JSON.parse(JSON.stringify(defaultData.groceryState));
        }
        const gs = plan.groceryState;
        if (!gs.checked || typeof gs.checked !== 'object') gs.checked = {};
        if (!Array.isArray(gs.customItems)) gs.customItems = [];
        if (!gs.includedDays || typeof gs.includedDays !== 'object') {
            gs.includedDays = {};
        }
        WEEK_DAY_ORDER.forEach(dayId => {
            if (typeof gs.includedDays[dayId] !== 'boolean') {
                gs.includedDays[dayId] = true;
            }
        });
        let weeks = parseInt(gs.weekCount, 10);
        if (!weeks || weeks < 1) weeks = 1;
        gs.weekCount = Math.min(52, weeks);
        gs.customItems = gs.customItems.map(item => ({
            id: item.id || this.generateId('grocery_custom'),
            name: item.name || 'عنصر إضافي',
            category: item.category && FOOD_CATEGORIES[item.category] ? item.category : 'other',
            note: item.note || ''
        }));
        return gs;
    },

    groceryItemKey: function (foodId, unit) {
        return `food_${foodId}_${unit}`;
    },

    customGroceryKey: function (customId) {
        return `custom_${customId}`;
    },

    isGroceryChecked: function (plan, key) {
        this.ensureGroceryState(plan);
        return !!plan.groceryState.checked[key];
    },

    setGroceryChecked: function (plan, key, checked) {
        this.ensureGroceryState(plan);
        if (checked) {
            plan.groceryState.checked[key] = true;
        } else {
            delete plan.groceryState.checked[key];
        }
    },

    roundGroceryAmount: function (amount) {
        const n = parseFloat(amount) || 0;
        if (n >= 1000) return Math.round(n);
        if (n >= 100) return Math.round(n);
        if (n >= 10) return Math.round(n * 10) / 10;
        return Math.round(n * 100) / 100;
    },

    formatGroceryQuantity: function (q) {
        if (!q) return '';
        const amount = this.roundGroceryAmount(q.amount);
        return this.formatQuantity({ amount, unit: q.unit });
    },

    collectFoodUsagesFromMeal: function (
        mealTemplateId,
        mealsLibrary,
        foodsLibrary,
        multiplier,
        stack,
        usages,
        sourceMeta,
        scheduleEntry
    ) {
        if (!mealTemplateId || !mealsLibrary) return;
        multiplier = parseFloat(multiplier);
        if (!multiplier || multiplier <= 0) multiplier = 1;
        if (scheduleEntry) this.normalizeScheduleEntry(scheduleEntry);

        stack = stack || new Set();
        if (stack.has(mealTemplateId)) return;
        stack.add(mealTemplateId);

        const meal = mealsLibrary[mealTemplateId];
        if (!meal || !meal.components) {
            stack.delete(mealTemplateId);
            return;
        }

        meal.components.forEach((comp, compIdx) => {
            this.normalizeComponent(comp, foodsLibrary, mealsLibrary);
            if (comp.type === 'meal') {
                const nestedId = scheduleEntry
                    ? this.getEffectiveNestedMealForSchedule(comp, compIdx, scheduleEntry)
                    : comp.nestedMealTemplateId;
                if (!nestedId) return;
                const nestedMult = multiplier * (comp.servings || 1);
                this.collectFoodUsagesFromMeal(
                    nestedId,
                    mealsLibrary,
                    foodsLibrary,
                    nestedMult,
                    stack,
                    usages,
                    sourceMeta,
                    null
                );
            } else {
                const eff = scheduleEntry
                    ? this.getEffectiveFoodForSchedule(comp, compIdx, scheduleEntry, foodsLibrary)
                    : { activeFoodId: comp.activeFoodId, mealQuantity: comp.mealQuantity };
                if (eff.activeFoodId && foodsLibrary[eff.activeFoodId]) {
                    const mq = eff.mealQuantity || this.getFoodMinQuantity(foodsLibrary[eff.activeFoodId]);
                    usages.push({
                        foodId: eff.activeFoodId,
                        amount: (mq.amount || 0) * multiplier,
                        unit: mq.unit,
                        source: {
                            ...sourceMeta,
                            componentOverride: !!(scheduleEntry?.foodOverrides?.[String(compIdx)])
                        }
                    });
                }
            }
        });

        stack.delete(mealTemplateId);
    },

    buildWeeklyGroceryList: function (plan, options) {
        options = options || {};
        this.ensureWeeklyPlan(plan);
        const gs = this.ensureGroceryState(plan);
        const foodsLibrary = plan.foodsLibrary || {};
        const mealsLibrary = plan.mealsLibrary || {};
        const includedDays = options.includedDays || gs.includedDays;
        let weekCount = parseInt(options.weekCount ?? gs.weekCount ?? 1, 10);
        if (!weekCount || weekCount < 1) weekCount = 1;
        weekCount = Math.min(52, weekCount);

        const aggregate = new Map();
        let slotCount = 0;

        WEEK_DAY_ORDER.forEach(dayId => {
            if (!includedDays[dayId]) return;
            const dayLabel = WEEK_DAYS[dayId]?.label || dayId;
            const slots = plan.weeklyPlan[dayId] || [];
            slots.forEach(entry => {
                if (!entry || !entry.mealTemplateId) return;
                slotCount += 1;
                const meal = mealsLibrary[entry.mealTemplateId];
                const mealName = meal?.name || 'وجبة';
                const usages = [];
                this.normalizeScheduleEntry(entry);
                this.collectFoodUsagesFromMeal(
                    entry.mealTemplateId,
                    mealsLibrary,
                    foodsLibrary,
                    1,
                    new Set(),
                    usages,
                    {
                        dayId,
                        dayLabel,
                        time: entry.time || '',
                        mealName,
                        mealTemplateId: entry.mealTemplateId
                    },
                    entry
                );
                usages.forEach(u => {
                    const key = `${u.foodId}|${u.unit}`;
                    const food = foodsLibrary[u.foodId];
                    if (!food) return;
                    this.normalizeFood(food);
                    let row = aggregate.get(key);
                    if (!row) {
                        row = {
                            key: this.groceryItemKey(u.foodId, u.unit),
                            foodId: u.foodId,
                            name: food.name,
                            category: food.category || 'other',
                            unit: u.unit,
                            totalAmount: 0,
                            sources: []
                        };
                        aggregate.set(key, row);
                    }
                    row.totalAmount += u.amount;
                    row.sources.push(u.source);
                });
            });
        });

        const categories = [];
        const search = (options.searchQuery || '').trim().toLowerCase();

        this.FOOD_CATEGORY_ORDER.forEach(catId => {
            const cat = this.FOOD_CATEGORIES[catId];
            const items = [];
            aggregate.forEach(row => {
                if (row.category !== catId) return;
                if (search) {
                    const hay = [row.name, cat.label, this.formatGroceryQuantity({
                        amount: row.totalAmount * weekCount,
                        unit: row.unit
                    })]
                        .join(' ')
                        .toLowerCase();
                    if (!hay.includes(search)) return;
                }
                const checked = this.isGroceryChecked(plan, row.key);
                const scaledAmount = row.totalAmount * weekCount;
                items.push({
                    ...row,
                    totalAmount: scaledAmount,
                    formattedQty: this.formatGroceryQuantity({ amount: scaledAmount, unit: row.unit }),
                    checked,
                    kind: 'food'
                });
            });
            items.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            if (items.length) {
                categories.push({
                    catId,
                    label: cat.label,
                    icon: cat.icon,
                    items
                });
            }
        });

        const customItems = [];
        gs.customItems.forEach(item => {
            if (search) {
                const hay = [item.name, item.note, this.getCategoryLabel(item.category)].join(' ').toLowerCase();
                if (!hay.includes(search)) return;
            }
            const key = this.customGroceryKey(item.id);
            customItems.push({
                ...item,
                key,
                checked: this.isGroceryChecked(plan, key),
                kind: 'custom'
            });
        });

        const allItems = categories.flatMap(c => c.items).concat(customItems);
        const checkedCount = allItems.filter(i => i.checked).length;

        return {
            categories,
            customItems,
            slotCount,
            weekCount,
            totalLines: allItems.length,
            checkedCount,
            remainingCount: allItems.length - checkedCount
        };
    },

    createDefaultFood: function (overrides = {}) {
        return this.normalizeFood({
            name: 'طعام جديد',
            category: 'other',
            minQuantity: { amount: 1, unit: 'num' },
            macros: { p: 0, c: 0, f: 0, cal: 0 },
            ...overrides
        });
    },

    loadPlan: function () {
        const stored = localStorage.getItem(STORAGE_KEY);
        let plan;
        if (stored) {
            try {
                plan = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing stored plan data, falling back to default.", e);
                plan = JSON.parse(JSON.stringify(defaultData));
            }
        } else {
            let legacyRaw = localStorage.getItem('m2m_relational_plan_v11')
                || localStorage.getItem('m2m_relational_plan_v10')
                || localStorage.getItem('m2m_relational_plan_v9')
                || localStorage.getItem('m2m_relational_plan_v8')
                || localStorage.getItem('m2m_relational_plan_v7')
                || localStorage.getItem('m2m_relational_plan_v6')
                || localStorage.getItem('m2m_relational_plan_v5')
                || localStorage.getItem('m2m_relational_plan_v4');
            if (legacyRaw) {
                try {
                    plan = JSON.parse(legacyRaw);
                } catch (e) {
                    plan = JSON.parse(JSON.stringify(defaultData));
                }
            } else {
                plan = JSON.parse(JSON.stringify(defaultData));
            }
        }
        return this.migratePlan(plan);
    },

    savePlan: function (planData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
    },

    resetToDefault: function () {
        localStorage.removeItem(STORAGE_KEY);
        // Clean legacy
        localStorage.removeItem('m2m_nutrition_plan_data');
        localStorage.removeItem('m2m_relational_plan_v2');
        localStorage.removeItem('m2m_relational_plan_v4');
        localStorage.removeItem('m2m_relational_plan_v5');
        localStorage.removeItem('m2m_relational_plan_v6');
        localStorage.removeItem('m2m_relational_plan_v7');
        localStorage.removeItem('m2m_relational_plan_v8');
        return this.loadPlan();
    },

    generateId: function (prefix) {
        return prefix + '_' + Math.random().toString(36).substr(2, 9);
    },

    exportToUrl: function () {
        const plan = this.loadPlan();
        try {
            const stringified = JSON.stringify(plan);
            const encoded = btoa(unescape(encodeURIComponent(stringified)));
            return encoded;
        } catch (e) {
            console.error("Failed to construct shareable url data", e);
            return null;
        }
    },

    importFromUrl: function (base64Str) {
        try {
            const decoded = decodeURIComponent(escape(atob(base64Str)));
            const parsedPlan = JSON.parse(decoded);
            if (parsedPlan && parsedPlan.foodsLibrary && parsedPlan.mealsLibrary) {
                this.migratePlan(parsedPlan);
                this.savePlan(parsedPlan);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse shared plan data", e);
        }
        return false;
    }
};
