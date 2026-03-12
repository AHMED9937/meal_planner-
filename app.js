document.addEventListener('DOMContentLoaded', () => {

    // 0. Check if a shared plan is in the URL via '?plan='
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPlanData = urlParams.get('plan');
    if (sharedPlanData) {
        const success = DataManager.importFromUrl(sharedPlanData);
        if (success) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // 1. Load Data Strategy
    const plan = DataManager.loadPlan();

    // 2. Render Header Information
    document.getElementById('plan-title').textContent = plan.planTitle || "Nutrition Plan";
    document.getElementById('plan-subtitle').textContent = plan.planSubtitle || "خطة التغذية المخصصة";

    // 3. Render Dashboard Schedule (Joins ActivePlan -> MealLibrary -> FoodLibrary)
    const mealsContainer = document.getElementById('meals-container');
    mealsContainer.innerHTML = '';

    plan.activePlan.forEach((scheduleItem, index) => {
        const mealTemplate = plan.mealsLibrary[scheduleItem.mealTemplateId];
        if (!mealTemplate) return;

        const mealCard = document.createElement('div');
        mealCard.className = 'card meal-card';
        mealCard.style.animationDelay = `${(index + 1) * 0.1}s`;

        let componentsHtml = '';

        let mealTotals = { p: 0, c: 0, f: 0, cal: 0 };

        mealTemplate.components.forEach((comp, compIndex) => {
            const activeFood = plan.foodsLibrary[comp.activeFoodId];
            const foodName = activeFood ? activeFood.name : 'عنصر غير محدد / محذوف';

            // Tally macros
            let foodMacrosHtml = '';
            if (activeFood && activeFood.macros) {
                mealTotals.p += activeFood.macros.p || 0;
                mealTotals.c += activeFood.macros.c || 0;
                mealTotals.f += activeFood.macros.f || 0;
                mealTotals.cal += activeFood.macros.cal || 0;

                foodMacrosHtml = `
                    <div class="comp-macros">
                        <span class="macro-badge" title="بروتين">P: ${activeFood.macros.p || 0}g</span>
                        <span class="macro-badge" title="كارب">C: ${activeFood.macros.c || 0}g</span>
                        <span class="macro-badge" title="دهون">F: ${activeFood.macros.f || 0}g</span>
                        <span class="macro-badge highlight-macro" title="سعرات">${activeFood.macros.cal || 0} Cal</span>
                    </div>
                `;
            }

            const altsLength = comp.allowedAlternatives ? comp.allowedAlternatives.length : 0;
            let altHint = '';
            if (altsLength > 0) {
                altHint = `<div class="alt-hint">
                    <i class="fa-solid fa-list-ul"></i> 
                    يوجد ${altsLength} بدائل متاحة
                </div>`;
            }

            componentsHtml += `
                <div class="meal-component">
                    <div class="component-main">
                        <i class="fa-solid fa-utensils component-icon"></i>
                        <span class="component-text">${foodName}</span>
                    </div>
                    ${foodMacrosHtml}
                    ${altHint}
                    <div class="component-actions">
                        <a href="manage.html?tab=meals&meal=${scheduleItem.mealTemplateId}&compIdx=${compIndex}" class="btn-swap" title="تغيير هذا العنصر في قاعدة الوجبات">
                            <i class="fa-solid fa-shuffle"></i> تبديل / إعداد
                        </a>
                    </div>
                </div>
            `;
        });

        const mealMacrosHtml = `
            <div class="meal-total-macros">
                <span><strong>Total:</strong></span>
                <span class="macro-badge" title="بروتين المجموع">P: ${mealTotals.p}g</span>
                <span class="macro-badge" title="كارب المجموع">C: ${mealTotals.c}g</span>
                <span class="macro-badge" title="دهون المجموع">F: ${mealTotals.f}g</span>
                <span class="macro-badge highlight-macro" title="سعرات المجموع">${mealTotals.cal} Cal</span>
            </div>
        `;

        mealCard.innerHTML = `
            <div class="card-header" style="flex-direction:column; align-items:stretch;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                    <h2 class="meal-title">${mealTemplate.name}</h2>
                    <div class="meal-time">
                        <i class="fa-regular fa-clock"></i>
                        <span>${scheduleItem.time}</span>
                    </div>
                </div>
                ${mealMacrosHtml}
            </div>
            <div class="card-body">
                <div class="meal-components-wrapper">
                    ${componentsHtml}
                    <div class="meal-actions" style="margin-top: 1rem; text-align: left;">
                        <a href="manage.html?tab=meals&meal=${scheduleItem.mealTemplateId}" class="btn-edit-meal" title="تعديل قالب هذه الوجبة">
                            <i class="fa-solid fa-pen"></i> تعديل القالب
                        </a>
                    </div>
                </div>
            </div>
        `;
        mealsContainer.appendChild(mealCard);
    });

    // 4. Render Rules
    const rulesContainer = document.getElementById('rules-container');
    rulesContainer.innerHTML = '';
    plan.rules.forEach(rule => {
        const li = document.createElement('li');
        li.textContent = rule;
        rulesContainer.appendChild(li);
    });
});
