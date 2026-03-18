const timetableRoot = document.getElementById("timetables");
const createLink = document.querySelector('.header-row .button');
const storageKey = "examTimetables";
const editKey = "editTimetableId";

function loadTimetables() {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveTimetables(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
}

function clearEditState() {
    localStorage.removeItem(editKey);
}

function formatDate(dateValue) {
    if (!dateValue) return "";
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(timeValue) {
    if (!timeValue) return "";
    const [hours, minutes] = timeValue.split(":");
    if (!hours || !minutes) return timeValue;
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function renderTimetables() {
    if (!timetableRoot) return;

    const timetables = loadTimetables().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    timetableRoot.innerHTML = "";

    if (timetables.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No exam timetables yet. Click CREATE to add your colorful exam schedule.";
        timetableRoot.appendChild(empty);
        return;
    }

    timetables.forEach((timetable) => {
        const card = document.createElement("article");
        card.className = "timetable-entry";
        card.dataset.id = String(timetable.id);

        const header = document.createElement("div");
        header.className = "entry-header";

        const titleWrap = document.createElement("div");

        const title = document.createElement("h4");
        title.className = "entry-title";
        title.textContent = timetable.title;

        const subtitle = document.createElement("p");
        subtitle.className = "entry-subtitle";
        subtitle.textContent = "";

        titleWrap.appendChild(title);
        titleWrap.appendChild(subtitle);

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "entry-edit";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "entry-delete";
        deleteBtn.textContent = "Delete";

        header.appendChild(titleWrap);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        header.appendChild(actions);
        card.appendChild(header);

        const list = document.createElement("div");
        list.className = "exam-items";

        timetable.exams
            .slice()
            .sort((a, b) => {
                const dateCompare = (a.date || "").localeCompare(b.date || "");
                if (dateCompare !== 0) return dateCompare;
                return (a.time || "").localeCompare(b.time || "");
            })
            .forEach((exam) => {
                const row = document.createElement("div");
                row.className = "exam-row";

                const subject = document.createElement("span");
                subject.className = "exam-subject";
                subject.textContent = exam.subject;

                const date = document.createElement("span");
                date.className = "exam-date";
                date.textContent = formatDate(exam.date);

                const time = document.createElement("span");
                time.className = "exam-time";
                time.textContent = formatTime(exam.time);

                row.appendChild(subject);
                row.appendChild(date);
                row.appendChild(time);
                list.appendChild(row);
            });

        card.appendChild(list);
        timetableRoot.appendChild(card);
    });
}

timetableRoot?.addEventListener("click", (e) => {
    const button = e.target;
    if (!(button instanceof HTMLElement)) return;

    const card = button.closest(".timetable-entry");
    if (!card) return;

    const id = Number(card.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.classList.contains("entry-edit")) {
        localStorage.setItem(editKey, String(id));
        window.location.href = "timetablecreate.html";
        return;
    }

    if (!button.classList.contains("entry-delete")) return;

    const confirmed = window.confirm("Delete this exam timetable?");
    if (!confirmed) return;

    const next = loadTimetables().filter((item) => item.id !== id);
    saveTimetables(next);
    renderTimetables();
});

renderTimetables();

createLink?.addEventListener("click", () => {
    clearEditState();
});
