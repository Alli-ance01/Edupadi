import { loadUser } from "./auth.js";
import { generateSolution } from "./ai.js";
import { addHistory, renderHistory } from "./history.js";
import { state } from "./state.js";
import { initUI } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
    let loggedIn = await loadUser();

    if (!loggedIn) {
        document.getElementById("authPage").style.display = "block";
    }

    document.getElementById("submitBtn").addEventListener("click", onSubmit);
});

async function onSubmit() {
    const question = document.getElementById("questionInput").value.trim();
    if (!question) return alert("Enter a question");

    const solution = await generateSolution(question);

    document.getElementById("solutionText").textContent = solution;
    document.getElementById("solutionBox").style.display = "block";

    addHistory(question, solution);
    renderHistory();

    state.questionsToday++;
    initUI();
}