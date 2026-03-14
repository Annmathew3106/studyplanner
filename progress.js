const rangeSelect = document.getElementById("range");
const chartRoot = document.getElementById("chart");
const emptyState = document.getElementById("empty");
const storageKey = "studyPlans";

function loadPlans() {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function parseDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function hasAnyDone(plan) {
    return plan.items.some((item) => item.done);
}

function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function addMonths(date, amount) {
    const next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
    return next;
}

function formatDay(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

function formatMonth(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
}

function getWeekKey(date) {
    const temp = new Date(date);
    temp.setHours(0, 0, 0, 0);
    const day = temp.getDay() || 7;
    temp.setDate(temp.getDate() + 4 - day);
    const yearStart = new Date(temp.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
    return `${temp.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function percent(done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
}

function buildDaily(plans) {
    const today = new Date();
    const days = [];

    for (let i = -13; i <= 14; i += 1) {
        const date = addDays(today, i);
        const key = date.toISOString().slice(0, 10);
        days.push({ key, label: formatDay(date), done: 0, total: 0 });
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        let day = days.find((d) => d.key === plan.date);
        if (!day) {
            day = { key: plan.date, label: formatDay(date), done: 0, total: 0 };
            days.push(day);
        }

        plan.items.forEach((item) => {
            day.total += 1;
            if (item.done) day.done += 1;
        });
    });

    return days;
}

function buildToday(plans) {
    const today = new Date();
    const key = today.toISOString().slice(0, 10);
    const row = { key, label: "Today", done: 0, total: 0 };

    plans.forEach((plan) => {
        if (plan.date !== key) return;
        plan.items.forEach((item) => {
            row.total += 1;
            if (item.done) row.done += 1;
        });
    });

    return [row];
}

function buildWeekly(plans) {
    const today = new Date();
    const weeks = [];

    for (let i = -4; i <= 3; i += 1) {
        const date = addDays(today, i * 7);
        const key = getWeekKey(date);
        weeks.push({ key, label: `W${key.slice(-2)}`, done: 0, total: 0 });
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        const key = getWeekKey(date);
        let week = weeks.find((w) => w.key === key);
        if (!week) {
            week = { key, label: `W${key.slice(-2)}`, done: 0, total: 0 };
            weeks.push(week);
        }
        plan.items.forEach((item) => {
            week.total += 1;
            if (item.done) week.done += 1;
        });
    });

    return weeks;
}

function buildMonthly(plans) {
    const today = new Date();
    const months = [];

    for (let i = -6; i <= 5; i += 1) {
        const date = addMonths(today, i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        months.push({ key, label: formatMonth(date), done: 0, total: 0 });
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        let month = months.find((m) => m.key === key);
        if (!month) {
            month = { key, label: formatMonth(date), done: 0, total: 0 };
            months.push(month);
        }
        plan.items.forEach((item) => {
            month.total += 1;
            if (item.done) month.done += 1;
        });
    });

    return months;
}

function renderProgressBar(data) {
    chartRoot.innerHTML = "";

    const totals = data.reduce(
        (acc, row) => {
            acc.done += row.done;
            acc.total += row.total;
            return acc;
        },
        { done: 0, total: 0 }
    );

    const pct = percent(totals.done, totals.total);

    const track = document.createElement("div");
    track.className = "progress-track";

    const fill = document.createElement("div");
    fill.className = "progress-fill";
    if (pct >= 70) fill.classList.add("good");
    fill.style.width = `${pct}%`;
    track.appendChild(fill);

    const meta = document.createElement("div");
    meta.className = "progress-meta";

    const left = document.createElement("span");
    left.textContent = totals.total ? `${totals.done}/${totals.total} tasks completed` : "No tasks yet";

    const right = document.createElement("span");
    right.textContent = `${pct}%`;

    meta.appendChild(left);
    meta.appendChild(right);

    chartRoot.appendChild(track);
    chartRoot.appendChild(meta);
}

function updateChart() {
    const plans = loadPlans();
    let data = [];

    const mode = rangeSelect.value;
    if (mode === "today") {
        data = buildToday(plans);
    } else if (mode === "daily") {
        data = buildDaily(plans);
    } else if (mode === "weekly") {
        data = buildWeekly(plans);
    } else {
        data = buildMonthly(plans);
    }

    const hasAny = data.some((row) => row.total > 0);
    emptyState.hidden = hasAny;
    chartRoot.hidden = !hasAny;

    if (hasAny) {
        renderProgressBar(data);
    }
}

rangeSelect?.addEventListener("change", updateChart);
updateChart();
