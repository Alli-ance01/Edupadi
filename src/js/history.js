import { state } from "./state.js";

export function addHistory(question, solution) {
    state.history.unshift({
        question,
        solution,
        date: new Date().toISOString(),
    });
}

export function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (!state.history.length) {
        list.innerHTML = `<p>No history yet.</p>`;
        return;
    }

    state.history.forEach((h) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div class="history-date">${new Date(h.date).toLocaleString()}</div>
            <div class="history-question">${h.question}</div>
            <div class="history-solution">${h.solution}</div>
        `;
        list.appendChild(div);
    });
}