document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPlanData = urlParams.get('plan');

    if (sharedPlanData) {
        const success = DataManager.importFromUrl(sharedPlanData);
        if (success) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    const plan = DataManager.loadPlan();
    DataManager.ensureWeeklyPlan(plan);
    DataManager.ensureProgressTracking(plan);

    let selectedDay = urlParams.get('day');
    if (!selectedDay || !DataManager.WEEK_DAYS[selectedDay]) {
        selectedDay = DataManager.getTodayDayId();
    }

    document.getElementById('plan-title').textContent = plan.planTitle || 'Nutrition Plan';
    document.getElementById('plan-subtitle').textContent = plan.planSubtitle || 'خطة التغذية المخصصة';

    const mealsContainer = document.getElementById('meals-container');
    const weekDayNav = document.getElementById('week-day-nav');
    const dayMacrosSummary = document.getElementById('day-macros-summary');
    const intakeExtrasList = document.getElementById('intake-extras-list');
    const intakeModal = document.getElementById('intake-modal');
    const mealsSectionTitle = document.getElementById('meals-section-title');
    let activeIntakeType = 'meal';

    const fmtMacro = (n) => DataManager.formatMacroDisplay(n);
    const roundMacro = (n) => DataManager.roundMacroDisplay(n);
    const savePlan = () => {
        const todayId = DataManager.getTodayDayId();
        if (selectedDay === todayId) {
            DataManager.recordDayIntakeSnapshot(plan, todayId);
        }
        DataManager.savePlan(plan);
    };

    const syncUrlParams = () => {
        const u = new URL(window.location.href);
        u.searchParams.set('day', selectedDay);
        window.history.replaceState({}, '', u.pathname + u.search);
    };

    const macroBadgesHtml = (macros) => {
        const f = fmtMacro;
        return `
            <div class="comp-macros meal-total-macros">
                <span class="macro-badge" title="بروتين">P: ${f(macros.p)}g</span>
                <span class="macro-badge" title="كارب">C: ${f(macros.c)}g</span>
                <span class="macro-badge" title="دهون">F: ${f(macros.f)}g</span>
                <span class="macro-badge highlight-macro" title="سعرات">${f(macros.cal)} Cal</span>
            </div>
        `;
    };

    const renderDayMacrosSummary = (dayId) => {
        const planned = DataManager.computeDayMacros(plan, dayId);
        const eaten = DataManager.computeDayEatenMacros(plan, dayId);
        const diff = DataManager.computeMacroDiff(planned, eaten);
        const dayIntake = DataManager.getDayIntake(plan, dayId);
        const slots = DataManager.getDaySchedule(plan, dayId);
        const eatenFromPlan = slots.filter(s => dayIntake.eatenSchedule[s.id]).length;

        const plannedCal = roundMacro(planned.cal);
        const eatenCal = roundMacro(eaten.cal);
        const diffCal = roundMacro(diff.cal);
        const progressPct = plannedCal > 0 ? Math.min(100, Math.round((eatenCal / plannedCal) * 100)) : 0;

        let statusClass = 'summary-status--even';
        let statusText = 'ما أكلته يطابق الخطة في السعرات';
        if (diff.cal > 0) {
            statusClass = 'summary-status--over';
            statusText = `أكلت أكثر من المخطط بـ ${fmtMacro(diff.cal)} سعرة`;
        } else if (diff.cal < 0) {
            statusClass = 'summary-status--under';
            statusText = `أقل من المخطط بـ ${fmtMacro(Math.abs(diff.cal))} سعرة — يمكنك إكمال الوجبات أو تسجيل إضافات`;
        }

        const diffMetricClass = diff.cal > 0 ? 'summary-over' : diff.cal < 0 ? 'summary-under' : '';

        dayMacrosSummary.innerHTML = `
            <div class="card summary-card">
                <div class="card-header">
                    <h2 class="section-title" style="margin:0;">ملخص ${DataManager.getDayLabel(dayId)}</h2>
                    <span class="meal-category-badge">${slots.length} وجبات · ${dayIntake.extras.length} إضافة</span>
                </div>
                <div class="card-body">
                    <div class="summary-metrics">
                        <div class="summary-metric">
                            <span class="summary-metric-label">المخطط</span>
                            <span class="summary-metric-value">${fmtMacro(planned.cal)}</span>
                        </div>
                        <div class="summary-metric summary-metric--eaten">
                            <span class="summary-metric-label">ما أكلته</span>
                            <span class="summary-metric-value">${fmtMacro(eaten.cal)}</span>
                        </div>
                        <div class="summary-metric summary-metric--diff ${diffMetricClass}">
                            <span class="summary-metric-label">الفرق</span>
                            <span class="summary-metric-value">${diffCal > 0 ? '+' : ''}${fmtMacro(diff.cal)}</span>
                        </div>
                    </div>
                    <div class="summary-progress-wrap">
                        <div class="summary-progress-label">
                            <span>التقدم</span>
                            <span>${progressPct}% · ${eatenFromPlan}/${slots.length} وجبات من الخطة</span>
                        </div>
                        <div class="summary-progress-track">
                            <div class="summary-progress-fill" style="width:${progressPct}%"></div>
                        </div>
                    </div>
                    <p class="summary-status ${statusClass}">${statusText}</p>
                    <details class="summary-details">
                        <summary>تفاصيل البروتين والكربوهيدرات والدهون</summary>
                        <div class="summary-details-grid">
                            <div class="summary-details-block">
                                <h4>المخطط</h4>
                                ${macroBadgesHtml(planned)}
                            </div>
                            <div class="summary-details-block">
                                <h4>ما أكلته</h4>
                                ${macroBadgesHtml(eaten)}
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
    };

    const renderWeekNav = () => {
        weekDayNav.innerHTML = '';
        DataManager.WEEK_DAY_ORDER.forEach(dayId => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `week-day-btn ${dayId === selectedDay ? 'active' : ''}`;
            const eatenCal = DataManager.roundMacroDisplay(DataManager.computeDayEatenMacros(plan, dayId).cal);
            const plannedCal = DataManager.roundMacroDisplay(DataManager.computeDayMacros(plan, dayId).cal);
            const isToday = dayId === DataManager.getTodayDayId();
            btn.innerHTML = `
                <span class="week-day-label">${DataManager.WEEK_DAYS[dayId].label}${isToday ? ' <small>(اليوم)</small>' : ''}</span>
                <span class="week-day-macros">${fmtMacro(eatenCal)} / ${fmtMacro(plannedCal)} Cal</span>
            `;
            btn.addEventListener('click', () => {
                selectedDay = dayId;
                syncUrlParams();
                renderDashboardForDay();
                document.getElementById('section-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            weekDayNav.appendChild(btn);
        });
    };

    const renderIntakeExtras = () => {
        const dayIntake = DataManager.getDayIntake(plan, selectedDay);
        intakeExtrasList.innerHTML = '';
        if (dayIntake.extras.length === 0) {
            intakeExtrasList.innerHTML = '<p class="extras-empty">لا يوجد طعام إضافي مسجّل لهذا اليوم.</p>';
            return;
        }
        dayIntake.extras.forEach(extra => {
            const macros = DataManager.computeIntakeExtraMacros(extra, plan);
            const row = document.createElement('div');
            row.className = 'extra-item';
            row.innerHTML = `
                <div class="extra-item-info">
                    <strong>${DataManager.getIntakeExtraLabel(extra, plan)}</strong>
                    <span>${fmtMacro(macros.cal)} سعرة · P ${fmtMacro(macros.p)} · C ${fmtMacro(macros.c)} · F ${fmtMacro(macros.f)}</span>
                    ${extra.flagged ? '<span class="extra-flag-badge">مراجعة</span>' : ''}
                </div>
                <div class="extra-item-actions">
                    <button type="button" class="btn-icon extra-flag-btn ${extra.flagged ? 'is-flagged' : ''}" title="تعليم كخطأ / للمراجعة"><i class="fa-solid fa-flag"></i></button>
                    <button type="button" class="btn-icon text-danger" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            row.querySelector('.extra-flag-btn').addEventListener('click', () => {
                DataManager.setIntakeExtraFlagged(plan, selectedDay, extra.id, !extra.flagged);
                savePlan();
                renderDashboardForDay();
            });
            row.querySelector('.text-danger').addEventListener('click', () => {
                DataManager.removeIntakeExtra(plan, selectedDay, extra.id);
                savePlan();
                renderDashboardForDay();
            });
            intakeExtrasList.appendChild(row);
        });
    };

    const renderFoodComponentHtml = (comp, mealTemplateId, compIndex, scheduleItem) => {
        DataManager.normalizeScheduleEntry(scheduleItem);
        const eff = DataManager.getEffectiveFoodForSchedule(
            comp, compIndex, scheduleItem, plan.foodsLibrary
        );
        const activeFood = eff.activeFoodId && plan.foodsLibrary[eff.activeFoodId];
        if (activeFood) DataManager.normalizeFood(activeFood);
        const foodName = activeFood ? activeFood.name : 'عنصر محذوف';
        const qty = activeFood ? DataManager.formatQuantity(eff.mealQuantity) : '';
        const scaledMacros = DataManager.computeEffectiveComponentMacrosForSchedule(
            plan, comp, compIndex, scheduleItem
        );
        const overrideBadge = eff.isOverride
            ? '<span class="override-badge">مخصّص لهذا الموعد</span>'
            : '';

        return `
            <div class="meal-component">
                <div class="component-main">
                    <i class="fa-solid fa-utensils component-icon"></i>
                    <span class="component-text">${foodName}${qty ? ` · ${qty}` : ''}</span>
                    ${overrideBadge}
                </div>
                ${scaledMacros ? `<div class="component-macros-primary">${macroBadgesHtml(scaledMacros)}</div>` : ''}
            </div>
        `;
    };

    const renderNestedMealComponentHtml = (comp, mealTemplateId, scheduleItem, compIndex) => {
        DataManager.normalizeScheduleEntry(scheduleItem);
        const nestedId = DataManager.getEffectiveNestedMealForSchedule(comp, compIndex, scheduleItem);
        const nested = nestedId && plan.mealsLibrary[nestedId];
        const nestedName = nested ? nested.name : 'وجبة محذوفة';
        const hasNestedOverride = !!scheduleItem.nestedMealOverrides[String(compIndex)];
        const scaledMacros = DataManager.computeEffectiveComponentMacrosForSchedule(
            plan, comp, compIndex, scheduleItem
        );
        let innerItemsHtml = '';
        if (nested && nested.components) {
            innerItemsHtml = nested.components.map(innerComp => {
                DataManager.normalizeComponent(innerComp, plan.foodsLibrary, plan.mealsLibrary);
                if (DataManager.isMealSlot(innerComp)) {
                    const sub = plan.mealsLibrary[innerComp.nestedMealTemplateId];
                    return `<li><i class="fa-solid fa-bowl-food"></i> ${sub ? sub.name : '—'} × ${innerComp.servings}</li>`;
                }
                const food = innerComp.activeFoodId && plan.foodsLibrary[innerComp.activeFoodId];
                return `<li><i class="fa-solid fa-utensils"></i> ${food ? food.name : '—'} · ${DataManager.formatQuantity(innerComp.mealQuantity)}</li>`;
            }).join('');
        }

        return `
            <div class="meal-component meal-component-nested">
                <div class="component-main">
                    <i class="fa-solid fa-bowl-food component-icon nested-icon"></i>
                    <span class="component-text">${nestedName} · ${comp.servings} حصة</span>
                    ${hasNestedOverride ? '<span class="override-badge">مخصّص</span>' : ''}
                </div>
                ${innerItemsHtml ? `<ul class="nested-meal-items">${innerItemsHtml}</ul>` : ''}
                ${scaledMacros ? macroBadgesHtml(scaledMacros) : ''}
            </div>
        `;
    };

    const renderMeals = () => {
        mealsContainer.innerHTML = '';
        mealsSectionTitle.textContent = `وجبات ${DataManager.getDayLabel(selectedDay)}`;

        const daySchedule = DataManager.getDaySchedule(plan, selectedDay);
        if (daySchedule.length === 0) {
            mealsContainer.innerHTML = `
                <div class="card" style="grid-column:1/-1;text-align:center;padding:2rem;">
                    <p style="margin-bottom:1rem;color:var(--text-secondary);">لا توجد وجبات مجدولة لهذا اليوم.</p>
                    <a href="manage.html?tab=schedule&day=${selectedDay}" class="btn btn-primary">إعداد الجدول الأسبوعي</a>
                </div>`;
            return;
        }

        daySchedule.forEach((scheduleItem, index) => {
            const mealTemplate = plan.mealsLibrary[scheduleItem.mealTemplateId];
            if (!mealTemplate) return;
            DataManager.normalizeMeal(mealTemplate);
            DataManager.normalizeScheduleEntry(scheduleItem);

            const isEaten = DataManager.isScheduleEaten(plan, selectedDay, scheduleItem.id);
            const mealTotals = DataManager.computeScheduleSlotMacros(plan, scheduleItem);
            const mealCal = fmtMacro(mealTotals.cal);

            let componentsHtml = '';
            mealTemplate.components.forEach((comp, compIndex) => {
                DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);
                if (DataManager.isMealSlot(comp)) {
                    componentsHtml += renderNestedMealComponentHtml(
                        comp, scheduleItem.mealTemplateId, scheduleItem, compIndex
                    );
                } else {
                    componentsHtml += renderFoodComponentHtml(
                        comp, scheduleItem.mealTemplateId, compIndex, scheduleItem
                    );
                }
            });

            const card = document.createElement('article');
            card.className = `card meal-card ${isEaten ? 'meal-card--eaten' : ''}`;
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="meal-eaten-bar">
                    <label class="meal-eaten-label">
                        <input type="checkbox" class="meal-eaten-check" ${isEaten ? 'checked' : ''}>
                        أكلت هذه الوجبة
                    </label>
                    <span class="meal-eaten-badge">${isEaten ? 'تم التسجيل' : 'لم تُسجَّل'}</span>
                </div>
                <div class="card-header">
                    <div>
                        <h2 class="meal-title">${mealTemplate.name}</h2>
                        <span class="meal-category-badge">${DataManager.getMealCategoryLabel(mealTemplate.category)}</span>
                    </div>
                    <div style="text-align:left;">
                        <div class="meal-time"><i class="fa-regular fa-clock"></i> ${scheduleItem.time}</div>
                        <div class="meal-card-cal">${mealCal} Cal</div>
                    </div>
                </div>
                <div class="card-body" style="padding-top:0;">
                    ${macroBadgesHtml(mealTotals)}
                </div>
                <details class="meal-details-toggle">
                    <summary>المكونات والإعدادات</summary>
                    <div class="card-body meal-components-wrapper">
                        ${componentsHtml}
                        <div class="meal-actions" style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <a href="manage.html?tab=schedule&day=${selectedDay}&sched=${scheduleItem.id}" class="btn-edit-meal"><i class="fa-solid fa-clock"></i> الموعد</a>
                            <a href="manage.html?tab=meals&meal=${scheduleItem.mealTemplateId}" class="btn-edit-meal"><i class="fa-solid fa-pen"></i> القالب</a>
                        </div>
                    </div>
                </details>
            `;

            card.querySelector('.meal-eaten-check').addEventListener('change', (e) => {
                DataManager.setScheduleEaten(plan, selectedDay, scheduleItem.id, e.target.checked);
                savePlan();
                renderDashboardForDay();
            });

            mealsContainer.appendChild(card);
        });
    };

    const renderDashboardForDay = () => {
        DataManager.ensureDailyIntake(plan);
        renderWeekNav();
        renderDayMacrosSummary(selectedDay);
        renderMeals();
        renderIntakeExtras();
    };

    const populateIntakeSelects = () => {
        const mealSelect = document.getElementById('intake-meal-select');
        const foodSelect = document.getElementById('intake-food-select');
        const mealSearch = (document.getElementById('intake-meal-search').value || '').trim().toLowerCase();
        const foodSearch = (document.getElementById('intake-food-search').value || '').trim().toLowerCase();

        mealSelect.innerHTML = '';
        Object.keys(plan.mealsLibrary).sort((a, b) =>
            (plan.mealsLibrary[a].name || '').localeCompare(plan.mealsLibrary[b].name || '', 'ar')
        ).forEach(id => {
            const meal = plan.mealsLibrary[id];
            DataManager.normalizeMeal(meal);
            const macros = DataManager.computeMealMacros(id, plan.mealsLibrary, plan.foodsLibrary);
            if (mealSearch && !meal.name.toLowerCase().includes(mealSearch)) return;
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${meal.name} (${DataManager.formatMacroDisplay(macros.cal)} Cal)`;
            mealSelect.appendChild(opt);
        });

        foodSelect.innerHTML = '';
        Object.keys(plan.foodsLibrary).sort((a, b) =>
            (plan.foodsLibrary[a].name || '').localeCompare(plan.foodsLibrary[b].name || '', 'ar')
        ).forEach(id => {
            const food = plan.foodsLibrary[id];
            DataManager.normalizeFood(food);
            if (foodSearch && !food.name.toLowerCase().includes(foodSearch)) return;
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${food.name} (${DataManager.formatMinQuantity(food)})`;
            foodSelect.appendChild(opt);
        });

        if (foodSelect.options.length) {
            foodSelect.selectedIndex = 0;
            updateIntakeFoodQtyUi();
        }
    };

    const updateIntakeFoodQtyUi = () => {
        const foodId = document.getElementById('intake-food-select').value;
        const food = foodId && plan.foodsLibrary[foodId];
        const unitLabel = document.getElementById('intake-food-unit-label');
        const amountInput = document.getElementById('intake-food-amount');
        if (!food) {
            unitLabel.textContent = '—';
            return;
        }
        const minQ = DataManager.getFoodMinQuantity(food);
        amountInput.value = minQ.amount;
        unitLabel.textContent = DataManager.QUANTITY_UNIT_SHORT[minQ.unit] || minQ.unit;
    };

    const setIntakeModalType = (type) => {
        activeIntakeType = type;
        document.querySelectorAll('.intake-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.intakeType === type);
        });
        document.querySelectorAll('.intake-form-panel').forEach(panel => {
            panel.hidden = panel.dataset.panel !== type;
        });
    };

    document.getElementById('btn-add-intake').addEventListener('click', () => {
        populateIntakeSelects();
        setIntakeModalType('meal');
        intakeModal.hidden = false;
        intakeModal.setAttribute('aria-hidden', 'false');
    });

    intakeModal.querySelectorAll('[data-close-intake]').forEach(el => {
        el.addEventListener('click', () => {
            intakeModal.hidden = true;
            intakeModal.setAttribute('aria-hidden', 'true');
        });
    });

    document.querySelectorAll('.intake-type-btn').forEach(btn => {
        btn.addEventListener('click', () => setIntakeModalType(btn.dataset.intakeType));
    });

    document.getElementById('intake-meal-search').addEventListener('input', populateIntakeSelects);
    document.getElementById('intake-food-search').addEventListener('input', populateIntakeSelects);
    document.getElementById('intake-food-select').addEventListener('change', updateIntakeFoodQtyUi);

    document.getElementById('intake-modal-save').addEventListener('click', () => {
        if (activeIntakeType === 'meal') {
            const mealTemplateId = document.getElementById('intake-meal-select').value;
            if (!mealTemplateId) return alert('اختر وجبة');
            DataManager.addIntakeExtra(plan, selectedDay, {
                type: 'meal',
                mealTemplateId,
                servings: parseFloat(document.getElementById('intake-meal-servings').value) || 1
            });
        } else if (activeIntakeType === 'food') {
            const foodId = document.getElementById('intake-food-select').value;
            if (!foodId) return alert('اختر طعاماً');
            const minQ = DataManager.getFoodMinQuantity(plan.foodsLibrary[foodId]);
            DataManager.addIntakeExtra(plan, selectedDay, {
                type: 'food',
                foodId,
                mealQuantity: {
                    amount: parseFloat(document.getElementById('intake-food-amount').value) || minQ.amount,
                    unit: minQ.unit
                }
            });
        } else {
            const name = document.getElementById('intake-custom-name').value.trim();
            if (!name) return alert('أدخل اسماً');
            DataManager.addIntakeExtra(plan, selectedDay, {
                type: 'custom',
                name,
                macros: {
                    p: parseFloat(document.getElementById('intake-custom-p').value) || 0,
                    c: parseFloat(document.getElementById('intake-custom-c').value) || 0,
                    f: parseFloat(document.getElementById('intake-custom-f').value) || 0,
                    cal: parseFloat(document.getElementById('intake-custom-cal').value) || 0
                }
            });
        }
        savePlan();
        intakeModal.hidden = true;
        intakeModal.setAttribute('aria-hidden', 'true');
        renderDashboardForDay();
    });

    const rulesContainer = document.getElementById('rules-container');
    plan.rules.forEach(rule => {
        const li = document.createElement('li');
        li.textContent = rule;
        rulesContainer.appendChild(li);
    });

    document.querySelectorAll('.dash-jump-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href');
            document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const jumpLinks = document.querySelectorAll('.dash-jump-link');
    const sections = ['section-summary', 'section-meals', 'section-extras', 'section-rules'].map(id => document.getElementById(id));

    const updateJumpActive = () => {
        let current = sections[0]?.id;
        const offset = 120;
        sections.forEach(sec => {
            if (sec && sec.getBoundingClientRect().top <= offset) {
                current = sec.id;
            }
        });
        jumpLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
        });
    };

    window.addEventListener('scroll', updateJumpActive, { passive: true });
    updateJumpActive();

    DataManager.recordDayIntakeSnapshot(plan, DataManager.getTodayDayId());
    DataManager.savePlan(plan);

    renderDashboardForDay();
});
