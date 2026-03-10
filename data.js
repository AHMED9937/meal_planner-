// data.js - Centralized State Manager

const STORAGE_KEY = 'm2m_nutrition_plan_data';

// The default schema representing the initial Mind2Muscle plan.
const defaultData = {
    planTitle: "Nutrition Plan",
    planSubtitle: "خطة التغذية المخصصة",
    rules: [
        "شرب 3 لتر على مدار اليوم (مهم جدا!!)",
        "مراعات النوم الجيد",
        "أيام بدون تمرين ( الجمعة )"
    ],
    meals: [
        {
            id: "m1",
            title: "MEAL 1",
            time: "الساعة (5:00)",
            components: [
                {
                    id: "m1-c1",
                    activeItem: "3 تمرات",
                    alternatives: []
                },
                {
                    id: "m1-c2",
                    activeItem: "عصير ( 1 موزة + نص كوب لبن قليل الدسم 120مل )",
                    alternatives: []
                }
            ]
        },
        {
            id: "m2",
            title: "MEAL 2",
            time: "الساعة ( 6:10 )",
            components: [
                {
                    id: "m2-c1",
                    activeItem: "صدر فرخة مشوي (g400)",
                    alternatives: [
                        "لحمة مشوية او مسلوقة (g150)",
                        "سمك مشوي (g450)",
                        "تونة مصفاة (g420)"
                    ]
                },
                {
                    id: "m2-c2",
                    activeItem: "ارز ابيض (g150)",
                    alternatives: []
                },
                {
                    id: "m2-c3",
                    activeItem: "طبق سلطة بالليمون",
                    alternatives: []
                },
                {
                    id: "m2-c4",
                    activeItem: "خضار مطبوخ (g250)",
                    alternatives: []
                }
            ]
        },
        {
            id: "m3",
            title: "MEAL 3",
            time: "الساعة (9:00)",
            components: [
                {
                    id: "m3-c1",
                    activeItem: "برتقالة متوسطة",
                    alternatives: []
                },
                {
                    id: "m3-c2",
                    activeItem: "بطاطا مشوية او مسلوقة (g200)",
                    alternatives: []
                }
            ]
        },
        {
            id: "m4",
            title: "MEAL 4",
            time: "الساعة (11:00)",
            components: [
                {
                    id: "m4-c1",
                    activeItem: "علبة زبادي يوناني لايت (g250)",
                    alternatives: []
                },
                {
                    id: "m4-c2",
                    activeItem: "صدر فراخ مشوية (g250)",
                    alternatives: [
                        "وراك فراخ مشوية (g200) - ملاحظة: استبدل بيضة كاملة ببياض في الوجبة 5"
                    ]
                }
            ]
        },
        {
            id: "m5",
            title: "MEAL 5",
            time: "الساعة ( 4:30 )",
            components: [
                {
                    id: "m5-c1",
                    activeItem: "1 بيضة كاملة + 5 بياض بيض",
                    alternatives: []
                },
                {
                    id: "m5-c2",
                    activeItem: "جبنة قريش (g100)",
                    alternatives: []
                },
                {
                    id: "m5-c3",
                    activeItem: "فول (g250)",
                    alternatives: []
                }
            ]
        }
    ]
};

const DataManager = {
    // Load the plan from local storage or get the default
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
            // deep copy default
            return JSON.parse(JSON.stringify(defaultData));
        }
    },

    // Save the entire plan object to local storage
    savePlan: function (planData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
    },

    // Reset back to defaults
    resetToDefault: function () {
        localStorage.removeItem(STORAGE_KEY);
        return this.loadPlan();
    },

    // Helper to generate unique IDs
    generateId: function (prefix) {
        return prefix + '-' + Math.random().toString(36).substr(2, 9);
    },

    // Convert deeply nested plan to a highly compressed Base64 string for URL sharing
    exportToUrl: function () {
        const plan = this.loadPlan();
        try {
            // Unescape + encodeURIComponent trick to safely btoa unicode (Arabic)
            const stringified = JSON.stringify(plan);
            const encoded = btoa(unescape(encodeURIComponent(stringified)));
            return encoded;
        } catch (e) {
            console.error("Failed to construct shareable url data", e);
            return null;
        }
    },

    // Import the plan from a Base64 string found in the URL parameter
    importFromUrl: function (base64Str) {
        try {
            const decoded = decodeURIComponent(escape(atob(base64Str)));
            const parsedPlan = JSON.parse(decoded);
            // Verify structure lightly
            if (parsedPlan && parsedPlan.meals && Array.isArray(parsedPlan.meals)) {
                this.savePlan(parsedPlan);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse shared plan data", e);
        }
        return false;
    }
};
