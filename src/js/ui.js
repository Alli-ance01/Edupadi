// src/ui.js

export function showSolution(answer) {
    const solutionBox = document.getElementById("solutionBox");
    const solutionText = document.getElementById("solutionText");

    solutionText.textContent = answer;
    solutionBox.style.display = "block";
}

export function updateQuestionsCount(count) {
    const countEl = document.getElementById("questionsCount");
    countEl.textContent = `${count}/3`;
}

export function showError(msg) {
    alert(msg); // simple for now; can make fancier toast later
}