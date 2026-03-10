document.addEventListener('DOMContentLoaded', () => {

    const plan = DataManager.loadPlan();
    const sidebar = document.getElementById('meals-list');
    const editorTitle = document.getElementById('editor-title');
    const editorContent = document.getElementById('editor-content');
    const toast = document.getElementById('save-toast');

    let currentMealId = null;
    let currentCompId = null;

    // ----- UI Helpers -----

    const showToast = () => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    };

    const saveAndRefresh = () => {
        DataManager.savePlan(plan);
        showToast();
        renderSidebar();
        if (currentCompId) {
            renderComponentEditor(currentMealId, currentCompId);
        } else if (currentMealId) {
            renderMealEditor(currentMealId);
        }
    };

    // ----- Renders -----

    const renderSidebar = () => {
        sidebar.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'nav-list';

        plan.meals.forEach(meal => {
            const li = document.createElement('li');
            li.className = 'nav-item';

            // Meal Top Level
            const mealHeader = document.createElement('div');
            mealHeader.className = `nav-header ${currentMealId === meal.id && !currentCompId ? 'active' : ''}`;
            mealHeader.innerHTML = `
                <span><i class="fa-solid fa-bowl-food" style="color:var(--accent-red)"></i> ${meal.title}</span>
                <button class="btn-icon text-muted btn-delete-meal" title="حذف الوجبة">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            // Add click for selecting meal
            mealHeader.querySelector('span').addEventListener('click', () => {
                currentMealId = meal.id;
                currentCompId = null;
                renderSidebar();
                renderMealEditor(meal.id);
            });

            // Delete meal
            mealHeader.querySelector('.btn-delete-meal').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('هل تريد حذف هذه الوجبة وكل مكوناتها؟')) {
                    const idx = plan.meals.findIndex(m => m.id === meal.id);
                    plan.meals.splice(idx, 1);
                    currentMealId = null;
                    editorTitle.textContent = 'اختر وجبة للتعديل';
                    editorContent.innerHTML = '<div class="empty-state"><i class="fa-solid fa-hand-pointer"></i><p>اختر من القائمة الجانبية.</p></div>';
                    saveAndRefresh();
                }
            });

            li.appendChild(mealHeader);

            // Meal Components Sub-list
            const compUl = document.createElement('ul');
            compUl.className = 'nav-sublist';
            meal.components.forEach(comp => {
                const compLi = document.createElement('li');
                compLi.className = `nav-subitem ${currentCompId === comp.id ? 'active' : ''}`;
                compLi.innerHTML = `
                    <span class="truncate" title="${comp.activeItem}">${comp.activeItem || 'عنصر جديد'}</span>
                `;
                compLi.addEventListener('click', () => {
                    currentMealId = meal.id;
                    currentCompId = comp.id;
                    renderSidebar();
                    renderComponentEditor(meal.id, comp.id);
                });
                compUl.appendChild(compLi);
            });
            li.appendChild(compUl);

            ul.appendChild(li);
        });

        sidebar.appendChild(ul);
    };

    const renderMealEditor = (mealId) => {
        const meal = plan.meals.find(m => m.id === mealId);
        if (!meal) return;

        editorTitle.innerHTML = `<i class="fa-solid fa-bowl-food" style="color:var(--accent-red)"></i> إعدادات الوجبة: ${meal.title}`;

        editorContent.innerHTML = `
            <div class="form-group">
                <label>اسم الوجبة</label>
                <input type="text" id="edit-meal-title" class="form-control" value="${meal.title}">
            </div>
            <div class="form-group">
                <label>وقت الوجبة</label>
                <input type="text" id="edit-meal-time" class="form-control" value="${meal.time}">
            </div>
            
            <div class="components-manager">
                <h3 style="margin-bottom: 1rem;">عناصر الوجبة</h3>
                <div id="meal-components-list" class="manager-list"></div>
                <button id="btn-add-comp" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fa-solid fa-plus"></i> إضافة طعام جديد للوجبة
                </button>
            </div>
        `;

        // Bind meal fields
        document.getElementById('edit-meal-title').addEventListener('change', (e) => {
            meal.title = e.target.value;
            saveAndRefresh();
        });
        document.getElementById('edit-meal-time').addEventListener('change', (e) => {
            meal.time = e.target.value;
            saveAndRefresh();
        });

        // Add Comp button
        document.getElementById('btn-add-comp').addEventListener('click', () => {
            const newComp = {
                id: DataManager.generateId('c'),
                activeItem: "عنصر جديد",
                alternatives: []
            };
            meal.components.push(newComp);
            currentCompId = newComp.id;
            saveAndRefresh();
        });

        // List comps inside meal editor
        const compsList = document.getElementById('meal-components-list');
        meal.components.forEach((comp, idx) => {
            const div = document.createElement('div');
            div.className = 'manager-list-item';
            div.innerHTML = `
                <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                <div class="item-content truncate">${comp.activeItem}</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit-comp" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-del-comp text-danger" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            div.querySelector('.btn-edit-comp').addEventListener('click', () => {
                currentCompId = comp.id;
                renderSidebar();
                renderComponentEditor(mealId, comp.id);
            });

            div.querySelector('.btn-del-comp').addEventListener('click', () => {
                if (confirm('حذف هذا الطعام؟')) {
                    meal.components.splice(idx, 1);
                    saveAndRefresh();
                }
            });

            compsList.appendChild(div);
        });
    };

    const renderComponentEditor = (mealId, compId) => {
        const meal = plan.meals.find(m => m.id === mealId);
        const comp = meal.components.find(c => c.id === compId);
        if (!comp) return;

        editorTitle.innerHTML = `<a href="#" id="back-to-meal" style="color:var(--text-secondary); margin-left:10px;"><i class="fa-solid fa-chevron-right"></i></a> إدارة الطعام والبدائل`;

        document.getElementById('back-to-meal').addEventListener('click', (e) => {
            e.preventDefault();
            currentCompId = null;
            renderSidebar();
            renderMealEditor(mealId);
        });

        editorContent.innerHTML = `
            <div class="form-group highlighted-group">
                <label><i class="fa-solid fa-star" style="color:var(--accent-red)"></i> العنصر الأساسي الحالي</label>
                <textarea id="edit-comp-active" class="form-control" rows="2">${comp.activeItem}</textarea>
                <small class="text-muted">هذا هو العنصر الذي سيظهر في الصفحة الرئيسية كخيار افتراضي.</small>
            </div>
            
            <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                    <label style="margin:0;"><i class="fa-solid fa-shuffle" style="color:var(--accent-yellow)"></i> البدائل المتاحة</label>
                    <button id="btn-add-alt" class="btn btn-sm btn-secondary"><i class="fa-solid fa-plus"></i> بديل جديد</button>
                </div>
                <div id="alternatives-list" class="manager-list">
                    <!-- alts go here -->
                </div>
            </div>
        `;

        document.getElementById('edit-comp-active').addEventListener('change', (e) => {
            comp.activeItem = e.target.value;
            saveAndRefresh();
        });

        document.getElementById('btn-add-alt').addEventListener('click', () => {
            comp.alternatives.push("البديل الجديد...");
            saveAndRefresh();
        });

        const altsList = document.getElementById('alternatives-list');
        if (comp.alternatives.length === 0) {
            altsList.innerHTML = `<div class="empty-state-small text-muted">لا يوجد بدائل محددة حتى الآن.</div>`;
        } else {
            comp.alternatives.forEach((alt, idx) => {
                const div = document.createElement('div');
                div.className = 'manager-list-item';
                div.innerHTML = `
                    <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                    <div class="item-content">
                        <textarea class="form-control alt-textarea" rows="2">${alt}</textarea>
                    </div>
                    <div class="item-actions flex-col">
                        <button class="btn-icon btn-make-primary text-green" title="تعيين كعنصر أساسي"><i class="fa-solid fa-arrow-up"></i></button>
                        <button class="btn-icon btn-del-alt text-danger" title="حذف البديل"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;

                // Update alt text
                const ta = div.querySelector('.alt-textarea');
                ta.addEventListener('change', (e) => {
                    comp.alternatives[idx] = e.target.value;
                    saveAndRefresh();
                });

                // Swap alt and active
                div.querySelector('.btn-make-primary').addEventListener('click', () => {
                    const temp = comp.activeItem;
                    comp.activeItem = comp.alternatives[idx];
                    comp.alternatives[idx] = temp;
                    saveAndRefresh();
                });

                // Delete alt
                div.querySelector('.btn-del-alt').addEventListener('click', () => {
                    comp.alternatives.splice(idx, 1);
                    saveAndRefresh();
                });

                altsList.appendChild(div);
            });
        }
    };


    // ----- Global Bindings -----

    document.getElementById('btn-add-meal').addEventListener('click', () => {
        const newMeal = {
            id: DataManager.generateId('m'),
            title: "وجبة جديدة",
            time: "الساعة ( --:-- )",
            components: []
        };
        plan.meals.push(newMeal);
        currentMealId = newMeal.id;
        currentCompId = null;
        saveAndRefresh();
    });

    document.getElementById('btn-share-link').addEventListener('click', () => {
        const base64Data = DataManager.exportToUrl();
        if (base64Data) {
            // Get current base URL without manage.html
            const baseUrl = window.location.href.split('manage.html')[0];
            const shareUrl = `${baseUrl}index.html?plan=${base64Data}`;

            // Try to copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert("تم نسخ رابط المشاركة بنجاح! يمكن لأي شخص يفتح هذا الرابط رؤية خطتك المخصصة.");
            }).catch(err => {
                console.error("Failed to copy link", err);
                // Fallback prompt
                prompt("انسخ الرابط التالي للمشاركة:", shareUrl);
            });
        } else {
            alert("حدث خطأ أثناء إنشاء الرابط.");
        }
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if (confirm('تحذير: هذا سيحذف جميع تعديلاتك ويعيد الخطة الافتراضية. هل أنت متأكد؟')) {
            DataManager.resetToDefault();
            window.location.href = 'index.html'; // redirect back
        }
    });

    // Check URL parameters for direct deep-linking from index
    const urlParams = new URLSearchParams(window.location.search);
    const pMeal = urlParams.get('meal');
    const pComp = urlParams.get('comp');

    if (pMeal) { currentMealId = pMeal; }
    if (pComp) { currentCompId = pComp; }

    // Init
    renderSidebar();
    if (currentCompId) {
        renderComponentEditor(currentMealId, currentCompId);
    } else if (currentMealId) {
        renderMealEditor(currentMealId);
    }

});
