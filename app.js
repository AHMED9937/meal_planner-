document.addEventListener('DOMContentLoaded', () => {

    // 0. Check if a shared plan is in the URL via '?plan='
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPlanData = urlParams.get('plan');
    if (sharedPlanData) {
        const success = DataManager.importFromUrl(sharedPlanData);
        if (success) {
            // Clean up URL so user doesn't keep sharing nested arrays by accident
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // 1. Load data
    const plan = DataManager.loadPlan();

    // 2. Render Header Information
    document.getElementById('plan-title').textContent = plan.planTitle || "Nutrition Plan";
    document.getElementById('plan-subtitle').textContent = plan.planSubtitle || "خطة التغذية المخصصة";

    // 3. Render Meals
    const mealsContainer = document.getElementById('meals-container');
    mealsContainer.innerHTML = ''; // Clear out

    plan.meals.forEach((meal, index) => {
        const mealCard = document.createElement('div');
        mealCard.className = 'card meal-card';
        // Add staggered animation delay based on index
        mealCard.style.animationDelay = `${(index + 1) * 0.1}s`;

        let componentsHtml = '';
        meal.components.forEach(comp => {

            // Build alternatives hint if they exist
            let altHint = '';
            if (comp.alternatives && comp.alternatives.length > 0) {
                altHint = `<div class="alt-hint">
                    <i class="fa-solid fa-list-ul"></i> 
                    يوجد ${comp.alternatives.length} بدائل متاحة
                </div>`;
            }

            componentsHtml += `
                <div class="meal-component">
                    <div class="component-main">
                        <i class="fa-solid fa-utensils component-icon"></i>
                        <span class="component-text">${comp.activeItem || 'عنصر غير محدد'}</span>
                    </div>
                    ${altHint}
                    <div class="component-actions">
                        <a href="manage.html?meal=${meal.id}&comp=${comp.id}" class="btn-swap" title="تغيير أو تعديل هذا العنصر">
                            <i class="fa-solid fa-shuffle"></i> تبديل / تعديل
                        </a>
                    </div>
                </div>
            `;
        });

        mealCard.innerHTML = `
            <div class="card-header">
                <h2 class="meal-title">${meal.title}</h2>
                <div class="meal-time">
                    <i class="fa-regular fa-clock"></i>
                    <span>${meal.time}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="meal-components-wrapper">
                    ${componentsHtml}
                    <div class="meal-actions" style="margin-top: 1rem; text-align: left;">
                        <a href="manage.html?meal=${meal.id}" class="btn-edit-meal" title="إضافة مكونات لهذه الوجبة">
                            <i class="fa-solid fa-plus"></i> إضافة طعام
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
