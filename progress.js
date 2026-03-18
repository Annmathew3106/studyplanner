const rangeSelect = document.getElementById("range");
const chartRoot = document.getElementById("chart");
const weekLegend = document.getElementById("week-legend");
const chartRow = document.querySelector(".chart-row");
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

function startOfDay(date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function dateKey(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatDay(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

function formatMonth(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
}

function formatShortDate(date) {
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
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

function hasStoredPlanData(plans) {
    return plans.some((plan) => Array.isArray(plan.items) && plan.items.length > 0);
}

function buildDaily(plans) {
    const today = new Date();
    const days = [];

    for (let i = -13; i <= 14; i += 1) {
        const date = addDays(today, i);
        const key = dateKey(date);
        days.push({ key, label: formatDay(date), done: 0, total: 0 });
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        const key = dateKey(date);
        let day = days.find((d) => d.key === key);
        if (!day) {
            day = { key, label: formatDay(date), done: 0, total: 0 };
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
    const key = dateKey(today);
    const row = { key, label: "Today", done: 0, total: 0 };

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        if (dateKey(date) !== key) return;
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

    for (let i = -5; i <= 0; i += 1) {
        const date = addDays(today, i * 7);
        const key = getWeekKey(date);
        const start = weekKeyToStart(key);
        const end = addDays(start, 6);
        const shortLabel = `W${key.slice(-2)}`;
        const fullLabel = `${formatDay(start)}-${formatDay(end)}`;
        weeks.push({ key, label: shortLabel, fullLabel, done: 0, total: 0 });
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        const key = getWeekKey(date);
        let week = weeks.find((w) => w.key === key);
        if (!week) {
            const start = weekKeyToStart(key);
            const end = addDays(start, 6);
            const shortLabel = `W${key.slice(-2)}`;
            const fullLabel = `${formatDay(start)}-${formatDay(end)}`;
            week = { key, label: shortLabel, fullLabel, done: 0, total: 0 };
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

function buildWeekOptions(plans) {
    const today = new Date();
    const set = new Set();

    for (let i = -4; i <= 3; i += 1) {
        set.add(getWeekKey(addDays(today, i * 7)));
    }

    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        set.add(getWeekKey(date));
    });

    return Array.from(set).sort();
}

function buildWeekDays(plans, weekKey) {
    const weekStart = weekKeyToStart(weekKey);

    const days = [];
    for (let i = 0; i < 7; i += 1) {
        const date = addDays(weekStart, i);
        const key = dateKey(date);
        days.push({
            key,
            label: date.toLocaleDateString("en-GB", { weekday: "short" }),
            sub: formatShortDate(date),
            done: 0,
            total: 0,
        });
    }

    plans.forEach((plan) => {
        const day = days.find((d) => d.key === plan.date);
        if (!day) return;
        plan.items.forEach((item) => {
            day.total += 1;
            if (item.done) day.done += 1;
        });
    });

    return days;
}

function weekKeyToStart(weekKey) {
    const [yearPart, weekPart] = weekKey.split("-W");
    const weekNo = Number(weekPart);
    const year = Number(yearPart);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - (jan4Day - 1) + (weekNo - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function renderLineChart(target, data, labelMode = "short") {
    target.innerHTML = "";
    if (!data.length) return;

    const isSingle = data.length === 1;
    const mode = target?.getAttribute("data-mode") || "";
    const perPoint = mode === "monthly" ? 120 : 100;
    const width = Math.max(600, data.length * perPoint);
    const height = 260;
    const padding = 36;
    const singleOffset = isSingle ? 40 : 0;

    const points = data.map((row, index) => {
        const x = padding + singleOffset + (index * (width - padding * 2 - singleOffset)) / (data.length - 1 || 1);
        const ratio = row.total ? row.done / row.total : 0;
        const clamped = Math.min(1, Math.max(0, ratio));
        const y = height - padding - clamped * (height - padding * 2);
        const label = row.label ?? "";
        const sub = row.sub ?? "";
        return { x, y, label, sub };
    });

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const areaPath = `${path} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    for (let i = 0; i <= 4; i += 1) {
        const labelValue = 100 - i * 25;
        const y = padding + (i * (height - padding * 2)) / 4;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding + singleOffset);
        line.setAttribute("x2", width - padding);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);
        line.setAttribute("class", "line-grid");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("class", "line-axis");
        label.setAttribute("data-level", String(labelValue));
        label.textContent = `${labelValue}%`;
        svg.appendChild(label);
    }

    if (points.length > 1) {
        const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        area.setAttribute("d", areaPath);
        area.setAttribute("class", "line-area");
        svg.appendChild(area);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("d", path);
        line.setAttribute("class", "line-path");
        svg.appendChild(line);
    } else {
        const single = points[0];
        const flat = document.createElementNS("http://www.w3.org/2000/svg", "line");
        flat.setAttribute("x1", padding + singleOffset);
        flat.setAttribute("x2", width - padding);
        flat.setAttribute("y1", single.y);
        flat.setAttribute("y2", single.y);
        flat.setAttribute("class", "line-path");
        svg.appendChild(flat);
    }

    points.forEach((p) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", 4);
        circle.setAttribute("class", "line-point");
        svg.appendChild(circle);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", p.x);
        label.setAttribute("y", height - 8);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "line-label");
        label.textContent = labelMode === "long" && p.sub ? `${p.label} ${p.sub}` : p.label;
        svg.appendChild(label);
    });

    target.appendChild(svg);
}

function renderWeekLegend(weeks) {
    if (!weekLegend) return;
    weekLegend.innerHTML = "";
    weeks.forEach((week) => {
        const item = document.createElement("div");
        item.className = "week-legend-item";
        item.textContent = week.label;

        const sub = document.createElement("span");
        sub.textContent = week.fullLabel || "";
        item.appendChild(sub);
        weekLegend.appendChild(item);
    });
}

function updateChart() {
    const plans = loadPlans();
    let data = [];
    const hasStoredData = hasStoredPlanData(plans);

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

    chartRoot.hidden = !hasStoredData;

    if (hasStoredData) {
        chartRoot.setAttribute("data-mode", mode);
        renderLineChart(chartRoot, data, "short");
    } else {
        chartRoot.innerHTML = "";
    }

    if (chartRoot && !hasStoredData) {
        chartRoot.setAttribute("data-mode", mode);
    }

    if (weekLegend && chartRow) {
        if (mode === "weekly" && hasStoredData && data.length) {
            weekLegend.hidden = false;
            chartRow.classList.add("has-legend");
            renderWeekLegend(data);
        } else {
            weekLegend.hidden = true;
            weekLegend.innerHTML = "";
            chartRow.classList.remove("has-legend");
        }
    }
}

rangeSelect?.addEventListener("change", updateChart);
updateChart();
