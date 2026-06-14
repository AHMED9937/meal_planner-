document.addEventListener('DOMContentLoaded', () => {

    const plan = DataManager.loadPlan();

    // UI Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sidebarTitle = document.getElementById('sidebar-title');
    const listContainer = document.getElementById('list-container');
    const editorTitle = document.getElementById('editor-title');
    const editorContent = document.getElementById('editor-content');
    const toast = document.getElementById('save-toast');
    const btnAddItem = document.getElementById('btn-add-item');

    // Current State
    let currentTab = 'foods'; // 'foods', 'meals', 'schedule', 'grocery'
    let grocerySearchQuery = '';
    let currentItemId = null; // ID of the currently selected item in the sidebar
    let foodsSearchQuery = '';
    let mealsSearchQuery = '';
    let currentScheduleDay = DataManager.getTodayDayId();

    // ----- UI Helpers -----
    const showToast = () => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    };

    const saveAndRefresh = () => {
        DataManager.savePlan(plan);
        showToast();
        renderSidebar();
        if (currentTab === 'grocery') {
            renderGroceryView();
        } else if (currentItemId) {
            renderEditor();
        } else if (currentTab === 'schedule') {
            renderScheduleDaySummary();
        } else {
            clearEditor();
        }
    };

    const clearEditor = () => {
        editorTitle.innerHTML = 'اختر عنصراً للتعديل';
        editorContent.innerHTML = '<div class="empty-state"><i class="fa-solid fa-hand-pointer"></i><p>اختر من القائمة الجانبية.</p></div>';
    };

    const scheduleCopyPanelHtml = (targetDayId) => {
        const targetLabel = DataManager.getDayLabel(targetDayId);
        const dayOptions = DataManager.WEEK_DAY_ORDER.map(dayId => {
            const count = DataManager.getDaySchedule(plan, dayId).length;
            const label = DataManager.getDayLabel(dayId);
            const macros = count > 0
                ? DataManager.formatMacrosSummary(DataManager.computeDayMacros(plan, dayId), { compact: true })
                : 'فارغ';
            return `<option value="${dayId}">${label} (${count} وجبات · ${macros})</option>`;
        }).join('');

        const targetCheckboxes = DataManager.WEEK_DAY_ORDER
            .filter(dayId => dayId !== targetDayId)
            .map(dayId => {
                const count = DataManager.getDaySchedule(plan, dayId).length;
                return `
                    <label class="schedule-copy-target">
                        <input type="checkbox" class="schedule-copy-target-cb" value="${dayId}">
                        ${DataManager.getDayLabel(dayId)}
                        ${count > 0 ? `<small>(${count})</small>` : ''}
                    </label>
                `;
            }).join('');

        return `
            <div class="schedule-copy-panel card">
                <div class="card-header" style="padding:0.75rem 1rem;">
                    <h3 class="section-title" style="margin:0;font-size:1rem;">
                        <i class="fa-solid fa-copy"></i> نسخ جدول يوم ليوم آخر
                    </h3>
                </div>
                <div class="card-body" style="padding:1rem;">
                    <div class="schedule-copy-block">
                        <p class="schedule-copy-desc">انسخ كل مواعيد ووجبات يوم إلى <strong>${targetLabel}</strong> (يستبدل جدول هذا اليوم):</p>
                        <div class="schedule-copy-row">
                            <label for="schedule-copy-from">من يوم</label>
                            <select id="schedule-copy-from" class="form-control">${dayOptions}</select>
                            <button type="button" id="btn-schedule-copy-from" class="btn btn-primary btn-sm">
                                <i class="fa-solid fa-arrow-left"></i> نسخ إلى ${targetLabel}
                            </button>
                        </div>
                    </div>
                    <div class="schedule-copy-divider"></div>
                    <div class="schedule-copy-block">
                        <p class="schedule-copy-desc">انسخ جدول <strong>${targetLabel}</strong> إلى أيام أخرى (يستبدل جدول كل يوم محدّد):</p>
                        <div class="schedule-copy-targets">${targetCheckboxes}</div>
                        <div class="schedule-copy-actions">
                            <button type="button" id="btn-schedule-copy-select-all" class="btn btn-sm btn-secondary">تحديد الكل</button>
                            <button type="button" id="btn-schedule-copy-to" class="btn btn-primary btn-sm">
                                <i class="fa-solid fa-copy"></i> نسخ ${targetLabel} إلى المحدد
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const wireScheduleCopyPanel = (targetDayId) => {
        const fromSelect = document.getElementById('schedule-copy-from');
        if (fromSelect) {
            const others = DataManager.WEEK_DAY_ORDER.filter(d => d !== targetDayId && DataManager.getDaySchedule(plan, d).length > 0);
            if (others.length) fromSelect.value = others[0];
        }

        document.getElementById('btn-schedule-copy-from')?.addEventListener('click', () => {
            const fromDay = document.getElementById('schedule-copy-from')?.value;
            if (!fromDay) return;
            if (fromDay === targetDayId) {
                alert('اختر يوماً مختلفاً عن اليوم الحالي.');
                return;
            }
            const count = DataManager.getDaySchedule(plan, fromDay).length;
            if (!count) {
                alert('اليوم المختار لا يحتوي على مواعيد.');
                return;
            }
            const fromLabel = DataManager.getDayLabel(fromDay);
            const toLabel = DataManager.getDayLabel(targetDayId);
            if (!confirm(`نسخ ${count} موعداً من ${fromLabel} إلى ${toLabel}؟\nسيتم استبدال جدول ${toLabel} بالكامل.`)) return;
            const result = DataManager.copyScheduleDay(plan, fromDay, targetDayId);
            if (result.ok) {
                DataManager.savePlan(plan);
                currentItemId = null;
                saveAndRefresh();
            }
        });

        document.getElementById('btn-schedule-copy-select-all')?.addEventListener('click', () => {
            document.querySelectorAll('.schedule-copy-target-cb').forEach(cb => { cb.checked = true; });
        });

        document.getElementById('btn-schedule-copy-to')?.addEventListener('click', () => {
            const targets = [...document.querySelectorAll('.schedule-copy-target-cb:checked')].map(cb => cb.value);
            if (!targets.length) {
                alert('حدّد يوماً واحداً على الأقل.');
                return;
            }
            const count = DataManager.getDaySchedule(plan, targetDayId).length;
            if (!count) {
                alert(`لا توجد مواعيد في ${DataManager.getDayLabel(targetDayId)} للنسخ.`);
                return;
            }
            const names = targets.map(d => DataManager.getDayLabel(d)).join('، ');
            if (!confirm(`نسخ ${count} موعداً من ${DataManager.getDayLabel(targetDayId)} إلى:\n${names}؟\nسيتم استبدال جدول كل يوم محدّد.`)) return;
            const result = DataManager.copyScheduleDay(plan, targetDayId, targets);
            if (result.ok) {
                DataManager.savePlan(plan);
                saveAndRefresh();
            }
        });
    };

    const renderScheduleDaySummary = () => {
        const dayLabel = DataManager.getDayLabel(currentScheduleDay);
        const slots = DataManager.getDaySchedule(plan, currentScheduleDay);
        const dayMacros = DataManager.computeDayMacros(plan, currentScheduleDay);

        editorTitle.innerHTML = `<i class="fa-solid fa-chart-pie" style="color:var(--accent-yellow)"></i> القيمة الغذائية — ${dayLabel}`;

        const copyPanel = scheduleCopyPanelHtml(currentScheduleDay);

        if (slots.length === 0) {
            editorContent.innerHTML = `
                ${copyPanel}
                <div class="empty-state" style="margin-top:1rem;">
                    <i class="fa-solid fa-calendar-plus"></i>
                    <p>لا توجد وجبات في ${dayLabel}. أضف موعداً من زر + أو انسخ من يوم آخر أعلاه.</p>
                </div>`;
            wireScheduleCopyPanel(currentScheduleDay);
            return;
        }

        const mealsList = slots.map(entry => {
            const meal = entry.mealTemplateId && plan.mealsLibrary[entry.mealTemplateId];
            DataManager.normalizeScheduleEntry(entry);
            const macros = entry.mealTemplateId
                ? DataManager.computeScheduleSlotMacros(plan, entry)
                : DataManager.emptyMacros();
            return `
                <li class="schedule-day-meal-row">
                    <span class="schedule-day-meal-time">${entry.time || '—'}</span>
                    <span class="schedule-day-meal-name">${meal ? meal.name : 'غير محدد'}</span>
                    <span class="schedule-day-meal-macros">${DataManager.formatMacroDisplay(macros.cal)} Cal</span>
                </li>
            `;
        }).join('');

        editorContent.innerHTML = `
            ${copyPanel}
            <div class="day-macros-card" style="margin-bottom:1.25rem;margin-top:1rem;">
                <div class="day-macros-title">
                    <i class="fa-solid fa-chart-pie"></i>
                    مجموع اليوم (${slots.length} وجبات)
                </div>
                <div class="comp-macros day-macros-badges">
                    ${macroBadgesHtml(dayMacros)}
                </div>
            </div>
            <div class="schedule-day-meals-list">
                <h3 class="schedule-day-meals-title">قيمة كل وجبة</h3>
                <ul class="schedule-day-meals">${mealsList}</ul>
            </div>
        `;
        wireScheduleCopyPanel(currentScheduleDay);
    };

    const refreshMealEditorTotals = () => {
        const totalsEl = document.querySelector('.meal-editor-totals');
        if (!totalsEl || !currentItemId) return;
        const mealTemplate = plan.mealsLibrary[currentItemId];
        if (!mealTemplate) return;
        const totals = DataManager.computeMealMacros(
            currentItemId,
            plan.mealsLibrary,
            plan.foodsLibrary
        );
        totalsEl.innerHTML = `
            <span><strong>القيمة الغذائية للوجبة كاملة:</strong></span>
            ${macroBadgesHtml(totals)}
        `;
    };

    const macroBadgesHtml = (macros) => {
        if (!macros) {
            return '<span class="macro-badge text-muted">—</span>';
        }
        const f = (n) => DataManager.formatMacroDisplay(n);
        return `
            <span class="macro-badge" title="بروتين">P: ${f(macros.p)}g</span>
            <span class="macro-badge" title="كارب">C: ${f(macros.c)}g</span>
            <span class="macro-badge" title="دهون">F: ${f(macros.f)}g</span>
            <span class="macro-badge highlight-macro" title="سعرات">${f(macros.cal)} Cal</span>
        `;
    };

    const macrosBlockHtml = (macros, options = {}) => {
        const {
            title = 'القيمة الغذائية',
            emptyHint = 'اختر عنصراً لعرض القيم الغذائية',
            detailHint = ''
        } = options;
        return `
            <div class="component-macros-block ${options.modifier || ''}">
                <div class="component-macros-label">
                    <i class="fa-solid fa-chart-pie"></i> ${title}
                </div>
                <div class="comp-macros">
                    ${macros ? macroBadgesHtml(macros) : `<span class="macro-badge text-muted">${emptyHint}</span>`}
                </div>
                ${detailHint}
            </div>
        `;
    };

    const componentMacrosBlockHtml = (comp) => {
        const macros = DataManager.computeComponentMacros(comp, plan.mealsLibrary, plan.foodsLibrary);
        let emptyHint = 'اختر عنصراً لعرض القيم الغذائية';
        let detailHint = '';
        let title = 'القيمة الغذائية لهذا العنصر';

        if (DataManager.isMealSlot(comp)) {
            emptyHint = 'اختر قالب وجبة فرعية';
            title = 'القيمة الغذائية للوجبة الفرعية';
            const nested = comp.nestedMealTemplateId && plan.mealsLibrary[comp.nestedMealTemplateId];
            if (nested) {
                detailHint = `<small class="text-muted">مجموع قالب «${nested.name}» × ${comp.servings} حصة</small>`;
            }
        } else {
            title = 'القيمة الغذائية — العنصر الأساسي';
            const food = comp.activeFoodId && plan.foodsLibrary[comp.activeFoodId];
            if (food) {
                detailHint = `<small class="text-muted">للكمية ${DataManager.formatQuantity(comp.mealQuantity)} (الحد الأدنى: ${DataManager.formatMinQuantity(food)})</small>`;
            } else if (comp.activeFoodId) {
                emptyHint = 'لا توجد قيم غذائية مسجلة لهذا الطعام';
            } else {
                emptyHint = 'اختر طعاماً من القائمة';
            }
        }

        return macrosBlockHtml(macros, { title, emptyHint, detailHint, modifier: 'component-macros-block--primary' });
    };

    const alternativeMacrosBlockHtml = (altEntry) => {
        const foodId = DataManager.getFoodAlternativeId(altEntry);
        const food = foodId && plan.foodsLibrary[foodId];
        const macros = DataManager.computeFoodAlternativeMacros(altEntry, plan.foodsLibrary);
        const label = food
            ? DataManager.formatFoodAlternativeLabel(altEntry, plan.foodsLibrary)
            : 'البديل';
        let detailHint = '';
        if (food && altEntry.mealQuantity) {
            detailHint = `<small class="text-muted">للكمية ${DataManager.formatQuantity(altEntry.mealQuantity)}</small>`;
        }
        return macrosBlockHtml(macros, {
            title: `القيمة الغذائية — ${label}`,
            emptyHint: food ? 'لا توجد قيم غذائية' : 'اختر طعاماً للبديل',
            detailHint,
            modifier: 'component-macros-block--alt'
        });
    };

    const nestedMealContentsHtml = (nestedMealId) => {
        const nested = nestedMealId && plan.mealsLibrary[nestedMealId];
        if (!nested || !nested.components.length) {
            return '<div class="nested-meal-preview text-muted">لا مكونات في هذه الوجبة</div>';
        }
        const items = nested.components.map(comp => {
            DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);
            if (DataManager.isMealSlot(comp)) {
                const sub = plan.mealsLibrary[comp.nestedMealTemplateId];
                return `<li><i class="fa-solid fa-bowl-food"></i> ${sub ? sub.name : 'وجبة محذوفة'} × ${comp.servings}</li>`;
            }
            const food = comp.activeFoodId && plan.foodsLibrary[comp.activeFoodId];
            const label = food ? food.name : 'طعام غير محدد';
            return `<li><i class="fa-solid fa-utensils"></i> ${label} · ${DataManager.formatQuantity(comp.mealQuantity)}</li>`;
        }).join('');
        return `<ul class="nested-meal-preview">${items}</ul>`;
    };

    const wireSearchableDropdown = (wrapper, populateListFn) => {
        const header = wrapper.querySelector('.dropdown-header');
        const body = wrapper.querySelector('.dropdown-body');
        const searchInput = wrapper.querySelector('.dropdown-search');
        const list = wrapper.querySelector('.dropdown-list');

        const stopBubble = (e) => e.stopPropagation();
        wrapper.addEventListener('mousedown', stopBubble);
        wrapper.addEventListener('click', stopBubble);
        body.addEventListener('mousedown', stopBubble);
        body.addEventListener('click', stopBubble);

        const populateList = (filterTerm = '') => {
            populateListFn(list, String(filterTerm).trim().toLowerCase(), () => {
                body.style.display = 'none';
            });
        };

        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = body.style.display === 'block';
            document.querySelectorAll('.searchable-dropdown .dropdown-body').forEach(b => {
                if (!wrapper.contains(b)) b.style.display = 'none';
            });
            if (!isVisible) {
                body.style.display = 'block';
                searchInput.value = '';
                populateList();
                requestAnimationFrame(() => searchInput.focus());
            } else {
                body.style.display = 'none';
            }
        });

        searchInput.addEventListener('input', (e) => {
            e.stopPropagation();
            populateList(e.target.value);
        });
        searchInput.addEventListener('keydown', (e) => e.stopPropagation());
        searchInput.addEventListener('click', stopBubble);
        searchInput.addEventListener('mousedown', stopBubble);

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) body.style.display = 'none';
        });

        return { populateList, close: () => { body.style.display = 'none'; } };
    };

    const createNestedMealDropdown = (parentMealId, currentNestedId, onSelect, extraExcludeIds = []) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'searchable-dropdown nested-meal-dropdown';

        let currentName = 'اختر قالب وجبة...';
        if (currentNestedId && plan.mealsLibrary[currentNestedId]) {
            currentName = plan.mealsLibrary[currentNestedId].name;
        }

        wrapper.innerHTML = `
            <div class="dropdown-header">
                <span class="dropdown-header-label">${currentName}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="dropdown-body" style="display:none;">
                <input type="text" class="form-control dropdown-search" placeholder="ابحث عن قالب وجبة..." autocomplete="off">
                <ul class="dropdown-list"></ul>
            </div>
        `;

        const mealMacroCache = {};
        Object.keys(plan.mealsLibrary).forEach(mtId => {
            mealMacroCache[mtId] = DataManager.computeMealMacros(
                mtId,
                plan.mealsLibrary,
                plan.foodsLibrary
            );
        });

        wireSearchableDropdown(wrapper, (list, filterTerm, closeDropdown) => {
            list.innerHTML = '';
            let matchCount = 0;

            const appendMealOption = (mtId, meal) => {
                const mealName = meal.name || '';
                const macros = mealMacroCache[mtId] || DataManager.emptyMacros();
                const li = document.createElement('li');
                li.className = 'dropdown-food-item';
                li.innerHTML = `
                    <span class="dd-food-name"><i class="fa-solid fa-bowl-food"></i> ${mealName}</span>
                    <span class="dd-food-macros">${DataManager.formatMacrosSummary(macros)}</span>
                `;
                if (mtId === currentNestedId) li.classList.add('selected');
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeDropdown();
                    wrapper.querySelector('.dropdown-header-label').textContent = mealName;
                    onSelect(mtId);
                });
                list.appendChild(li);
                matchCount += 1;
            };

            DataManager.MEAL_CATEGORY_ORDER.forEach(catId => {
                const cat = DataManager.MEAL_CATEGORIES[catId];
                const mealsInCat = Object.keys(plan.mealsLibrary).filter(mtId => {
                    if (extraExcludeIds.includes(mtId)) return false;
                    if (mtId === parentMealId) return false;
                    if (parentMealId && DataManager.wouldCreateMealCycle(parentMealId, mtId, plan.mealsLibrary)) return false;
                    const meal = plan.mealsLibrary[mtId];
                    DataManager.normalizeMeal(meal);
                    if (meal.category !== catId) return false;
                    const haystack = `${meal.name || ''} ${mtId} ${cat.label}`.toLowerCase();
                    return !filterTerm || haystack.includes(filterTerm);
                });

                if (mealsInCat.length === 0) return;

                const headerLi = document.createElement('li');
                headerLi.className = 'dropdown-category-label';
                headerLi.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.label}`;
                list.appendChild(headerLi);

                mealsInCat
                    .sort((a, b) => plan.mealsLibrary[a].name.localeCompare(plan.mealsLibrary[b].name, 'ar'))
                    .forEach(mtId => appendMealOption(mtId, plan.mealsLibrary[mtId]));
            });

            if (matchCount === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'dropdown-empty-msg';
                emptyLi.textContent = filterTerm
                    ? 'لا توجد نتائج للبحث'
                    : 'لا توجد قوالب وجبات متاحة';
                list.appendChild(emptyLi);
            }
        });

        return wrapper;
    };

    const renderMealAlternativesList = (container, alternatives, parentMealId, extraExcludeIds, onChange, options = {}) => {
        if (!alternatives) return;
        container.innerHTML = '';
        const { currentMainId, onUseAsMain } = options;

        if (alternatives.length === 0) {
            container.innerHTML = '<div class="empty-state-small text-muted" style="padding:1rem; font-size:0.85rem;">لا يوجد بدائل محددة.</div>';
            return;
        }

        alternatives.forEach((altMealId, altIdx) => {
            const altDiv = document.createElement('div');
            altDiv.className = 'manager-list-item';
            altDiv.style.overflow = 'visible';
            altDiv.style.padding = '0.5rem';
            altDiv.style.background = 'rgba(42, 157, 143, 0.08)';

            const exclude = [...extraExcludeIds];
            alternatives.forEach((id, i) => {
                if (i !== altIdx && id) exclude.push(id);
            });

            const altDropdown = createNestedMealDropdown(
                parentMealId,
                altMealId,
                (selectedMtId) => {
                    alternatives[altIdx] = selectedMtId;
                    onChange();
                },
                exclude
            );

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'item-actions';
            if (onUseAsMain && altMealId && altMealId !== currentMainId) {
                const useBtn = document.createElement('button');
                useBtn.type = 'button';
                useBtn.className = 'btn btn-sm btn-primary btn-use-meal-alt';
                useBtn.title = 'استخدم هذه الوجبة بدلاً من الحالية';
                useBtn.innerHTML = '<i class="fa-solid fa-right-left"></i> استخدم';
                useBtn.addEventListener('click', () => onUseAsMain(altMealId));
                controlsDiv.appendChild(useBtn);
            }
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn-icon text-danger btn-del-meal-alt';
            delBtn.title = 'إزالة البديل';
            delBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            delBtn.addEventListener('click', () => {
                alternatives.splice(altIdx, 1);
                onChange();
            });
            controlsDiv.appendChild(delBtn);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'item-content';
            contentDiv.appendChild(altDropdown);
            altDiv.appendChild(contentDiv);
            altDiv.appendChild(controlsDiv);
            container.appendChild(altDiv);
        });
    };

    const mealSwapButtonsHtml = (currentId, altIds, mealsLibrary) => {
        if (!currentId || !altIds.length) return '';
        const current = mealsLibrary[currentId];
        const currentName = current ? current.name : 'الحالية';
        let html = `<div class="meal-swap-panel">
            <span class="meal-swap-label"><i class="fa-solid fa-right-left"></i> بدّل إلى:</span>
            <div class="meal-swap-btns">
                <button type="button" class="meal-swap-btn is-active" disabled>${currentName}</button>`;
        altIds.forEach(altId => {
            const meal = mealsLibrary[altId];
            if (!meal) return;
            html += `<button type="button" class="meal-swap-btn" data-meal-id="${altId}">${meal.name}</button>`;
        });
        html += '</div></div>';
        return html;
    };

    const attachFoodQuantityControls = (holder, foodId, mealQuantity, options = {}) => {
        const { compact = false, onUpdate } = options;
        if (!holder) return;

        const food = foodId && plan.foodsLibrary[foodId];
        if (!food) {
            holder.innerHTML = `<div class="meal-qty-disabled text-muted">${compact ? 'حدّد الطعام أولاً' : 'اختر طعاماً لتحديد الكمية'}</div>`;
            return;
        }

        const minQ = DataManager.getFoodMinQuantity(food);
        const unitShort = DataManager.QUANTITY_UNIT_SHORT[minQ.unit] || minQ.unit;
        if (!mealQuantity) {
            mealQuantity = { ...minQ };
        }
        DataManager.normalizeQuantity(mealQuantity, minQ.unit);

        holder.innerHTML = `
            <div class="meal-qty-controls ${compact ? 'meal-qty-controls--compact' : ''}">
                ${compact
                    ? `<label class="meal-qty-label meal-qty-label--compact">كمية البديل <span class="meal-qty-min-hint">(حد أدنى ${DataManager.formatMinQuantity(food)})</span></label>`
                    : `<label class="meal-qty-label">
                    كمية في هذه الوجبة
                    <span class="meal-qty-min-hint">(الحد الأدنى: ${DataManager.formatMinQuantity(food)})</span>
                </label>`}
                <div class="meal-qty-row">
                    <button type="button" class="btn btn-sm btn-secondary btn-qty-minus" title="تقليل"><i class="fa-solid fa-minus"></i></button>
                    <input type="number" class="form-control meal-qty-input" min="${minQ.amount}" step="0.1" value="${mealQuantity.amount}">
                    <span class="meal-qty-unit">${unitShort}</span>
                    <button type="button" class="btn btn-sm btn-secondary btn-qty-plus" title="زيادة"><i class="fa-solid fa-plus"></i></button>
                </div>
                ${compact ? '' : `<small class="text-muted">كل ضغطة على + تضيف ${DataManager.formatMinQuantity(food)}</small>`}
            </div>
        `;

        const input = holder.querySelector('.meal-qty-input');
        const applyAmount = (amount) => {
            mealQuantity.amount = Math.max(minQ.amount, amount);
            input.value = mealQuantity.amount;
            DataManager.savePlan(plan);
            if (onUpdate) onUpdate();
        };

        holder.querySelector('.btn-qty-plus').addEventListener('click', () => {
            applyAmount(mealQuantity.amount + minQ.amount);
        });
        holder.querySelector('.btn-qty-minus').addEventListener('click', () => {
            applyAmount(mealQuantity.amount - minQ.amount);
        });
        input.addEventListener('change', () => {
            applyAmount(parseFloat(input.value) || minQ.amount);
        });
    };

    const attachMealQuantityControls = (slotDiv, comp) => {
        const holder = slotDiv.querySelector('.meal-qty-holder');
        attachFoodQuantityControls(holder, comp.activeFoodId, comp.mealQuantity, {
            onUpdate: () => {
                slotDiv.querySelector('.component-macros-preview').innerHTML = componentMacrosBlockHtml(comp);
                refreshMealEditorTotals();
            }
        });
    };

    const attachNestedMealServingsControls = (slotDiv, comp) => {
        const holder = slotDiv.querySelector('.nested-servings-holder');
        if (!holder) return;

        if (!comp.nestedMealTemplateId) {
            holder.innerHTML = `<div class="meal-qty-disabled text-muted">اختر وجبة فرعية</div>`;
            return;
        }

        DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);

        holder.innerHTML = `
            <div class="meal-qty-controls nested-servings-controls">
                <label class="meal-qty-label">عدد الحصص من الوجبة الفرعية</label>
                <div class="meal-qty-row">
                    <button type="button" class="btn btn-sm btn-secondary btn-servings-minus"><i class="fa-solid fa-minus"></i></button>
                    <input type="number" class="form-control meal-qty-input nested-servings-input" min="0.25" step="0.25" value="${comp.servings}">
                    <span class="meal-qty-unit">حصة</span>
                    <button type="button" class="btn btn-sm btn-secondary btn-servings-plus"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;

        const input = holder.querySelector('.nested-servings-input');
        const preview = slotDiv.querySelector('.nested-meal-contents');
        if (preview) preview.innerHTML = nestedMealContentsHtml(comp.nestedMealTemplateId);

        const refresh = () => {
            slotDiv.querySelector('.component-macros-preview').innerHTML = componentMacrosBlockHtml(comp);
            if (preview) preview.innerHTML = nestedMealContentsHtml(comp.nestedMealTemplateId);
            refreshMealEditorTotals();
        };

        const applyServings = (n) => {
            comp.servings = Math.max(0.25, parseFloat(n) || 1);
            input.value = comp.servings;
            DataManager.savePlan(plan);
            refresh();
        };

        holder.querySelector('.btn-servings-plus').addEventListener('click', () => applyServings(comp.servings + 0.25));
        holder.querySelector('.btn-servings-minus').addEventListener('click', () => applyServings(comp.servings - 0.25));
        input.addEventListener('change', () => applyServings(parseFloat(input.value) || 1));
    };

    const renderFoodComponentSlot = (mealTemplate, mId, comp, compIdx, compsList) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'meal-slot meal-slot-food';
        slotDiv.style.background = 'rgba(0,0,0,0.2)';
        slotDiv.style.border = '1px solid var(--card-border)';
        slotDiv.style.borderRadius = '8px';
        slotDiv.style.padding = '1rem';

        slotDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem;">
                <strong style="color:var(--accent-red)"><i class="fa-solid fa-utensils"></i> عنصر طعام (#${compIdx + 1})</strong>
                <button class="btn-icon text-danger btn-del-comp" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="active-dropdown-holder" style="margin-bottom:0.75rem;"></div>
            <div class="meal-qty-holder"></div>
            <div class="component-macros-preview"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; margin-top:1rem;">
                <label style="margin:0; font-size:0.9rem; color:var(--accent-yellow)"><i class="fa-solid fa-random"></i> البدائل المسموحة <b>(${comp.allowedAlternatives ? comp.allowedAlternatives.length : 0})</b></label>
                <button class="btn btn-sm btn-secondary btn-add-slot-alt" style="padding:0.2rem 0.5rem; font-size:0.8rem;"><i class="fa-solid fa-plus"></i> إضافة بديل</button>
            </div>
            <div class="alts-holder manager-list"></div>
        `;

        slotDiv.querySelector('.btn-del-comp').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من مسح هذا العنصر؟')) {
                mealTemplate.components.splice(compIdx, 1);
                saveAndRefresh();
            }
        });

        DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);

        const activeDropdown = createSearchableDropdown(comp.activeFoodId, (selectedFId) => {
            comp.activeFoodId = selectedFId;
            const selectedFood = selectedFId && plan.foodsLibrary[selectedFId];
            if (selectedFood) {
                comp.mealQuantity = { ...DataManager.getFoodMinQuantity(selectedFood) };
            }
            saveAndRefresh();
        });
        slotDiv.querySelector('.active-dropdown-holder').appendChild(activeDropdown);
        attachMealQuantityControls(slotDiv, comp);
        slotDiv.querySelector('.component-macros-preview').innerHTML = componentMacrosBlockHtml(comp);

        if (!comp.allowedAlternatives) comp.allowedAlternatives = [];
        slotDiv.querySelector('.btn-add-slot-alt').addEventListener('click', () => {
            comp.allowedAlternatives.push(DataManager.normalizeFoodAlternative(null, plan.foodsLibrary));
            saveAndRefresh();
        });

        const altsHolder = slotDiv.querySelector('.alts-holder');
        if (comp.allowedAlternatives.length === 0) {
            altsHolder.innerHTML = '<div class="empty-state-small text-muted" style="padding:1rem; font-size:0.85rem;">لا يوجد بدائل محددة.</div>';
        } else {
            comp.allowedAlternatives.forEach((altEntry, altIdx) => {
                DataManager.normalizeFoodAlternative(altEntry, plan.foodsLibrary);
                const altDiv = document.createElement('div');
                altDiv.className = 'manager-list-item alt-list-item';
                altDiv.style.overflow = 'visible';
                altDiv.style.padding = '0.5rem';
                altDiv.style.background = 'rgba(230, 57, 70, 0.05)';

                const altFoodId = DataManager.getFoodAlternativeId(altEntry);
                const altDropdown = createSearchableDropdown(altFoodId, (selectedFId) => {
                    altEntry.foodId = selectedFId;
                    const selectedFood = selectedFId && plan.foodsLibrary[selectedFId];
                    if (selectedFood) {
                        altEntry.mealQuantity = { ...DataManager.getFoodMinQuantity(selectedFood) };
                    }
                    saveAndRefresh();
                });
                if (altFoodId && plan.foodsLibrary[altFoodId]) {
                    altDropdown.querySelector('.dropdown-header-label').textContent =
                        DataManager.formatFoodAlternativeLabel(altEntry, plan.foodsLibrary);
                }

                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'item-actions';
                const useFoodBtn = document.createElement('button');
                useFoodBtn.type = 'button';
                useFoodBtn.className = 'btn btn-sm btn-primary btn-use-food-alt';
                useFoodBtn.title = 'استخدم كعنصر أساسي';
                useFoodBtn.innerHTML = '<i class="fa-solid fa-right-left"></i> استخدم';
                useFoodBtn.addEventListener('click', () => {
                    if (DataManager.swapComponentFoodWithAlternative(comp, altIdx, plan.foodsLibrary)) {
                        saveAndRefresh();
                    }
                });
                controlsDiv.appendChild(useFoodBtn);
                const delAltBtn = document.createElement('button');
                delAltBtn.type = 'button';
                delAltBtn.className = 'btn-icon text-danger btn-del-alt';
                delAltBtn.title = 'حذف البديل';
                delAltBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
                delAltBtn.addEventListener('click', () => {
                    comp.allowedAlternatives.splice(altIdx, 1);
                    saveAndRefresh();
                });
                controlsDiv.appendChild(delAltBtn);

                const contentDiv = document.createElement('div');
                contentDiv.className = 'item-content alt-item-content';
                contentDiv.innerHTML = `
                    <div class="alt-dropdown-holder"></div>
                    <div class="alt-qty-holder"></div>
                    <div class="alt-macros-preview"></div>
                `;
                contentDiv.querySelector('.alt-dropdown-holder').appendChild(altDropdown);

                const altQtyHolder = contentDiv.querySelector('.alt-qty-holder');
                const altMacrosPreview = contentDiv.querySelector('.alt-macros-preview');
                const refreshAltMacros = () => {
                    altMacrosPreview.innerHTML = alternativeMacrosBlockHtml(altEntry);
                };
                refreshAltMacros();

                attachFoodQuantityControls(altQtyHolder, altEntry.foodId, altEntry.mealQuantity, {
                    compact: true,
                    onUpdate: () => {
                        const label = altDropdown.querySelector('.dropdown-header-label');
                        if (label && altEntry.foodId) {
                            label.textContent = DataManager.formatFoodAlternativeLabel(altEntry, plan.foodsLibrary);
                        }
                        refreshAltMacros();
                    }
                });

                altDiv.appendChild(contentDiv);
                altDiv.appendChild(controlsDiv);
                altsHolder.appendChild(altDiv);
            });
        }

        compsList.appendChild(slotDiv);
    };

    const renderNestedMealComponentSlot = (mealTemplate, mId, comp, compIdx, compsList) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'meal-slot meal-slot-nested';
        slotDiv.style.background = 'rgba(42, 157, 143, 0.06)';
        slotDiv.style.border = '1px solid rgba(42, 157, 143, 0.35)';
        slotDiv.style.borderRadius = '8px';
        slotDiv.style.padding = '1rem';

        slotDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem;">
                <strong style="color:var(--accent-green)"><i class="fa-solid fa-bowl-food"></i> وجبة فرعية (#${compIdx + 1})</strong>
                <button class="btn-icon text-danger btn-del-comp" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="nested-meal-dropdown-holder" style="margin-bottom:0.75rem;"></div>
            <div class="nested-servings-holder"></div>
            <div class="nested-meal-contents"></div>
            <div class="component-macros-preview" style="margin-top:0.75rem;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; margin-top:1rem;">
                <label style="margin:0; font-size:0.9rem; color:var(--accent-green)"><i class="fa-solid fa-random"></i> بدائل الوجبة الفرعية <b>(${(comp.allowedMealAlternatives || []).length})</b></label>
                <button type="button" class="btn btn-sm btn-secondary btn-add-meal-slot-alt" style="padding:0.2rem 0.5rem; font-size:0.8rem; border-color:var(--accent-green); color:var(--accent-green);"><i class="fa-solid fa-plus"></i> إضافة بديل</button>
            </div>
            <div class="meal-alts-holder manager-list"></div>
        `;

        slotDiv.querySelector('.btn-del-comp').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من مسح هذه الوجبة الفرعية؟')) {
                mealTemplate.components.splice(compIdx, 1);
                saveAndRefresh();
            }
        });

        DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);
        if (!comp.allowedMealAlternatives) comp.allowedMealAlternatives = [];

        const refreshMealAlts = () => saveAndRefresh();

        const nestedDropdown = createNestedMealDropdown(mId, comp.nestedMealTemplateId, (selectedMtId) => {
            comp.nestedMealTemplateId = selectedMtId;
            comp.servings = 1;
            saveAndRefresh();
        }, [comp.nestedMealTemplateId, ...comp.allowedMealAlternatives.filter(Boolean)]);
        slotDiv.querySelector('.nested-meal-dropdown-holder').appendChild(nestedDropdown);
        attachNestedMealServingsControls(slotDiv, comp);
        slotDiv.querySelector('.component-macros-preview').innerHTML = componentMacrosBlockHtml(comp);

        slotDiv.querySelector('.btn-add-meal-slot-alt').addEventListener('click', () => {
            comp.allowedMealAlternatives.push(null);
            saveAndRefresh();
        });

        renderMealAlternativesList(
            slotDiv.querySelector('.meal-alts-holder'),
            comp.allowedMealAlternatives,
            mId,
            [comp.nestedMealTemplateId],
            refreshMealAlts,
            {
                currentMainId: comp.nestedMealTemplateId,
                onUseAsMain: (altId) => {
                    DataManager.swapNestedMealComponent(comp, altId, plan.mealsLibrary);
                    refreshMealAlts();
                }
            }
        );

        compsList.appendChild(slotDiv);
    };

    // ----- Tab Management -----
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            currentItemId = null;
            if (currentTab !== 'foods') foodsSearchQuery = '';
            if (currentTab !== 'meals') mealsSearchQuery = '';
            if (currentTab !== 'grocery') grocerySearchQuery = '';
            document.body.classList.toggle('manage-tab-grocery', currentTab === 'grocery');
            if (currentTab === 'grocery') {
                currentItemId = null;
                renderSidebar();
                renderGroceryView();
                return;
            }
            if (currentTab === 'schedule') {
                renderSidebar();
                renderScheduleDaySummary();
                return;
            }
            clearEditor();
            renderSidebar();
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const pTab = urlParams.get('tab');
    if (pTab && ['foods', 'meals', 'schedule', 'grocery'].includes(pTab)) {
        currentTab = pTab;
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${pTab}"]`).classList.add('active');
    }
    const pMeal = urlParams.get('meal');
    if (pMeal && currentTab === 'meals') {
        currentItemId = pMeal;
    }
    const pDay = urlParams.get('day');
    if (pDay && DataManager.WEEK_DAYS[pDay]) {
        currentScheduleDay = pDay;
    }
    const pSched = urlParams.get('sched');
    if (pSched && currentTab === 'schedule') {
        currentItemId = pSched;
    }


    // ----- Searchable Dropdown Helper (Custom UI) -----
    // Creates a searchable select dropdown over the foodsLibrary
    const createSearchableDropdown = (currentFoodId, onSelect) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'searchable-dropdown';

        let currentName = "اختر طعاماً...";
        if (currentFoodId && plan.foodsLibrary[currentFoodId]) {
            currentName = plan.foodsLibrary[currentFoodId].name;
        }

        wrapper.innerHTML = `
            <div class="dropdown-header">
                <span class="dropdown-header-label">${currentName}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="dropdown-body" style="display:none;">
                <input type="text" class="form-control dropdown-search" placeholder="ابحث عن طعام..." autocomplete="off">
                <ul class="dropdown-list"></ul>
                <div class="dropdown-action">
                    <button class="btn btn-sm btn-secondary btn-new-food" style="width:100%;"><i class="fa-solid fa-plus"></i> إنشاء طعام جديد</button>
                </div>
            </div>
        `;

        const body = wrapper.querySelector('.dropdown-body');
        const btnNewFood = wrapper.querySelector('.btn-new-food');

        wireSearchableDropdown(wrapper, (list, filterTerm, closeDropdown) => {
            list.innerHTML = '';
            let matchCount = 0;

            Object.keys(plan.foodsLibrary).forEach(fId => {
                const food = plan.foodsLibrary[fId];
                DataManager.normalizeFood(food);
                const foodName = food.name || '';
                const haystack = `${foodName} ${DataManager.getCategoryLabel(food.category)} ${fId}`.toLowerCase();
                if (filterTerm && !haystack.includes(filterTerm)) return;

                matchCount += 1;
                const m = food.macros;
                const macroLine = m
                    ? `<span class="dd-food-macros">${DataManager.formatMacrosSummary(m)}</span>`
                    : '';
                const metaLine = `<span class="dd-food-meta">${DataManager.getCategoryLabel(food.category)} · حد أدنى ${DataManager.formatMinQuantity(food)}</span>`;
                const li = document.createElement('li');
                li.className = 'dropdown-food-item';
                li.innerHTML = `<span class="dd-food-name">${foodName}</span>${metaLine}${macroLine}`;
                if (fId === currentFoodId) li.classList.add('selected');
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeDropdown();
                    wrapper.querySelector('.dropdown-header-label').textContent = foodName;
                    onSelect(fId);
                });
                list.appendChild(li);
            });

            if (matchCount === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'dropdown-empty-msg';
                emptyLi.textContent = filterTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أطعمة';
                list.appendChild(emptyLi);
            }
        });

        btnNewFood.addEventListener('click', (e) => {
            e.stopPropagation();
            const newId = DataManager.generateId('f');
            plan.foodsLibrary[newId] = DataManager.createDefaultFood({
                name: "طعام جديد (قم بتعديل الاسم)"
            });
            saveAndRefresh();
            onSelect(newId);
            body.style.display = 'none';
            alert("تم إنشاء الطعام الجديد في المكتبة. يمكنك تعديل اسمه بالذهاب لتبويب 'مكتبة الأطعمة'.");
        });

        return wrapper;
    };


    // ----- Sidebar Renderer -----

    const getScheduleDragAfterElement = (container, y) => {
        const items = [...container.querySelectorAll('.nav-item--draggable:not(.is-dragging)')];
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const wireScheduleSortableList = (ul, dayId) => {
        ul.addEventListener('dragstart', (e) => {
            const li = e.target.closest('.nav-item--draggable');
            if (!li) return;
            if (e.target.closest('.btn-delete')) {
                e.preventDefault();
                return;
            }
            li.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', li.dataset.index);
        });

        ul.addEventListener('dragend', (e) => {
            const li = e.target.closest('.nav-item--draggable');
            if (li) li.classList.remove('is-dragging');
        });

        ul.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const dragging = ul.querySelector('.is-dragging');
            if (!dragging) return;
            const after = getScheduleDragAfterElement(ul, e.clientY);
            if (after == null) {
                ul.appendChild(dragging);
            } else {
                ul.insertBefore(dragging, after);
            }
        });

        ul.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const items = [...ul.querySelectorAll('.nav-item--draggable')];
            const toIndex = items.findIndex(li => li.classList.contains('is-dragging'));
            if (!Number.isNaN(fromIndex) && toIndex >= 0 && fromIndex !== toIndex) {
                DataManager.reorderScheduleEntry(plan, dayId, fromIndex, toIndex);
                DataManager.savePlan(plan);
                renderSidebar();
                renderScheduleDaySummary();
                if (currentItemId) renderEditor();
            }
        });
    };

    const appendSidebarNavItem = (ul, key, item, icon, scheduleIndex) => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        const isScheduleDraggable = currentTab === 'schedule' && scheduleIndex !== undefined;

        if (isScheduleDraggable) {
            li.classList.add('nav-item--draggable');
            li.draggable = true;
            li.dataset.index = String(scheduleIndex);
        }

        const header = document.createElement('div');
        header.className = `nav-header ${currentItemId === key ? 'active' : ''}`;

        const displayName = item.name || item.title || 'عنصر بدون اسم';
        let metaHtml = '';
        if (currentTab === 'foods') {
            DataManager.normalizeFood(item);
            metaHtml = `<span class="nav-item-meta">${DataManager.formatStandardQuantity(item)}</span>`;
        } else if (currentTab === 'meals') {
            DataManager.normalizeMeal(item);
            const macros = DataManager.computeMealMacros(key, plan.mealsLibrary, plan.foodsLibrary);
            const altCount = (item.allowedMealAlternatives || []).filter(Boolean).length;
            const altPart = altCount > 0 ? ` · ${altCount} بديل` : '';
            metaHtml = `<span class="nav-item-meta">${DataManager.formatMacroDisplay(macros.cal)} Cal${altPart}</span>`;
        } else if (currentTab === 'schedule') {
            const found = DataManager.findScheduleEntry(plan, key);
            if (found?.entry?.mealTemplateId) {
                DataManager.normalizeScheduleEntry(found.entry);
                const macros = DataManager.computeScheduleSlotMacros(plan, found.entry);
                metaHtml = `<span class="nav-item-meta">${DataManager.formatMacroDisplay(macros.cal)} Cal</span>`;
            }
        }

        const dragHandleHtml = isScheduleDraggable
            ? `<button type="button" class="btn-icon schedule-drag-handle" title="اسحب لإعادة الترتيب" tabindex="-1"><i class="fa-solid fa-grip-vertical"></i></button>`
            : '';

        header.innerHTML = `
            ${dragHandleHtml}
            <div class="nav-item-text truncate">
                <span class="nav-item-title"><i class="fa-solid ${icon}" style="color:var(--accent-red); margin-left:8px;"></i> ${displayName}</span>
                ${metaHtml}
            </div>
            <button class="btn-icon text-muted btn-delete" title="حذف">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        header.querySelector('.nav-item-text').addEventListener('click', () => {
            currentItemId = key;
            renderSidebar();
            renderEditor();
        });

        header.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                if (currentTab === 'foods') delete plan.foodsLibrary[key];
                if (currentTab === 'meals') delete plan.mealsLibrary[key];
                if (currentTab === 'schedule') {
                    DataManager.removeScheduleEntry(plan, key);
                }
                if (currentItemId === key) currentItemId = null;
                saveAndRefresh();
            }
        });

        li.appendChild(header);
        ul.appendChild(li);
    };

    const updateSidebarAddButton = () => {
        btnAddItem.style.display = (currentTab === 'foods' || currentTab === 'meals' || currentTab === 'grocery')
            ? 'none'
            : '';
    };

    const foodMatchesSearch = (food, key) => {
        if (!foodsSearchQuery) return true;
        const haystack = [
            food.name,
            DataManager.getCategoryLabel(food.category),
            DataManager.formatStandardQuantity(food),
            key
        ].join(' ').toLowerCase();
        return haystack.includes(foodsSearchQuery);
    };

    const addFoodInCategory = (categoryId) => {
        const newId = DataManager.generateId('f');
        const catLabel = DataManager.getCategoryLabel(categoryId);
        plan.foodsLibrary[newId] = DataManager.createDefaultFood({
            name: `طعام جديد (${catLabel})`,
            category: categoryId
        });
        currentItemId = newId;
        saveAndRefresh();
    };

    const mealMatchesSearch = (meal, key) => {
        if (!mealsSearchQuery) return true;
        const haystack = [
            meal.name,
            DataManager.getMealCategoryLabel(meal.category),
            key
        ].join(' ').toLowerCase();
        return haystack.includes(mealsSearchQuery);
    };

    const addMealInCategory = (categoryId) => {
        const newId = DataManager.generateId('mt');
        const catLabel = DataManager.getMealCategoryLabel(categoryId);
        plan.mealsLibrary[newId] = DataManager.createDefaultMeal({
            name: `وجبة جديدة (${catLabel})`,
            category: categoryId
        });
        currentItemId = newId;
        saveAndRefresh();
    };

    const renderSidebar = () => {
        listContainer.innerHTML = '';
        updateSidebarAddButton();

        if (currentTab === 'foods') {
            sidebarTitle.textContent = "الأطعمة المتاحة";

            const tools = document.createElement('div');
            tools.className = 'sidebar-foods-tools';
            tools.innerHTML = `
                <div class="sidebar-search-wrap">
                    <i class="fa-solid fa-magnifying-glass sidebar-search-icon"></i>
                    <input type="search" id="foods-search" class="form-control sidebar-search" placeholder="بحث في الأطعمة..." value="${foodsSearchQuery.replace(/"/g, '&quot;')}">
                </div>
            `;
            listContainer.appendChild(tools);

            const searchInput = tools.querySelector('#foods-search');
            searchInput.addEventListener('input', (e) => {
                foodsSearchQuery = e.target.value.trim().toLowerCase();
                renderSidebar();
                const refreshed = document.getElementById('foods-search');
                if (refreshed) {
                    refreshed.focus();
                    const len = refreshed.value.length;
                    refreshed.setSelectionRange(len, len);
                }
            });

            const ul = document.createElement('ul');
            ul.className = 'nav-list';

            const grouped = {};
            Object.keys(plan.foodsLibrary).forEach(key => {
                const food = plan.foodsLibrary[key];
                DataManager.normalizeFood(food);
                const cat = food.category;
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push({ key, food });
            });

            let visibleCount = 0;

            DataManager.FOOD_CATEGORY_ORDER.forEach(catId => {
                const allItems = grouped[catId] || [];
                const items = allItems
                    .filter(({ key, food }) => foodMatchesSearch(food, key))
                    .sort((a, b) => a.food.name.localeCompare(b.food.name, 'ar'));

                if (foodsSearchQuery && items.length === 0) return;

                visibleCount += items.length;
                const cat = DataManager.FOOD_CATEGORIES[catId];
                const countLabel = foodsSearchQuery ? items.length : allItems.length;

                const sectionLi = document.createElement('li');
                sectionLi.className = 'nav-category-header';
                sectionLi.innerHTML = `
                    <div class="nav-category-label">
                        <i class="fa-solid ${cat.icon}"></i>
                        <span>${cat.label}</span>
                        <span class="nav-category-count">(${countLabel})</span>
                    </div>
                    <button type="button" class="btn-icon btn-add-category" title="إضافة طعام في ${cat.label}">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                `;
                sectionLi.querySelector('.btn-add-category').addEventListener('click', (e) => {
                    e.stopPropagation();
                    addFoodInCategory(catId);
                });
                ul.appendChild(sectionLi);

                items.forEach(({ key, food }) => {
                    appendSidebarNavItem(ul, key, food, cat.icon);
                });

                if (!foodsSearchQuery && items.length === 0) {
                    const emptyLi = document.createElement('li');
                    emptyLi.className = 'nav-category-empty';
                    emptyLi.textContent = 'لا توجد أطعمة — اضغط + للإضافة';
                    ul.appendChild(emptyLi);
                }
            });

            if (foodsSearchQuery && visibleCount === 0) {
                const noResults = document.createElement('li');
                noResults.className = 'nav-category-empty';
                noResults.textContent = 'لا توجد نتائج للبحث';
                ul.appendChild(noResults);
            }

            listContainer.appendChild(ul);
            return;
        }

        if (currentTab === 'meals') {
            sidebarTitle.textContent = 'قوالب الوجبات';

            const tools = document.createElement('div');
            tools.className = 'sidebar-foods-tools';
            tools.innerHTML = `
                <div class="sidebar-search-wrap">
                    <i class="fa-solid fa-magnifying-glass sidebar-search-icon"></i>
                    <input type="search" id="meals-search" class="form-control sidebar-search" placeholder="بحث في قوالب الوجبات..." value="${mealsSearchQuery.replace(/"/g, '&quot;')}">
                </div>
            `;
            listContainer.appendChild(tools);

            tools.querySelector('#meals-search').addEventListener('input', (e) => {
                mealsSearchQuery = e.target.value.trim().toLowerCase();
                renderSidebar();
                const refreshed = document.getElementById('meals-search');
                if (refreshed) {
                    refreshed.focus();
                    const len = refreshed.value.length;
                    refreshed.setSelectionRange(len, len);
                }
            });

            const ul = document.createElement('ul');
            ul.className = 'nav-list';

            const grouped = {};
            Object.keys(plan.mealsLibrary).forEach(key => {
                const meal = plan.mealsLibrary[key];
                DataManager.normalizeMeal(meal);
                const cat = meal.category;
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push({ key, meal });
            });

            let visibleCount = 0;

            DataManager.MEAL_CATEGORY_ORDER.forEach(catId => {
                const allItems = grouped[catId] || [];
                const items = allItems
                    .filter(({ key, meal }) => mealMatchesSearch(meal, key))
                    .sort((a, b) => a.meal.name.localeCompare(b.meal.name, 'ar'));

                if (mealsSearchQuery && items.length === 0) return;

                visibleCount += items.length;
                const cat = DataManager.MEAL_CATEGORIES[catId];
                const countLabel = mealsSearchQuery ? items.length : allItems.length;

                const sectionLi = document.createElement('li');
                sectionLi.className = 'nav-category-header nav-meal-category-header';
                sectionLi.innerHTML = `
                    <div class="nav-category-label">
                        <i class="fa-solid ${cat.icon}"></i>
                        <span>${cat.label}</span>
                        <span class="nav-category-count">(${countLabel})</span>
                    </div>
                    <button type="button" class="btn-icon btn-add-category btn-add-meal-category" title="إضافة وجبة في ${cat.label}">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                `;
                sectionLi.querySelector('.btn-add-meal-category').addEventListener('click', (e) => {
                    e.stopPropagation();
                    addMealInCategory(catId);
                });
                ul.appendChild(sectionLi);

                items.forEach(({ key, meal }) => {
                    appendSidebarNavItem(ul, key, meal, cat.icon);
                });

                if (!mealsSearchQuery && items.length === 0) {
                    const emptyLi = document.createElement('li');
                    emptyLi.className = 'nav-category-empty';
                    emptyLi.textContent = 'لا توجد وجبات — اضغط + للإضافة';
                    ul.appendChild(emptyLi);
                }
            });

            if (mealsSearchQuery && visibleCount === 0) {
                const noResults = document.createElement('li');
                noResults.className = 'nav-category-empty';
                noResults.textContent = 'لا توجد نتائج للبحث';
                ul.appendChild(noResults);
            }

            listContainer.appendChild(ul);
            return;
        }

        if (currentTab === 'schedule') {
            sidebarTitle.textContent = 'الجدول الأسبوعي';

            const dayNav = document.createElement('div');
            dayNav.className = 'week-day-nav sidebar-week-nav';
            DataManager.WEEK_DAY_ORDER.forEach(dayId => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `week-day-btn week-day-btn--macros ${dayId === currentScheduleDay ? 'active' : ''}`;
                const count = DataManager.getDaySchedule(plan, dayId).length;
                const dayMacros = DataManager.computeDayMacros(plan, dayId);
                const macrosLine = count > 0
                    ? `<span class="week-day-macros">${DataManager.formatMacrosSummary(dayMacros, { compact: true })}</span>`
                    : '<span class="week-day-macros week-day-macros--empty">—</span>';
                btn.innerHTML = `
                    <span class="week-day-label">${DataManager.WEEK_DAYS[dayId].short}</span>
                    ${count > 0 ? `<span class="week-day-count">${count}</span>` : ''}
                    ${macrosLine}
                `;
                btn.title = count > 0
                    ? `${DataManager.getDayLabel(dayId)}: ${DataManager.formatMacrosSummary(dayMacros)}`
                    : DataManager.getDayLabel(dayId);
                btn.addEventListener('click', () => {
                    currentScheduleDay = dayId;
                    currentItemId = null;
                    renderSidebar();
                    renderScheduleDaySummary();
                });
                dayNav.appendChild(btn);
            });
            listContainer.appendChild(dayNav);

            const ul = document.createElement('ul');
            ul.className = 'nav-list nav-list--sortable';

            const daySlots = DataManager.getDaySchedule(plan, currentScheduleDay);
            if (daySlots.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'nav-category-empty';
                emptyLi.textContent = `لا مواعيد في ${DataManager.getDayLabel(currentScheduleDay)} — اضغط +`;
                ul.appendChild(emptyLi);
            } else {
                daySlots.forEach((p, index) => {
                    const label = `${p.time} - ${plan.mealsLibrary[p.mealTemplateId]?.name || 'غير محدد'}`;
                    appendSidebarNavItem(ul, p.id, { name: label }, 'fa-clock', index);
                });
                wireScheduleSortableList(ul, currentScheduleDay);
            }
            listContainer.appendChild(ul);
            return;
        }

        if (currentTab === 'grocery') {
            DataManager.ensureGroceryState(plan);
            const gs = plan.groceryState;
            const list = DataManager.buildWeeklyGroceryList(plan, { searchQuery: grocerySearchQuery });

            sidebarTitle.textContent = 'إعدادات القائمة';

            const panel = document.createElement('div');
            panel.className = 'grocery-sidebar-panel';

            panel.innerHTML = `
                <p class="grocery-sidebar-hint">تُجمع الكميات من الجدول: الوجبة النشطة + أي تبديل مكونات على الموعد (بدون البدائل غير المستخدمة).</p>
                <div class="grocery-stats grocery-stats--4">
                    <div><span class="grocery-stat-num">${list.totalLines}</span> صنف</div>
                    <div><span class="grocery-stat-num">${list.slotCount}</span> موعد/أسبوع</div>
                    <div><span class="grocery-stat-num">${gs.weekCount}</span> ${gs.weekCount === 1 ? 'أسبوع' : 'أسابيع'}</div>
                    <div><span class="grocery-stat-num">${list.remainingCount}</span> متبقي</div>
                </div>
            `;
            listContainer.appendChild(panel);

            const weeksWrap = document.createElement('div');
            weeksWrap.className = 'grocery-weeks-wrap';
            const weeksTitle = document.createElement('div');
            weeksTitle.className = 'grocery-days-title';
            weeksTitle.textContent = 'عدد الأسابيع للشراء';
            weeksWrap.appendChild(weeksTitle);

            const weeksControl = document.createElement('div');
            weeksControl.className = 'grocery-weeks-control';
            const btnWeeksDown = document.createElement('button');
            btnWeeksDown.type = 'button';
            btnWeeksDown.className = 'grocery-weeks-btn';
            btnWeeksDown.setAttribute('aria-label', 'تقليل الأسابيع');
            btnWeeksDown.innerHTML = '<i class="fa-solid fa-minus"></i>';
            const weeksInput = document.createElement('input');
            weeksInput.type = 'number';
            weeksInput.className = 'grocery-weeks-input form-control';
            weeksInput.min = '1';
            weeksInput.max = '52';
            weeksInput.value = String(gs.weekCount);
            const btnWeeksUp = document.createElement('button');
            btnWeeksUp.type = 'button';
            btnWeeksUp.className = 'grocery-weeks-btn';
            btnWeeksUp.setAttribute('aria-label', 'زيادة الأسابيع');
            btnWeeksUp.innerHTML = '<i class="fa-solid fa-plus"></i>';

            const applyWeekCount = (raw) => {
                let n = parseInt(raw, 10);
                if (!n || n < 1) n = 1;
                n = Math.min(52, n);
                gs.weekCount = n;
                weeksInput.value = String(n);
                DataManager.savePlan(plan);
                renderSidebar();
                renderGroceryView();
            };

            btnWeeksDown.addEventListener('click', () => applyWeekCount(gs.weekCount - 1));
            btnWeeksUp.addEventListener('click', () => applyWeekCount(gs.weekCount + 1));
            weeksInput.addEventListener('change', () => applyWeekCount(weeksInput.value));
            weeksInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyWeekCount(weeksInput.value);
                }
            });

            weeksControl.append(btnWeeksDown, weeksInput, btnWeeksUp);
            weeksWrap.appendChild(weeksControl);

            const weeksHint = document.createElement('p');
            weeksHint.className = 'grocery-weeks-hint';
            weeksHint.textContent = gs.weekCount === 1
                ? 'الكميات لأسبوع واحد حسب الأيام المحددة أدناه.'
                : `الكميات = أسبوع واحد × ${gs.weekCount} (نفس الجدول لكل أسبوع).`;
            weeksWrap.appendChild(weeksHint);
            listContainer.appendChild(weeksWrap);

            const daysWrap = document.createElement('div');
            daysWrap.className = 'grocery-days-wrap';
            const daysTitle = document.createElement('div');
            daysTitle.className = 'grocery-days-title';
            daysTitle.textContent = 'أيام الأسبوع المشمولة';
            daysWrap.appendChild(daysTitle);

            const dayBtns = document.createElement('div');
            dayBtns.className = 'grocery-day-toggles';
            DataManager.WEEK_DAY_ORDER.forEach(dayId => {
                const day = DataManager.WEEK_DAYS[dayId];
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `grocery-day-toggle ${gs.includedDays[dayId] ? 'active' : ''}`;
                btn.textContent = day.short;
                btn.title = day.label;
                btn.addEventListener('click', () => {
                    gs.includedDays[dayId] = !gs.includedDays[dayId];
                    DataManager.savePlan(plan);
                    renderSidebar();
                    renderGroceryView();
                });
                dayBtns.appendChild(btn);
            });
            daysWrap.appendChild(dayBtns);

            const dayActions = document.createElement('div');
            dayActions.className = 'grocery-day-actions';
            const btnAllDays = document.createElement('button');
            btnAllDays.type = 'button';
            btnAllDays.className = 'btn btn-sm';
            btnAllDays.textContent = 'كل الأيام';
            btnAllDays.addEventListener('click', () => {
                DataManager.WEEK_DAY_ORDER.forEach(d => { gs.includedDays[d] = true; });
                DataManager.savePlan(plan);
                renderSidebar();
                renderGroceryView();
            });
            const btnClearDays = document.createElement('button');
            btnClearDays.type = 'button';
            btnClearDays.className = 'btn btn-sm';
            btnClearDays.textContent = 'إلغاء الكل';
            btnClearDays.addEventListener('click', () => {
                DataManager.WEEK_DAY_ORDER.forEach(d => { gs.includedDays[d] = false; });
                DataManager.savePlan(plan);
                renderSidebar();
                renderGroceryView();
            });
            dayActions.append(btnAllDays, btnClearDays);
            daysWrap.appendChild(dayActions);
            listContainer.appendChild(daysWrap);

            const actions = document.createElement('div');
            actions.className = 'grocery-sidebar-actions';
            actions.innerHTML = `
                <button type="button" class="btn btn-sm" id="grocery-check-all"><i class="fa-solid fa-check-double"></i> تحديد الكل</button>
                <button type="button" class="btn btn-sm" id="grocery-uncheck-all"><i class="fa-solid fa-rotate-left"></i> إلغاء التحديد</button>
                <button type="button" class="btn btn-sm btn-primary" id="grocery-print"><i class="fa-solid fa-print"></i> طباعة</button>
            `;
            listContainer.appendChild(actions);

            actions.querySelector('#grocery-check-all').addEventListener('click', () => {
                list.categories.forEach(cat => cat.items.forEach(item => {
                    DataManager.setGroceryChecked(plan, item.key, true);
                }));
                list.customItems.forEach(item => {
                    DataManager.setGroceryChecked(plan, item.key, true);
                });
                DataManager.savePlan(plan);
                renderSidebar();
                renderGroceryView();
            });

            actions.querySelector('#grocery-uncheck-all').addEventListener('click', () => {
                plan.groceryState.checked = {};
                DataManager.savePlan(plan);
                renderSidebar();
                renderGroceryView();
            });

            actions.querySelector('#grocery-print').addEventListener('click', () => {
                document.body.classList.add('grocery-print-mode');
                window.print();
                setTimeout(() => document.body.classList.remove('grocery-print-mode'), 500);
            });

            const customForm = document.createElement('div');
            customForm.className = 'grocery-custom-form';
            const catOptions = DataManager.FOOD_CATEGORY_ORDER.map(catId => {
                const cat = DataManager.FOOD_CATEGORIES[catId];
                return `<option value="${catId}">${cat.label}</option>`;
            }).join('');
            customForm.innerHTML = `
                <div class="grocery-days-title">إضافة يدوية</div>
                <input type="text" id="grocery-custom-name" class="form-control" placeholder="مثال: مناديل، توابل...">
                <select id="grocery-custom-cat" class="form-control">${catOptions}</select>
                <button type="button" class="btn btn-sm btn-primary" id="grocery-add-custom"><i class="fa-solid fa-plus"></i> إضافة</button>
            `;
            listContainer.appendChild(customForm);

            customForm.querySelector('#grocery-add-custom').addEventListener('click', () => {
                const nameInput = customForm.querySelector('#grocery-custom-name');
                const name = nameInput.value.trim();
                if (!name) return;
                const category = customForm.querySelector('#grocery-custom-cat').value;
                plan.groceryState.customItems.push({
                    id: DataManager.generateId('grocery_custom'),
                    name,
                    category,
                    note: ''
                });
                nameInput.value = '';
                saveAndRefresh();
            });

            return;
        }
    };

    const saveGroceryQuiet = () => {
        DataManager.savePlan(plan);
        renderSidebar();
        renderGroceryView();
    };

    const renderGroceryRow = (item, isCustom) => {
        const row = document.createElement('label');
        row.className = `grocery-row ${item.checked ? 'grocery-row--checked' : ''}`;
        const qtyHtml = isCustom
            ? '<span class="grocery-row-qty grocery-row-qty--custom">يدوي</span>'
            : `<span class="grocery-row-qty">${item.formattedQty}</span>`;

        let sourcesHtml = '';
        if (!isCustom && item.sources && item.sources.length) {
            const unique = [];
            const seen = new Set();
            item.sources.forEach(s => {
                const label = `${s.dayLabel} — ${s.mealName}`;
                if (!seen.has(label)) {
                    seen.add(label);
                    unique.push(label);
                }
            });
            if (unique.length) {
                sourcesHtml = `<details class="grocery-row-sources"><summary>من أين؟ (${unique.length})</summary><ul>${unique.map(l => `<li>${l}</li>`).join('')}</ul></details>`;
            }
        }

        row.innerHTML = `
            <input type="checkbox" class="grocery-row-check" ${item.checked ? 'checked' : ''}>
            <span class="grocery-row-body">
                <span class="grocery-row-name">${item.name}</span>
                ${qtyHtml}
                ${sourcesHtml}
            </span>
            ${isCustom ? `<button type="button" class="btn-icon grocery-row-delete" title="حذف"><i class="fa-solid fa-trash"></i></button>` : ''}
        `;

        row.querySelector('.grocery-row-check').addEventListener('change', (e) => {
            DataManager.setGroceryChecked(plan, item.key, e.target.checked);
            saveGroceryQuiet();
        });

        if (isCustom) {
            row.querySelector('.grocery-row-delete').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                plan.groceryState.customItems = plan.groceryState.customItems.filter(c => c.id !== item.id);
                delete plan.groceryState.checked[item.key];
                saveAndRefresh();
            });
        }

        return row;
    };

    const renderGroceryView = () => {
        const list = DataManager.buildWeeklyGroceryList(plan, { searchQuery: grocerySearchQuery });
        const titleWeeks = list.weekCount === 1
            ? 'قائمة مشتريات الأسبوع'
            : `قائمة مشتريات — ${list.weekCount} أسابيع`;
        editorTitle.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> ${titleWeeks}`;
        const pct = list.totalLines
            ? Math.round((list.checkedCount / list.totalLines) * 100)
            : 0;

        const root = document.createElement('div');
        root.className = 'grocery-main';
        root.id = 'grocery-print-area';

        root.innerHTML = `
            <div class="grocery-toolbar no-print">
                <div class="sidebar-search-wrap grocery-search-wrap">
                    <i class="fa-solid fa-magnifying-glass sidebar-search-icon"></i>
                    <input type="search" id="grocery-search" class="form-control sidebar-search" placeholder="بحث في القائمة..." value="${grocerySearchQuery.replace(/"/g, '&quot;')}">
                </div>
                <div class="grocery-progress-wrap">
                    <div class="grocery-progress-label">
                        تم شراء ${list.checkedCount} من ${list.totalLines} (${pct}%)
                        ${list.weekCount > 1 ? `<span class="grocery-weeks-badge">× ${list.weekCount} أسابيع</span>` : ''}
                    </div>
                    <div class="grocery-progress-bar"><div class="grocery-progress-fill" style="width:${pct}%"></div></div>
                </div>
            </div>
        `;

        const searchInput = root.querySelector('#grocery-search');
        searchInput.addEventListener('input', (e) => {
            grocerySearchQuery = e.target.value.trim().toLowerCase();
            renderGroceryView();
            const refreshed = document.getElementById('grocery-search');
            if (refreshed) {
                refreshed.focus();
                const len = refreshed.value.length;
                refreshed.setSelectionRange(len, len);
            }
        });

        if (list.slotCount === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state grocery-empty';
            empty.innerHTML = `
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>لا توجد وجبات في الأيام المحددة. أضف مواعيد من تبويب <strong>الجدول الأسبوعي</strong>.</p>
            `;
            root.appendChild(empty);
        } else if (list.totalLines === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state grocery-empty';
            empty.innerHTML = `
                <i class="fa-solid fa-basket-shopping"></i>
                <p>لا توجد مكونات غذائية في الوجبات المجدولة، أو لا توجد نتائج للبحث.</p>
            `;
            root.appendChild(empty);
        } else {
            list.categories.forEach(cat => {
                const section = document.createElement('section');
                section.className = 'grocery-category-section';
                section.innerHTML = `
                    <h3 class="grocery-category-title">
                        <i class="fa-solid ${cat.icon}"></i>
                        ${cat.label}
                        <span class="nav-category-count">(${cat.items.length})</span>
                    </h3>
                `;
                const listEl = document.createElement('div');
                listEl.className = 'grocery-category-list';
                cat.items.forEach(item => listEl.appendChild(renderGroceryRow(item, false)));
                section.appendChild(listEl);
                root.appendChild(section);
            });

            if (list.customItems.length) {
                const section = document.createElement('section');
                section.className = 'grocery-category-section grocery-custom-section';
                section.innerHTML = `
                    <h3 class="grocery-category-title">
                        <i class="fa-solid fa-pen"></i>
                        عناصر إضافية
                        <span class="nav-category-count">(${list.customItems.length})</span>
                    </h3>
                `;
                const listEl = document.createElement('div');
                listEl.className = 'grocery-category-list';
                list.customItems.forEach(item => listEl.appendChild(renderGroceryRow(item, true)));
                section.appendChild(listEl);
                root.appendChild(section);
            }
        }

        editorContent.innerHTML = '';
        editorContent.appendChild(root);
    };


    // ----- Editor Renderer -----

    const renderEditor = () => {
        if (!currentItemId) return clearEditor();

        if (currentTab === 'foods') renderFoodEditor(currentItemId);
        else if (currentTab === 'meals') renderMealTemplateEditor(currentItemId);
        else if (currentTab === 'schedule') renderScheduleEditor(currentItemId);
    };

    // 1. Food Editor (V4 Schema - Macros Included)
    const renderFoodEditor = (fId) => {
        const food = plan.foodsLibrary[fId];
        if (!food) return clearEditor();

        DataManager.normalizeFood(food);

        const categoryOptions = DataManager.FOOD_CATEGORY_ORDER.map(catId => {
            const cat = DataManager.FOOD_CATEGORIES[catId];
            const selected = food.category === catId ? 'selected' : '';
            return `<option value="${catId}" ${selected}>${cat.label}</option>`;
        }).join('');

        const unitOptions = DataManager.QUANTITY_UNITS.map(u => {
            const selected = food.minQuantity.unit === u.id ? 'selected' : '';
            return `<option value="${u.id}" ${selected}>${u.label}</option>`;
        }).join('');

        editorTitle.innerHTML = `<i class="fa-solid ${DataManager.getCategoryIcon(food.category)}" style="color:var(--accent-red)"></i> إعداد طعام بحد ذاته`;

        editorContent.innerHTML = `
            <div class="form-group highlighted-group" style="margin-bottom:1.5rem;">
                <label>اسم الطعام</label>
                <textarea id="edit-food-name" class="form-control" rows="2">${food.name}</textarea>
                <small class="text-muted">هذا الاسم سيتم تحديثه في كل الوجبات التي تستخدم هذا الطعام.</small>
            </div>

            <div class="form-group" style="background:rgba(0,0,0,0.2); border:1px solid var(--card-border); padding:1rem; border-radius:8px; margin-bottom:1.5rem;">
                <label style="color:var(--accent-yellow); margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem;"><i class="fa-solid fa-tags"></i> التصنيف والكمية الدنيا</label>
                <div style="display:grid; grid-template-columns:1fr; gap:1rem;">
                    <div>
                        <label style="font-size:0.85rem;">التصنيف</label>
                        <select id="edit-food-category" class="form-control">${categoryOptions}</select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div>
                            <label style="font-size:0.85rem;">الكمية الدنيا (حصة مرجعية)</label>
                            <input type="number" id="edit-food-qty-amount" class="form-control" min="0.01" step="any" value="${food.minQuantity.amount}">
                        </div>
                        <div>
                            <label style="font-size:0.85rem;">وحدة القياس</label>
                            <select id="edit-food-qty-unit" class="form-control">${unitOptions}</select>
                        </div>
                    </div>
                </div>
                <small class="text-muted" style="display:block; margin-top:0.75rem;">الماكرو أدناه لهذه الكمية الدنيا. في كل وجبة يمكن زيادة الكمية (مثال: حد أدنى 100غ، وفي الوجبة 200غ = ضعف الماكرو).</small>
            </div>
            
            <div class="form-group" style="background:rgba(0,0,0,0.2); border:1px solid var(--card-border); padding:1rem; border-radius:8px;">
                <label style="color:var(--accent-yellow); margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem;"><i class="fa-solid fa-chart-pie"></i> القيم الغذائية (اختياري)</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div>
                        <label style="font-size:0.85rem;">البروتين (g)</label>
                        <input type="number" id="edit-macro-p" class="form-control" min="0" step="0.1" value="${food.macros.p}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem;">الكربوهيدرات (g)</label>
                        <input type="number" id="edit-macro-c" class="form-control" min="0" step="0.1" value="${food.macros.c}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem;">الدهون (g)</label>
                        <input type="number" id="edit-macro-f" class="form-control" min="0" step="0.1" value="${food.macros.f}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem; color:var(--accent-red);">السعرات (Kcal)</label>
                        <input type="number" id="edit-macro-cal" class="form-control" min="0" step="0.1" value="${food.macros.cal}">
                    </div>
                </div>
            </div>
            
            <div class="empty-state-small text-muted" style="margin-top:2rem;">
                <i class="fa-solid fa-info-circle"></i><br>
                خصائص البدائل (Alternatives) تم نقلها إلى داخل إعدادات <b>قوالب الوجبات</b> لتصبح أكثر مرونة.
            </div>
        `;

        document.getElementById('edit-food-name').addEventListener('change', (e) => {
            food.name = e.target.value;
            saveAndRefresh();
        });

        document.getElementById('edit-food-category').addEventListener('change', (e) => {
            food.category = e.target.value;
            saveAndRefresh();
        });

        document.getElementById('edit-food-qty-amount').addEventListener('change', (e) => {
            food.minQuantity.amount = parseFloat(e.target.value) || 1;
            food.standardQuantity = { ...food.minQuantity };
            saveAndRefresh();
        });

        document.getElementById('edit-food-qty-unit').addEventListener('change', (e) => {
            food.minQuantity.unit = e.target.value;
            food.standardQuantity = { ...food.minQuantity };
            saveAndRefresh();
        });

        // Bind Macro fields
        ['p', 'c', 'f', 'cal'].forEach(macro => {
            document.getElementById(`edit-macro-${macro}`).addEventListener('change', (e) => {
                food.macros[macro] = parseFloat(e.target.value) || 0;
                saveAndRefresh();
            });
        });
    };

    // 2. Meal Template Editor (V3 Schema - Contextual Alternatives Live Here)
    const renderMealTemplateEditor = (mId) => {
        const mealTemplate = plan.mealsLibrary[mId];
        if (!mealTemplate) return clearEditor();

        DataManager.normalizeMeal(mealTemplate);
        const catIcon = DataManager.getMealCategoryIcon(mealTemplate.category);
        const mealCategoryOptions = DataManager.MEAL_CATEGORY_ORDER.map(catId => {
            const cat = DataManager.MEAL_CATEGORIES[catId];
            const selected = mealTemplate.category === catId ? 'selected' : '';
            return `<option value="${catId}" ${selected}>${cat.label}</option>`;
        }).join('');

        editorTitle.innerHTML = `<i class="fa-solid ${catIcon}" style="color:var(--accent-red)"></i> هيكل الوجبة: ${mealTemplate.name}`;

        const mealTotals = DataManager.computeMealMacros(mId, plan.mealsLibrary, plan.foodsLibrary);

        editorContent.innerHTML = `
            <div class="form-group" style="margin-bottom:2rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div>
                        <label>اسم القالب</label>
                        <input type="text" id="edit-mt-name" class="form-control" value="${mealTemplate.name}">
                    </div>
                    <div>
                        <label>تصنيف الوجبة</label>
                        <select id="edit-mt-category" class="form-control">${mealCategoryOptions}</select>
                    </div>
                </div>
            </div>

            <div class="form-group meal-template-alts-section" style="margin-bottom:1.5rem; background:rgba(42,157,143,0.08); border:1px solid rgba(42,157,143,0.35); padding:1rem; border-radius:8px; position:relative; z-index:50;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                    <label style="margin:0; color:var(--accent-green); font-weight:700;">
                        <i class="fa-solid fa-random"></i> بدائل هذه الوجبة (قوالب بديلة كاملة)
                        <b>(${(mealTemplate.allowedMealAlternatives || []).length})</b>
                    </label>
                    <button type="button" id="btn-add-template-meal-alt" class="btn btn-sm btn-secondary" style="border-color:var(--accent-green); color:var(--accent-green);">
                        <i class="fa-solid fa-plus"></i> إضافة بديل وجبة
                    </button>
                </div>
                <small class="text-muted" style="display:block; margin-bottom:0.75rem;">عند اتباع الخطة يمكن استبدال هذه الوجبة بأحد القوالب أدناه (مثال: عشاء بديل أو وجبة خفيفة أخرى).</small>
                <div id="template-meal-alts-holder" class="manager-list"></div>
            </div>

            <div class="meal-total-macros meal-editor-totals">
                <span><strong>القيمة الغذائية للوجبة كاملة:</strong></span>
                ${macroBadgesHtml(mealTotals)}
            </div>
            
            <div class="components-manager">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; flex-wrap:wrap; gap:0.5rem;">
                    <h3 style="margin:0;"><i class="fa-solid fa-cubes"></i> مكونات الوجبة (أطعمة أو وجبات فرعية)</h3>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button id="btn-add-comp" class="btn btn-sm btn-secondary"><i class="fa-solid fa-utensils"></i> عنصر طعام</button>
                        <button id="btn-add-nested-meal" class="btn btn-sm btn-secondary" style="border-color:var(--accent-green); color:var(--accent-green);"><i class="fa-solid fa-bowl-food"></i> وجبة فرعية</button>
                    </div>
                </div>
                <div id="mt-components-list" style="display:flex; flex-direction:column; gap:1.5rem;"></div>
            </div>
        `;

        document.getElementById('edit-mt-name').addEventListener('change', (e) => {
            mealTemplate.name = e.target.value;
            saveAndRefresh();
        });

        document.getElementById('edit-mt-category').addEventListener('change', (e) => {
            mealTemplate.category = e.target.value;
            saveAndRefresh();
        });

        if (!mealTemplate.allowedMealAlternatives) mealTemplate.allowedMealAlternatives = [];

        document.getElementById('btn-add-template-meal-alt').addEventListener('click', () => {
            mealTemplate.allowedMealAlternatives.push(null);
            saveAndRefresh();
        });

        renderMealAlternativesList(
            document.getElementById('template-meal-alts-holder'),
            mealTemplate.allowedMealAlternatives,
            mId,
            [mId],
            saveAndRefresh
        );

        document.getElementById('btn-add-comp').addEventListener('click', () => {
            mealTemplate.components.push(DataManager.createDefaultComponent(null, plan.foodsLibrary));
            saveAndRefresh();
        });

        document.getElementById('btn-add-nested-meal').addEventListener('click', () => {
            mealTemplate.components.push(DataManager.createDefaultNestedMealComponent(null));
            saveAndRefresh();
        });

        const compsList = document.getElementById('mt-components-list');
        mealTemplate.components.forEach((comp, compIdx) => {
            DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);
            if (DataManager.isMealSlot(comp)) {
                renderNestedMealComponentSlot(mealTemplate, mId, comp, compIdx, compsList);
            } else {
                renderFoodComponentSlot(mealTemplate, mId, comp, compIdx, compsList);
            }
        });
    };

    // 3. Schedule Editor
    const renderScheduleEditor = (sId) => {
        const found = DataManager.findScheduleEntry(plan, sId);
        if (!found) return clearEditor();
        const sched = found.entry;
        currentScheduleDay = found.dayId;

        DataManager.normalizeScheduleEntry(sched);
        if (sched.mealTemplateId) {
            DataManager.syncScheduleAltsFromMealTemplate(sched, plan.mealsLibrary);
        }

        const linkedMeal = sched.mealTemplateId && plan.mealsLibrary[sched.mealTemplateId];
        const templateAltCount = linkedMeal
            ? (linkedMeal.allowedMealAlternatives || []).filter(Boolean).length
            : 0;

        editorTitle.innerHTML = `<i class="fa-solid fa-calendar-week" style="color:var(--accent-red)"></i> ${DataManager.getDayLabel(currentScheduleDay)} — جدولة الوجبة`;

        editorContent.innerHTML = `
            <div class="form-group" style="margin-bottom:1rem;">
                <label>اليوم</label>
                <select id="edit-sched-day" class="form-control">
                    ${DataManager.WEEK_DAY_ORDER.map(dayId => {
                        const selected = dayId === currentScheduleDay ? 'selected' : '';
                        return `<option value="${dayId}" ${selected}>${DataManager.getDayLabel(dayId)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group highlighted-group">
                <label>الوقت</label>
                <input type="text" id="edit-sched-time" class="form-control" value="${sched.time}">
            </div>
            
            <div id="schedule-meal-swap-holder" class="schedule-meal-swap-holder"></div>

            <div class="form-group" style="position:relative; z-index:100;">
                <label>قالب الوجبة المرتبط</label>
                <!-- Custom dropdown for meals -->
                <div class="searchable-dropdown" id="meal-dropdown">
                    <div class="dropdown-header">
                        <span id="meal-dd-label">${plan.mealsLibrary[sched.mealTemplateId]?.name || "اختر قالب وجبة"}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="dropdown-body" style="display:none;" id="meal-dd-body">
                        <ul class="dropdown-list" id="meal-dd-list"></ul>
                    </div>
                </div>
            </div>

            <div class="form-group" style="margin-top:1.5rem; background:rgba(42,157,143,0.06); border:1px solid rgba(42,157,143,0.25); padding:1rem; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <label style="margin:0; color:var(--accent-green);"><i class="fa-solid fa-random"></i> بدائل قالب الوجبة في هذا الموعد <b id="sched-alts-count">(${sched.allowedMealAlternatives ? sched.allowedMealAlternatives.length : 0})</b></label>
                    <button type="button" id="btn-add-sched-meal-alt" class="btn btn-sm btn-secondary" style="border-color:var(--accent-green); color:var(--accent-green);"><i class="fa-solid fa-plus"></i> إضافة بديل</button>
                </div>
                <small class="text-muted" style="display:block; margin-bottom:0.5rem;">تُستورد البدائل تلقائياً من قالب الوجبة المختار (${templateAltCount} في القالب). يمكنك إضافة بدائل إضافية لهذا الموعد فقط.</small>
                <button type="button" id="btn-resync-sched-alts" class="btn btn-sm btn-secondary" style="margin-bottom:0.75rem; border-color:var(--accent-green); color:var(--accent-green);">
                    <i class="fa-solid fa-rotate"></i> تحديث البدائل من القالب
                </button>
                <div id="sched-meal-alts-holder" class="manager-list"></div>
            </div>

            <div class="form-group schedule-component-swaps-panel" id="sched-component-swaps-panel">
                <label style="color:var(--accent-yellow);"><i class="fa-solid fa-basket-shopping"></i> مكونات الوجبة لهذا الموعد</label>
                <small class="text-muted" style="display:block;margin-bottom:0.75rem;">تبديل عنصر أو وجبة فرعية هنا يحدّث قائمة المشتريات لهذا الموعد فقط (لا يغيّر قالب الوجبة للأيام الأخرى).</small>
                <div id="sched-component-swaps-holder"></div>
            </div>
        `;

        const renderScheduleComponentSwaps = () => {
            const holder = document.getElementById('sched-component-swaps-holder');
            const meal = sched.mealTemplateId && plan.mealsLibrary[sched.mealTemplateId];
            if (!holder || !meal) {
                if (holder) holder.innerHTML = '<p class="text-muted">اختر قالب وجبة أولاً.</p>';
                return;
            }
            DataManager.normalizeMeal(meal);
            DataManager.normalizeScheduleEntry(sched);

            if (!meal.components.length) {
                holder.innerHTML = '<p class="text-muted">لا مكونات في هذا القالب.</p>';
                return;
            }

            let html = '';
            meal.components.forEach((comp, compIdx) => {
                DataManager.normalizeComponent(comp, plan.foodsLibrary, plan.mealsLibrary);
                if (DataManager.isMealSlot(comp)) {
                    const nestedId = DataManager.getEffectiveNestedMealForSchedule(comp, compIdx, sched);
                    const nested = nestedId && plan.mealsLibrary[nestedId];
                    const nestedName = nested ? nested.name : '—';
                    const hasOverride = !!sched.nestedMealOverrides[String(compIdx)];
                    const mealAlts = (comp.allowedMealAlternatives || []).filter(Boolean)
                        .filter(id => id !== nestedId);
                    let altBtns = mealAlts.map(altId => {
                        const m = plan.mealsLibrary[altId];
                        if (!m) return '';
                        return `<button type="button" class="meal-swap-btn sched-comp-swap-nested" data-comp-idx="${compIdx}" data-meal-id="${altId}">${m.name}</button>`;
                    }).join('');
                    html += `
                        <div class="sched-comp-swap-row">
                            <div class="sched-comp-swap-head">
                                <strong><i class="fa-solid fa-bowl-food"></i> وجبة فرعية #${compIdx + 1}</strong>
                                ${hasOverride ? '<span class="override-badge">مخصّص</span>' : ''}
                            </div>
                            <p class="text-muted" style="margin:0.35rem 0;">الحالية: ${nestedName}</p>
                            ${mealAlts.length ? `<div class="meal-swap-btns">${altBtns}</div>` : ''}
                            <div class="sched-comp-swap-actions">
                                <a href="manage.html?tab=meals&meal=${sched.mealTemplateId}&compIdx=${compIdx}" class="btn btn-sm btn-secondary sched-comp-edit"><i class="fa-solid fa-pen"></i> تعديل</a>
                                ${hasOverride ? `<button type="button" class="btn btn-sm btn-secondary sched-comp-reset" data-comp-idx="${compIdx}">إعادة للقالب</button>` : ''}
                            </div>
                        </div>`;
                } else {
                    const eff = DataManager.getEffectiveFoodForSchedule(comp, compIdx, sched, plan.foodsLibrary);
                    const food = eff.activeFoodId && plan.foodsLibrary[eff.activeFoodId];
                    const foodName = food ? food.name : '—';
                    const qty = eff.mealQuantity ? DataManager.formatQuantity(eff.mealQuantity) : '';
                    const hasOverride = !!sched.foodOverrides[String(compIdx)];
                    const validAlts = (comp.allowedAlternatives || [])
                        .map((alt, altIdx) => ({ alt, altIdx }))
                        .filter(({ alt }) => {
                            const fid = DataManager.getFoodAlternativeId(alt);
                            return fid && plan.foodsLibrary[fid];
                        });
                    const altBtns = validAlts.map(({ alt, altIdx }) => {
                        const label = DataManager.formatFoodAlternativeLabel(alt, plan.foodsLibrary);
                        return `<button type="button" class="food-swap-btn sched-comp-swap-food" data-comp-idx="${compIdx}" data-alt-idx="${altIdx}">${label}</button>`;
                    }).join('');
                    html += `
                        <div class="sched-comp-swap-row">
                            <div class="sched-comp-swap-head">
                                <strong><i class="fa-solid fa-utensils"></i> عنصر #${compIdx + 1}</strong>
                                ${hasOverride ? '<span class="override-badge">مخصّص</span>' : ''}
                            </div>
                            <p class="text-muted" style="margin:0.35rem 0;">الحالي: ${foodName}${qty ? ` · ${qty}` : ''}</p>
                            ${validAlts.length ? `<div class="meal-swap-btns">${altBtns}</div>` : ''}
                            <div class="sched-comp-swap-actions">
                                <a href="manage.html?tab=meals&meal=${sched.mealTemplateId}&compIdx=${compIdx}" class="btn btn-sm btn-secondary sched-comp-edit"><i class="fa-solid fa-pen"></i> تعديل</a>
                                ${hasOverride ? `<button type="button" class="btn btn-sm btn-secondary sched-comp-reset" data-comp-idx="${compIdx}">إعادة للقالب</button>` : ''}
                            </div>
                        </div>`;
                }
            });
            holder.innerHTML = html;

            holder.querySelectorAll('.sched-comp-swap-food').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compIdx = parseInt(btn.dataset.compIdx, 10);
                    const altIdx = parseInt(btn.dataset.altIdx, 10);
                    if (DataManager.swapScheduleComponentFood(sched, meal, compIdx, altIdx, plan)) {
                        saveAndRefresh();
                    }
                });
            });
            holder.querySelectorAll('.sched-comp-swap-nested').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compIdx = parseInt(btn.dataset.compIdx, 10);
                    const mealId = btn.dataset.mealId;
                    if (DataManager.swapScheduleNestedMeal(sched, compIdx, mealId)) {
                        saveAndRefresh();
                    }
                });
            });
            holder.querySelectorAll('.sched-comp-reset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compIdx = parseInt(btn.dataset.compIdx, 10);
                    DataManager.resetScheduleComponentOverride(sched, compIdx);
                    saveAndRefresh();
                });
            });
        };

        document.getElementById('btn-resync-sched-alts').addEventListener('click', () => {
            if (!sched.mealTemplateId) {
                alert('اختر قالب وجبة أولاً');
                return;
            }
            DataManager.syncScheduleAltsFromMealTemplate(sched, plan.mealsLibrary);
            saveAndRefresh();
        });

        document.getElementById('btn-add-sched-meal-alt').addEventListener('click', () => {
            sched.allowedMealAlternatives.push(null);
            saveAndRefresh();
        });

        const schedAltIds = DataManager.getScheduleMealAlternatives(plan, sched);
        const swapHolder = document.getElementById('schedule-meal-swap-holder');
        if (swapHolder) {
            if (sched.mealTemplateId && schedAltIds.length > 0) {
                swapHolder.innerHTML = mealSwapButtonsHtml(sched.mealTemplateId, schedAltIds, plan.mealsLibrary);
                swapHolder.querySelectorAll('.meal-swap-btn[data-meal-id]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const newId = btn.dataset.mealId;
                        if (DataManager.swapScheduleMeal(sched, newId, plan.mealsLibrary)) {
                            saveAndRefresh();
                        }
                    });
                });
            } else {
                swapHolder.innerHTML = '';
            }
        }

        renderMealAlternativesList(
            document.getElementById('sched-meal-alts-holder'),
            sched.allowedMealAlternatives,
            sched.mealTemplateId,
            [sched.mealTemplateId],
            saveAndRefresh,
            {
                currentMainId: sched.mealTemplateId,
                onUseAsMain: (altId) => {
                    DataManager.swapScheduleMeal(sched, altId, plan.mealsLibrary);
                    saveAndRefresh();
                }
            }
        );

        renderScheduleComponentSwaps();

        document.getElementById('edit-sched-day').addEventListener('change', (e) => {
            const newDay = e.target.value;
            const oldDay = currentScheduleDay;
            if (newDay !== oldDay) {
                DataManager.ensureWeeklyPlan(plan);
                plan.weeklyPlan[oldDay] = plan.weeklyPlan[oldDay].filter(item => item.id !== sched.id);
                plan.weeklyPlan[newDay].push(sched);
                currentScheduleDay = newDay;
                saveAndRefresh();
            }
        });

        document.getElementById('edit-sched-time').addEventListener('change', (e) => {
            sched.time = e.target.value;
            saveAndRefresh();
        });

        // Simple custom dropdown logic for meal templates
        const header = document.getElementById('meal-dropdown').querySelector('.dropdown-header');
        const body = document.getElementById('meal-dd-body');
        const list = document.getElementById('meal-dd-list');

        let lastCat = null;
        Object.keys(plan.mealsLibrary)
            .sort((a, b) => {
                const ma = plan.mealsLibrary[a];
                const mb = plan.mealsLibrary[b];
                DataManager.normalizeMeal(ma);
                DataManager.normalizeMeal(mb);
                const catCmp = DataManager.MEAL_CATEGORY_ORDER.indexOf(ma.category)
                    - DataManager.MEAL_CATEGORY_ORDER.indexOf(mb.category);
                if (catCmp !== 0) return catCmp;
                return ma.name.localeCompare(mb.name, 'ar');
            })
            .forEach(mId => {
                const meal = plan.mealsLibrary[mId];
                DataManager.normalizeMeal(meal);
                if (meal.category !== lastCat) {
                    lastCat = meal.category;
                    const catLi = document.createElement('li');
                    catLi.className = 'dropdown-category-label';
                    catLi.innerHTML = `<i class="fa-solid ${DataManager.getMealCategoryIcon(meal.category)}"></i> ${DataManager.getMealCategoryLabel(meal.category)}`;
                    list.appendChild(catLi);
                }
                const li = document.createElement('li');
                li.textContent = meal.name;
                if (mId === sched.mealTemplateId) li.classList.add('selected');
                li.addEventListener('click', () => {
                    if (sched.mealTemplateId !== mId) {
                        sched.mealTemplateId = mId;
                        sched.foodOverrides = {};
                        sched.nestedMealOverrides = {};
                    }
                    DataManager.syncScheduleAltsFromMealTemplate(sched, plan.mealsLibrary);
                    body.style.display = 'none';
                    saveAndRefresh();
                });
                list.appendChild(li);
            });

        header.addEventListener('click', (e) => {
            e.stopPropagation();
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!document.getElementById('meal-dropdown').searchable && !document.getElementById('meal-dropdown').contains(e.target)) {
                body.style.display = 'none';
            }
        });
    };

    // ----- Top Level Add Item Actions -----
    btnAddItem.addEventListener('click', () => {
        if (currentTab === 'schedule') {
            const newId = DataManager.generateId('schedule');
            DataManager.ensureWeeklyPlan(plan);
            plan.weeklyPlan[currentScheduleDay].push({
                id: newId,
                time: 'الساعة ( --:-- )',
                mealTemplateId: null,
                allowedMealAlternatives: []
            });
            currentItemId = newId;
            saveAndRefresh();
        }
    });

    // Share link functionality
    document.getElementById('btn-share-link').addEventListener('click', () => {
        const base64Data = DataManager.exportToUrl();
        if (base64Data) {
            const baseUrl = window.location.href.split('manage.html')[0];
            const shareUrl = `${baseUrl}index.html?plan=${base64Data}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert("تم نسخ رابط المشاركة بنجاح! الرابط يحتوي على جميع القواعد والأطعمة المخصصة.");
            }).catch(err => {
                prompt("انسخ الرابط التالي للمشاركة:", shareUrl);
            });
        }
    });

    // Reset Rules (Hidden logic or clear all)
    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if (confirm('تحذير: هذا سيحذف جميع بيانات المكتبات والأطعمة ويعود لنموذج Mind2Muscle الافتراضي. هل أنت متأكد؟')) {
            DataManager.resetToDefault();
            window.location.href = 'manage.html';
        }
    });

    // Init
    document.body.classList.toggle('manage-tab-grocery', currentTab === 'grocery');
    renderSidebar();
    if (currentTab === 'grocery') {
        renderGroceryView();
    } else if (currentItemId) {
        renderEditor();
    } else if (currentTab === 'schedule') {
        renderScheduleDaySummary();
    }

});
