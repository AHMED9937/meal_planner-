document.addEventListener('DOMContentLoaded', () => {
    const plan = DataManager.loadPlan();
    DataManager.ensureWeeklyPlan(plan);
    DataManager.ensureProgressTracking(plan);

    const today = DataManager.getLocalDateStr();
    const todayDayId = DataManager.getTodayDayId();
    DataManager.recordDayIntakeSnapshot(plan, todayDayId, today);
    DataManager.savePlan(plan);

    const fmtMacro = (n) => DataManager.formatMacroDisplay(n);
    const roundMacro = (n) => DataManager.roundMacroDisplay(n);
    const savePlan = () => DataManager.savePlan(plan);

    let weekAnchor = today;
    let monthYear = new Date().getFullYear();
    let monthNum = new Date().getMonth() + 1;

    const bodyDateInput = document.getElementById('body-date');
    bodyDateInput.value = today;

    const macroHtml = (m) =>
        `${fmtMacro(m.cal)} س · P ${fmtMacro(m.p)} · C ${fmtMacro(m.c)} · F ${fmtMacro(m.f)}`;

    const diffClass = (val) => (val > 0 ? 'macro-diff-pos' : val < 0 ? 'macro-diff-neg' : '');

    function switchTab(tabId) {
        document.querySelectorAll('.progress-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.progress-panel').forEach(panel => {
            const on = panel.dataset.panel === tabId;
            panel.classList.toggle('active', on);
            panel.hidden = !on;
        });
    }

    document.querySelectorAll('.progress-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    function renderBodyMetrics() {
        const container = document.getElementById('body-metrics-table');
        const log = [...(plan.bodyMetricsLog || [])].sort((a, b) => b.date.localeCompare(a.date));

        if (!log.length) {
            container.innerHTML = '<p class="text-muted">لا توجد قياسات بعد. أضف الوزن أو الدهون أو العضلات أعلاه.</p>';
            return;
        }

        const fmt = (v, suffix = '') =>
            v != null && !Number.isNaN(v) ? `${fmtMacro(v)}${suffix}` : '—';

        let html = `
            <div class="report-table-wrap body-metrics-table">
            <table class="report-table">
            <thead><tr>
                <th>التاريخ</th><th>الوزن</th><th>دهون %</th><th>عضلات</th><th>خصر</th><th>ملاحظة</th><th></th>
            </tr></thead><tbody>`;

        log.forEach(entry => {
            html += `<tr>
                <td>${DataManager.formatDisplayDate(entry.date)}</td>
                <td class="macro-cell">${fmt(entry.weightKg, ' كغ')}</td>
                <td class="macro-cell">${fmt(entry.bodyFatPct, '%')}</td>
                <td class="macro-cell">${fmt(entry.muscleMassKg, ' كغ')}</td>
                <td class="macro-cell">${fmt(entry.waistCm, ' سم')}</td>
                <td>${entry.note || '—'}</td>
                <td class="actions">
                    <button type="button" class="btn-icon text-danger body-delete" data-id="${entry.id}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        container.querySelectorAll('.body-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('حذف هذا القياس؟')) return;
                DataManager.removeBodyMetric(plan, btn.dataset.id);
                savePlan();
                renderBodyMetrics();
            });
        });
    }

    document.getElementById('body-metric-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = document.getElementById('body-weight').value;
        const fat = document.getElementById('body-fat').value;
        const muscle = document.getElementById('body-muscle').value;
        const waist = document.getElementById('body-waist').value;

        if (!weight && !fat && !muscle && !waist) {
            alert('أدخل قيمة واحدة على الأقل (وزن، دهون، عضلات، أو خصر).');
            return;
        }

        DataManager.addBodyMetric(plan, {
            date: bodyDateInput.value || today,
            weightKg: weight || null,
            bodyFatPct: fat || null,
            muscleMassKg: muscle || null,
            waistCm: waist || null,
            note: document.getElementById('body-note').value.trim()
        });
        savePlan();
        document.getElementById('body-weight').value = '';
        document.getElementById('body-fat').value = '';
        document.getElementById('body-muscle').value = '';
        document.getElementById('body-waist').value = '';
        document.getElementById('body-note').value = '';
        renderBodyMetrics();
    });

    function renderNutritionReport(containerId, report) {
        const el = document.getElementById(containerId);
        const { totals, days, daysWithData, totalDays } = report;

        let html = `
            <p class="progress-hint">
                تُسجَّل القيمة الغذائية عند الحفظ من الصفحة اليومية (${daysWithData} من ${totalDays} أيام بها بيانات).
                علّم الإضافات الخاطئة بزر <i class="fa-solid fa-flag"></i> في قسم الإضافات.
            </p>
            <div class="card">
                <div class="card-body">
                    <div class="report-totals">
                        <div class="report-total-card">
                            <label>مخطط (مجموع)</label>
                            <strong>${fmtMacro(totals.planned.cal)}</strong>
                            <span class="text-muted" style="font-size:0.75rem;">سعرة</span>
                        </div>
                        <div class="report-total-card">
                            <label>مأكول (مجموع)</label>
                            <strong>${fmtMacro(totals.eaten.cal)}</strong>
                            <span class="text-muted" style="font-size:0.75rem;">سعرة</span>
                        </div>
                        <div class="report-total-card">
                            <label>الفرق (سعرات)</label>
                            <strong class="${diffClass(totals.diff.cal)}">${totals.diff.cal > 0 ? '+' : ''}${fmtMacro(totals.diff.cal)}</strong>
                        </div>
                        <div class="report-total-card">
                            <label>بروتين · فرق</label>
                            <strong class="${diffClass(totals.diff.p)}">${totals.diff.p > 0 ? '+' : ''}${fmtMacro(totals.diff.p)}g</strong>
                        </div>
                    </div>
                </div>
            </div>`;

        html += `<div class="card" style="margin-top:1rem;"><div class="card-header">
            <h2 class="section-title" style="margin:0;">يوم بيوم</h2>
        </div><div class="card-body"><div class="report-table-wrap">
        <table class="report-table"><thead><tr>
            <th>التاريخ</th><th>يوم الخطة</th><th>مخطط</th><th>مأكول</th><th>فرق</th><th>تنبيه</th>
        </tr></thead><tbody>`;

        days.forEach(day => {
            if (!day.hasData) {
                html += `<tr class="no-data"><td>${DataManager.formatDisplayDate(day.dateStr)}</td>
                    <td colspan="5">لا يوجد سجل — استخدم الصفحة اليومية واحفظ</td></tr>`;
                return;
            }
            const flagCount = day.flaggedExtras ? day.flaggedExtras.length : 0;
            html += `<tr class="${flagCount ? 'has-flag' : ''}">
                <td>${DataManager.formatDisplayDate(day.dateStr)}</td>
                <td>${day.planDayLabel || '—'}</td>
                <td class="macro-cell">${macroHtml(day.planned)}</td>
                <td class="macro-cell">${macroHtml(day.eaten)}</td>
                <td class="macro-cell ${diffClass(day.diff.cal)}">${day.diff.cal > 0 ? '+' : ''}${fmtMacro(day.diff.cal)} س</td>
                <td>${flagCount ? `<span class="flag-pill">${flagCount} للمراجعة</span>` : '—'}</td>
            </tr>`;
        });

        html += '</tbody></table></div></div></div>';

        const flaggedAll = days.filter(d => d.hasData && d.flaggedExtras && d.flaggedExtras.length);
        if (flaggedAll.length) {
            html += `<div class="card" style="margin-top:1rem;"><div class="card-header">
                <h2 class="section-title" style="margin:0;">إضافات مُعلَّمة في هذه الفترة</h2>
            </div><div class="card-body"><ul class="extras-list">`;
            flaggedAll.forEach(day => {
                day.flaggedExtras.forEach(extra => {
                    const macros = DataManager.computeIntakeExtraMacros(extra, plan);
                    html += `<li class="extra-item">
                        <div class="extra-item-info">
                            <strong>${DataManager.getIntakeExtraLabel(extra, plan)}</strong>
                            <span>${DataManager.formatDisplayDate(day.dateStr)} · ${macroHtml(macros)}</span>
                        </div>
                    </li>`;
                });
            });
            html += '</ul></div></div>';
        }

        el.innerHTML = html;
    }

    function renderWeekReport() {
        const range = DataManager.getWeekRangeSaturday(weekAnchor);
        document.getElementById('week-range-label').textContent =
            `${DataManager.formatDisplayDate(range.start)} — ${DataManager.formatDisplayDate(range.end)}`;
        const report = DataManager.buildNutritionPeriodReport(plan, range.start, range.end);
        renderNutritionReport('week-report', report);
    }

    function renderMonthReport() {
        const range = DataManager.getMonthRange(monthYear, monthNum);
        const monthName = new Date(monthYear, monthNum - 1, 1)
            .toLocaleDateString('ar', { month: 'long', year: 'numeric' });
        document.getElementById('month-range-label').textContent = monthName;
        const report = DataManager.buildNutritionPeriodReport(plan, range.start, range.end);
        renderNutritionReport('month-report', report);
    }

    document.getElementById('week-prev').addEventListener('click', () => {
        const range = DataManager.getWeekRangeSaturday(weekAnchor);
        weekAnchor = DataManager.addDaysToDateStr(range.start, -7);
        renderWeekReport();
    });
    document.getElementById('week-next').addEventListener('click', () => {
        const range = DataManager.getWeekRangeSaturday(weekAnchor);
        weekAnchor = DataManager.addDaysToDateStr(range.end, 1);
        renderWeekReport();
    });
    document.getElementById('week-this').addEventListener('click', () => {
        weekAnchor = today;
        renderWeekReport();
    });

    document.getElementById('month-prev').addEventListener('click', () => {
        monthNum -= 1;
        if (monthNum < 1) {
            monthNum = 12;
            monthYear -= 1;
        }
        renderMonthReport();
    });
    document.getElementById('month-next').addEventListener('click', () => {
        monthNum += 1;
        if (monthNum > 12) {
            monthNum = 1;
            monthYear += 1;
        }
        renderMonthReport();
    });
    document.getElementById('month-this').addEventListener('click', () => {
        const now = new Date();
        monthYear = now.getFullYear();
        monthNum = now.getMonth() + 1;
        renderMonthReport();
    });

    function getFoodLogRange() {
        const mode = document.getElementById('foodlog-range').value;
        if (mode === 'month') {
            const now = new Date();
            return DataManager.getMonthRange(now.getFullYear(), now.getMonth() + 1);
        }
        if (mode === '30') {
            return {
                start: DataManager.addDaysToDateStr(today, -29),
                end: today
            };
        }
        return DataManager.getWeekRangeSaturday(today);
    }

    function renderFoodLog() {
        const range = getFoodLogRange();
        const flaggedOnly = document.getElementById('foodlog-flagged-only').checked;
        const entries = DataManager.collectFoodLogEntries(plan, range.start, range.end, {
            flaggedOnly
        });
        const container = document.getElementById('food-log-table');

        if (!entries.length) {
            container.innerHTML = `<p class="text-muted">لا توجد إضافات مسجّلة في هذه الفترة${flaggedOnly ? ' (المُعلَّمة فقط)' : ''}.</p>`;
            return;
        }

        let html = `<div class="report-table-wrap"><table class="report-table"><thead><tr>
            <th>التاريخ</th><th>الطعام</th><th>القيمة</th><th>مراجعة</th>
        </tr></thead><tbody>`;

        entries.forEach(item => {
            html += `<tr class="${item.flagged ? 'has-flag' : ''}" data-date="${item.dateStr}" data-id="${item.extra.id}">
                <td>${item.dateLabel}</td>
                <td>${item.label}${item.extra.note ? `<br><small class="text-muted">${item.extra.note}</small>` : ''}</td>
                <td class="macro-cell">${macroHtml(item.macros)}</td>
                <td>
                    <button type="button" class="btn-icon foodlog-flag ${item.flagged ? 'is-flagged' : ''}" title="تعليم للمراجعة">
                        <i class="fa-solid fa-flag"></i>
                    </button>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        container.querySelectorAll('.foodlog-flag').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const dateStr = row.dataset.date;
                const extraId = row.dataset.id;
                const entry = entries.find(e => e.dateStr === dateStr && e.extra.id === extraId);
                if (!entry) return;
                const next = !entry.flagged;
                DataManager.setIntakeExtraFlaggedInHistory(plan, dateStr, extraId, next);
                savePlan();
                renderFoodLog();
            });
        });
    }

    document.getElementById('foodlog-flagged-only').addEventListener('change', renderFoodLog);
    document.getElementById('foodlog-range').addEventListener('change', renderFoodLog);

    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab && document.querySelector(`.progress-tab[data-tab="${urlTab}"]`)) {
        switchTab(urlTab);
    }

    renderBodyMetrics();
    renderWeekReport();
    renderMonthReport();
    renderFoodLog();
});
