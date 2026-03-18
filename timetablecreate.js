const form = document.querySelector(".form");
const addBtn = document.querySelector(".add-btn");
const subjects = document.querySelector(".subjects");
const template = document.getElementById("subject-template");
const storageKey = "examTimetables";
const editKey = "editTimetableId";

function addRow() {
    const node = template.content.cloneNode(true);
    subjects.appendChild(node);
}

function addRowWithValues(subject, date, time) {
    const node = template.content.cloneNode(true);
    const inputs = node.querySelectorAll("input");
    if (inputs[0]) inputs[0].value = subject;
    if (inputs[1]) inputs[1].value = date;
    if (inputs[2]) inputs[2].value = time;
    subjects.appendChild(node);
}

function resetRows() {
    const rows = Array.from(subjects.querySelectorAll(".subject-group"));
    rows.forEach((row, index) => {
        if (index === 0) {
            row.querySelectorAll("input").forEach((input) => {
                input.value = "";
            });
            return;
        }
        row.remove();
    });
}

function loadTimetables() {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function prefillForEdit() {
    const editIdValue = localStorage.getItem(editKey);
    if (!editIdValue) return;

    const editId = Number(editIdValue);
    if (Number.isNaN(editId)) return;

    const timetables = loadTimetables();
    const timetable = timetables.find((item) => item.id === editId);
    if (!timetable) return;

    const titleInput = document.getElementById("title");
    if (titleInput) titleInput.value = timetable.title || "";

    const heading = document.querySelector("h1");
    if (heading) heading.textContent = "EDIT TIME TABLE";

    subjects.innerHTML = "";

    timetable.exams.forEach((exam, index) => {
        if (index === 0) {
            const row = document.createElement("div");
            row.className = "subject-group";
            row.dataset.required = "true";
            row.innerHTML = `
                <input type="text" name="subjects[]" placeholder="Subject" required>
                <input type="date" name="dates[]" required>
                <input type="time" name="times[]" required>
                <button type="button" class="remove-btn" aria-label="Remove subject">Remove</button>
            `;

            const inputs = row.querySelectorAll("input");
            if (inputs[0]) inputs[0].value = exam.subject || "";
            if (inputs[1]) inputs[1].value = exam.date || "";
            if (inputs[2]) inputs[2].value = exam.time || "";
            subjects.appendChild(row);
            return;
        }

        addRowWithValues(exam.subject || "", exam.date || "", exam.time || "");
    });
}

subjects.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-btn")) return;
    const row = e.target.closest(".subject-group");
    if (!row || row.dataset.required === "true") return;
    row.remove();
});

form.addEventListener("reset", () => {
    window.setTimeout(resetRows, 0);
});

addBtn.addEventListener("click", () => {
    addRow();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("title");
    const rows = Array.from(subjects.querySelectorAll(".subject-group"));
    const exams = [];

    for (const row of rows) {
        const inputs = row.querySelectorAll("input");
        const subject = inputs[0]?.value.trim() || "";
        const date = inputs[1]?.value || "";
        const time = inputs[2]?.value || "";
        const hasAny = subject || date || time;

        if (!hasAny && row.dataset.required !== "true") {
            row.remove();
            continue;
        }

        if (hasAny && (!subject || !date || !time)) {
            alert("Please fill Subject, Exam Date, and Time for each row.");
            return;
        }

        if (subject && date && time) {
            exams.push({ subject, date, time });
        }
    }

    if (!titleInput.value.trim()) {
        alert("Please fill the title.");
        return;
    }

    if (exams.length === 0) {
        alert("Please add at least one exam subject.");
        return;
    }

    const timetables = loadTimetables();
    const editIdValue = localStorage.getItem(editKey);
    const editId = Number(editIdValue);
    const nextTimetables = Number.isNaN(editId)
        ? timetables
        : timetables.filter((item) => item.id !== editId);
    const existing = timetables.find((item) => item.id === editId);

    nextTimetables.push({
        id: Number.isNaN(editId) ? Date.now() : editId,
        title: titleInput.value.trim(),
        exams,
        createdAt: existing?.createdAt || Date.now()
    });

    localStorage.setItem(storageKey, JSON.stringify(nextTimetables));
    localStorage.removeItem(editKey);
    window.location.href = "timetable.html";
});

prefillForEdit();
