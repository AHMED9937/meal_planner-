// data.js - Relational Database State Manager (Contextual Alternatives + Macros)

const STORAGE_KEY = 'm2m_relational_plan_v4'; // Bumped version for new schema

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
        "f_dates": { name: "3 تمرات", macros: { p: 1, c: 20, f: 0, cal: 85 } },
        "f_juice": { name: "عصير ( 1 موزة + نص كوب لبن قليل الدسم 120مل )", macros: { p: 5, c: 35, f: 2, cal: 170 } },
        "f_chicken_400": { name: "صدر فرخة مشوي (g400)", macros: { p: 124, c: 0, f: 14, cal: 660 } },
        "f_meat_150": { name: "لحمة مشوية او مسلوقة (g150)", macros: { p: 39, c: 0, f: 12, cal: 260 } },
        "f_fish_450": { name: "سمك مشوي (g450)", macros: { p: 90, c: 0, f: 10, cal: 480 } },
        "f_tuna_420": { name: "تونة مصفاة (g420)", macros: { p: 95, c: 0, f: 4, cal: 440 } },
        "f_rice_150": { name: "ارز ابيض (g150)", macros: { p: 4, c: 42, f: 0, cal: 195 } },
        "f_salad": { name: "طبق سلطة بالليمون", macros: { p: 2, c: 10, f: 0, cal: 50 } },
        "f_veg_250": { name: "خضار مطبوخ (g250)", macros: { p: 5, c: 20, f: 0, cal: 100 } },
        "f_orange": { name: "برتقالة متوسطة", macros: { p: 1, c: 15, f: 0, cal: 62 } },
        "f_potato_200": { name: "بطاطا مشوية او مسلوقة (g200)", macros: { p: 4, c: 40, f: 0, cal: 170 } },
        "f_yogurt_250": { name: "علبة زبادي يوناني لايت (g250)", macros: { p: 15, c: 10, f: 0, cal: 100 } },
        "f_chicken_250": { name: "صدر فراخ مشوية (g250)", macros: { p: 77, c: 0, f: 9, cal: 412 } },
        "f_thighs_200": { name: "وراك فراخ مشوية (g200) - ملاحظة: استبدل بيضة كاملة ببياض في الوجبة 5", macros: { p: 48, c: 0, f: 16, cal: 350 } },
        "f_eggs": { name: "1 بيضة كاملة + 5 بياض بيض", macros: { p: 24, c: 1, f: 5, cal: 150 } },
        "f_cottage_100": { name: "جبنة قريش (g100)", macros: { p: 11, c: 3, f: 4, cal: 98 } },
        "f_beans_250": { name: "فول (g250)", macros: { p: 15, c: 40, f: 1, cal: 230 } }
    },

    // Table 2: Global Meal Templates Library
    // An object mapping mealTemplateId -> mealObject
    // Alternatives are now securely defined in the Component slot
    mealsLibrary: {
        "mt_1": {
            name: "MEAL 1 (Pre-workout)",
            components: [
                { activeFoodId: "f_dates", allowedAlternatives: [] },
                { activeFoodId: "f_juice", allowedAlternatives: [] }
            ]
        },
        "mt_2": {
            name: "MEAL 2 (Post-workout)",
            components: [
                { activeFoodId: "f_chicken_400", allowedAlternatives: ["f_meat_150", "f_fish_450", "f_tuna_420"] },
                { activeFoodId: "f_rice_150", allowedAlternatives: [] },
                { activeFoodId: "f_salad", allowedAlternatives: [] },
                { activeFoodId: "f_veg_250", allowedAlternatives: [] }
            ]
        },
        "mt_3": {
            name: "MEAL 3 (Snack)",
            components: [
                { activeFoodId: "f_orange", allowedAlternatives: [] },
                { activeFoodId: "f_potato_200", allowedAlternatives: [] }
            ]
        },
        "mt_4": {
            name: "MEAL 4 (Dinner)",
            components: [
                { activeFoodId: "f_yogurt_250", allowedAlternatives: [] },
                { activeFoodId: "f_chicken_250", allowedAlternatives: ["f_thighs_200"] }
            ]
        },
        "mt_5": {
            name: "MEAL 5 (Late Snack)",
            components: [
                { activeFoodId: "f_eggs", allowedAlternatives: [] },
                { activeFoodId: "f_cottage_100", allowedAlternatives: [] },
                { activeFoodId: "f_beans_250", allowedAlternatives: [] }
            ]
        }
    },

    // Table 3: Active Dashboard Schedule
    activePlan: [
        { id: "schedule_1", time: "الساعة (5:00)", mealTemplateId: "mt_1" },
        { id: "schedule_2", time: "الساعة ( 6:10 )", mealTemplateId: "mt_2" },
        { id: "schedule_3", time: "الساعة (9:00)", mealTemplateId: "mt_3" },
        { id: "schedule_4", time: "الساعة (11:00)", mealTemplateId: "mt_4" },
        { id: "schedule_5", time: "الساعة ( 4:30 )", mealTemplateId: "mt_5" }
    ]
};

const DataManager = {
    loadPlan: function () {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing stored plan data, falling back to default.", e);
                return JSON.parse(JSON.stringify(defaultData));
            }
        } else {
            return JSON.parse(JSON.stringify(defaultData));
        }
    },

    savePlan: function (planData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
    },

    resetToDefault: function () {
        localStorage.removeItem(STORAGE_KEY);
        // Clean legacy
        localStorage.removeItem('m2m_nutrition_plan_data');
        localStorage.removeItem('m2m_relational_plan_v2');
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
                // simple migration check if importing v2
                if (parsedPlan.mealsLibrary) {
                    Object.values(parsedPlan.mealsLibrary).forEach(ml => {
                        ml.components.forEach(c => {
                            if (!c.allowedAlternatives) c.allowedAlternatives = [];
                        });
                    });
                }
                this.savePlan(parsedPlan);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse shared plan data", e);
        }
        return false;
    }
};
