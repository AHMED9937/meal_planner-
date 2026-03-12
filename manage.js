document.addEventListener('DOMContentLoaded', () => {

    const plan = DataManager.loadPlan();

    // UI Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sidebarTitle = document.getElementById('sidebar-title');
    const listContainer = document.getElementById('list-container');
    const editorTitle = document.getElementById('editor-title');
    const editorContent = document.getElementById('editor-content');
    const toast = document.getElementById('save-toast');

    // Current State
    let currentTab = 'foods'; // 'foods', 'meals', 'schedule'
    let currentItemId = null; // ID of the currently selected item in the sidebar

    // ----- UI Helpers -----
    const showToast = () => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    };

    const saveAndRefresh = () => {
        DataManager.savePlan(plan);
        showToast();
        renderSidebar();
        if (currentItemId) {
            renderEditor();
        } else {
            clearEditor();
        }
    };

    const clearEditor = () => {
        editorTitle.innerHTML = 'اختر عنصراً للتعديل';
        editorContent.innerHTML = '<div class="empty-state"><i class="fa-solid fa-hand-pointer"></i><p>اختر من القائمة الجانبية.</p></div>';
    };

    // ----- Tab Management -----
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            currentItemId = null;
            clearEditor();
            renderSidebar();
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const pTab = urlParams.get('tab');
    if (pTab && ['foods', 'meals', 'schedule'].includes(pTab)) {
        currentTab = pTab;
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${pTab}"]`).classList.add('active');
    }
    const pMeal = urlParams.get('meal');
    if (pMeal && currentTab === 'meals') {
        currentItemId = pMeal;
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
                <span>${currentName}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="dropdown-body" style="display:none;">
                <input type="text" class="form-control dropdown-search" placeholder="ابحث عن طعام...">
                <ul class="dropdown-list"></ul>
                <div class="dropdown-action">
                    <button class="btn btn-sm btn-secondary btn-new-food" style="width:100%;"><i class="fa-solid fa-plus"></i> إنشاء طعام جديد</button>
                </div>
            </div>
        `;

        const header = wrapper.querySelector('.dropdown-header');
        const body = wrapper.querySelector('.dropdown-body');
        const searchInput = wrapper.querySelector('.dropdown-search');
        const list = wrapper.querySelector('.dropdown-list');
        const btnNewFood = wrapper.querySelector('.btn-new-food');

        const populateList = (filterTerm = '') => {
            list.innerHTML = '';
            Object.keys(plan.foodsLibrary).forEach(fId => {
                const food = plan.foodsLibrary[fId];
                if (food.name.toLowerCase().includes(filterTerm.toLowerCase())) {
                    const li = document.createElement('li');
                    li.textContent = food.name;
                    if (fId === currentFoodId) li.classList.add('selected');
                    li.addEventListener('click', () => {
                        body.style.display = 'none';
                        onSelect(fId);
                    });
                    list.appendChild(li);
                }
            });
        };

        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = body.style.display === 'block';
            document.querySelectorAll('.dropdown-body').forEach(b => b.style.display = 'none');

            if (!isVisible) {
                body.style.display = 'block';
                searchInput.value = '';
                populateList();
                searchInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                body.style.display = 'none';
            }
        });

        searchInput.addEventListener('input', (e) => populateList(e.target.value));

        btnNewFood.addEventListener('click', () => {
            const newId = DataManager.generateId('f');
            plan.foodsLibrary[newId] = {
                name: "طعام جديد (قم بتعديل الاسم)",
                macros: { p: 0, c: 0, f: 0, cal: 0 }
            };
            saveAndRefresh();
            onSelect(newId);
            body.style.display = 'none';
            alert("تم إنشاء الطعام الجديد في المكتبة. يمكنك تعديل اسمه بالذهاب لتبويب 'مكتبة الأطعمة'.");
        });

        return wrapper;
    };


    // ----- Sidebar Renderer -----

    const renderSidebar = () => {
        listContainer.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'nav-list';

        let itemsMap = {};

        if (currentTab === 'foods') {
            sidebarTitle.textContent = "الأطعمة المتاحة";
            itemsMap = plan.foodsLibrary;
        } else if (currentTab === 'meals') {
            sidebarTitle.textContent = "قوالب الوجبات";
            itemsMap = plan.mealsLibrary;
        } else if (currentTab === 'schedule') {
            sidebarTitle.textContent = "جدول اليوم";
            plan.activePlan.forEach(p => itemsMap[p.id] = { name: `${p.time} - ${plan.mealsLibrary[p.mealTemplateId]?.name || 'غير محدد'}` });
        }

        Object.keys(itemsMap).forEach(key => {
            const item = itemsMap[key];
            const li = document.createElement('li');
            li.className = 'nav-item';

            const header = document.createElement('div');
            header.className = `nav-header ${currentItemId === key ? 'active' : ''}`;

            let icon = 'fa-apple-whole';
            if (currentTab === 'meals') icon = 'fa-bowl-food';
            if (currentTab === 'schedule') icon = 'fa-clock';

            const displayName = item.name || item.title || 'عنصر بدون اسم';

            header.innerHTML = `
                <span class="truncate" style="flex-grow:1;"><i class="fa-solid ${icon}" style="color:var(--accent-red); margin-left:8px;"></i> ${displayName}</span>
                <button class="btn-icon text-muted btn-delete" title="حذف">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            header.querySelector('span').addEventListener('click', () => {
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
                        plan.activePlan = plan.activePlan.filter(p => p.id !== key);
                    }
                    if (currentItemId === key) currentItemId = null;
                    saveAndRefresh();
                }
            });

            li.appendChild(header);
            ul.appendChild(li);
        });

        listContainer.appendChild(ul);
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

        // Ensure legacy items get macros object
        if (!food.macros) food.macros = { p: 0, c: 0, f: 0, cal: 0 };

        editorTitle.innerHTML = `<i class="fa-solid fa-apple-whole" style="color:var(--accent-red)"></i> إعداد طعام بحد ذاته`;

        editorContent.innerHTML = `
            <div class="form-group highlighted-group" style="margin-bottom:1.5rem;">
                <label>اسم الطعام</label>
                <textarea id="edit-food-name" class="form-control" rows="2">${food.name}</textarea>
                <small class="text-muted">هذا الاسم سيتم تحديثه في كل الوجبات التي تستخدم هذا الطعام.</small>
            </div>
            
            <div class="form-group" style="background:rgba(0,0,0,0.2); border:1px solid var(--card-border); padding:1rem; border-radius:8px;">
                <label style="color:var(--accent-yellow); margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem;"><i class="fa-solid fa-chart-pie"></i> القيم الغذائية (اختياري)</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div>
                        <label style="font-size:0.85rem;">البروتين (g)</label>
                        <input type="number" id="edit-macro-p" class="form-control" value="${food.macros.p}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem;">الكربوهيدرات (g)</label>
                        <input type="number" id="edit-macro-c" class="form-control" value="${food.macros.c}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem;">الدهون (g)</label>
                        <input type="number" id="edit-macro-f" class="form-control" value="${food.macros.f}">
                    </div>
                    <div>
                        <label style="font-size:0.85rem; color:var(--accent-red);">السعرات (Kcal)</label>
                        <input type="number" id="edit-macro-cal" class="form-control" value="${food.macros.cal}">
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

        editorTitle.innerHTML = `<i class="fa-solid fa-bowl-food" style="color:var(--accent-red)"></i> هيكل الوجبة: ${mealTemplate.name}`;

        editorContent.innerHTML = `
            <div class="form-group" style="margin-bottom:2rem;">
                <label>اسم القالب (مثال: وجبة الغداء العالية بالبروتين)</label>
                <input type="text" id="edit-mt-name" class="form-control" value="${mealTemplate.name}">
            </div>
            
            <div class="components-manager">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h3 style="margin:0;"><i class="fa-solid fa-cubes"></i> مكونات وتفاصيل هذه الوجبة</h3>
                    <button id="btn-add-comp" class="btn btn-sm btn-secondary"><i class="fa-solid fa-plus"></i> إضافة خانة طعام</button>
                </div>
                <!-- Container for slots -->
                <div id="mt-components-list" style="display:flex; flex-direction:column; gap:1.5rem;"></div>
            </div>
        `;

        document.getElementById('edit-mt-name').addEventListener('change', (e) => {
            mealTemplate.name = e.target.value;
            saveAndRefresh();
        });

        document.getElementById('btn-add-comp').addEventListener('click', () => {
            mealTemplate.components.push({ activeFoodId: null, allowedAlternatives: [] });
            saveAndRefresh();
        });

        const compsList = document.getElementById('mt-components-list');
        mealTemplate.components.forEach((comp, compIdx) => {
            const slotDiv = document.createElement('div');
            // Outer wrapper for the component slot
            slotDiv.style.background = 'rgba(0,0,0,0.2)';
            slotDiv.style.border = '1px solid var(--card-border)';
            slotDiv.style.borderRadius = '8px';
            slotDiv.style.padding = '1rem';

            // Header for the slot
            slotDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem;">
                    <strong style="color:var(--accent-red)">العنصر الأساسي (#${compIdx + 1})</strong>
                    <button class="btn-icon text-danger btn-del-comp" title="حذف هذه الخانة بالكامل"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="active-dropdown-holder" style="margin-bottom:1.5rem;"></div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <label style="margin:0; font-size:0.9rem; color:var(--accent-yellow)"><i class="fa-solid fa-random"></i> البدائل المسموحة لهذا العنصر في هذه الوجبة فقط <b>(${comp.allowedAlternatives ? comp.allowedAlternatives.length : 0})</b></label>
                    <button class="btn btn-sm btn-secondary btn-add-slot-alt" style="padding:0.2rem 0.5rem; font-size:0.8rem;"><i class="fa-solid fa-plus"></i> إضافة بديل</button>
                </div>
                <div class="alts-holder manager-list"></div>
            `;

            // Delete entire component slot
            slotDiv.querySelector('.btn-del-comp').addEventListener('click', () => {
                if (confirm("هل أنت متأكد من مسح هذه الخانة بكل بدائلها؟")) {
                    mealTemplate.components.splice(compIdx, 1);
                    saveAndRefresh();
                }
            });

            // 1) Render Active Food Dropdown
            const activeDropdown = createSearchableDropdown(comp.activeFoodId, (selectedFId) => {
                comp.activeFoodId = selectedFId;
                saveAndRefresh();
            });
            slotDiv.querySelector('.active-dropdown-holder').appendChild(activeDropdown);

            // 2) Handle Allowed Alternatives list
            if (!comp.allowedAlternatives) comp.allowedAlternatives = [];

            slotDiv.querySelector('.btn-add-slot-alt').addEventListener('click', () => {
                comp.allowedAlternatives.push(null);
                saveAndRefresh();
            });

            const altsHolder = slotDiv.querySelector('.alts-holder');
            if (comp.allowedAlternatives.length === 0) {
                altsHolder.innerHTML = `<div class="empty-state-small text-muted" style="padding:1rem; font-size:0.85rem;">لا يوجد بدائل محددة.</div>`;
            } else {
                comp.allowedAlternatives.forEach((altFoodId, altIdx) => {
                    const altDiv = document.createElement('div');
                    altDiv.className = 'manager-list-item';
                    altDiv.style.overflow = 'visible';
                    altDiv.style.padding = '0.5rem';
                    altDiv.style.background = 'rgba(230, 57, 70, 0.05)';

                    const altDropdown = createSearchableDropdown(altFoodId, (selectedFId) => {
                        comp.allowedAlternatives[altIdx] = selectedFId;
                        saveAndRefresh();
                    });

                    const controlsDiv = document.createElement('div');
                    controlsDiv.className = 'item-actions';
                    controlsDiv.innerHTML = `<button class="btn-icon text-danger btn-del-alt" title="إزالة هذا البديل"><i class="fa-solid fa-times"></i></button>`;

                    controlsDiv.querySelector('.btn-del-alt').addEventListener('click', () => {
                        comp.allowedAlternatives.splice(altIdx, 1);
                        saveAndRefresh();
                    });

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'item-content';
                    contentDiv.appendChild(altDropdown);

                    altDiv.appendChild(contentDiv);
                    altDiv.appendChild(controlsDiv);
                    altsHolder.appendChild(altDiv);
                });
            }

            compsList.appendChild(slotDiv);
        });
    };

    // 3. Schedule Editor
    const renderScheduleEditor = (sId) => {
        const sched = plan.activePlan.find(p => p.id === sId);
        if (!sched) return clearEditor();

        editorTitle.innerHTML = `<i class="fa-solid fa-calendar-days" style="color:var(--accent-red)"></i> جدولة الوجبة`;

        editorContent.innerHTML = `
            <div class="form-group highlighted-group">
                <label>الوقت</label>
                <input type="text" id="edit-sched-time" class="form-control" value="${sched.time}">
            </div>
            
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
        `;

        document.getElementById('edit-sched-time').addEventListener('change', (e) => {
            sched.time = e.target.value;
            saveAndRefresh();
        });

        // Simple custom dropdown logic for meal templates
        const header = document.getElementById('meal-dropdown').querySelector('.dropdown-header');
        const body = document.getElementById('meal-dd-body');
        const list = document.getElementById('meal-dd-list');

        Object.keys(plan.mealsLibrary).forEach(mId => {
            const li = document.createElement('li');
            li.textContent = plan.mealsLibrary[mId].name;
            if (mId === sched.mealTemplateId) li.classList.add('selected');
            li.addEventListener('click', () => {
                sched.mealTemplateId = mId;
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
    document.getElementById('btn-add-item').addEventListener('click', () => {
        if (currentTab === 'foods') {
            const newId = DataManager.generateId('f');
            plan.foodsLibrary[newId] = { name: "طعام جديد" };
            currentItemId = newId;
            saveAndRefresh();
        } else if (currentTab === 'meals') {
            const newId = DataManager.generateId('mt');
            plan.mealsLibrary[newId] = { name: "قالب وجبة جديد", components: [] };
            currentItemId = newId;
            saveAndRefresh();
        } else if (currentTab === 'schedule') {
            const newId = DataManager.generateId('schedule');
            plan.activePlan.push({ id: newId, time: "الساعة ( --:-- )", mealTemplateId: null });
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
    renderSidebar();
    if (currentItemId) renderEditor();

});
