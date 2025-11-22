// src/main.js

import { getAiSolution } from "./ai.js";
import { saveQuestion, getHistory } from "./history.js";
import { showSolution, updateQuestionsCount, showError } from "./ui.js";
import { isPremiumUser, getDailyLimit } from "./premium.js";
import { state } from "./state.js";

const submitBtn = document.getElementById("submitBtn");
const questionInput = document.getElementById("questionInput");

// Main submit handler
export async function submitQuestion() {
    const question = questionInput.value.trim();
    if (!question) {
        showError("Please enter a question.");
        return;
    }

    // Check free plan limits
    if (!isPremiumUser() && state.questionsToday >= getDailyLimit()) {
        showError("Free plan limit reached. Upgrade to premium for unlimited questions.");
        return;
    }

    // Disable button while fetching
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Generating...";

    try {
        // Call Gemini proxy API
        const answer = await getAiSolution(question);

        // Show AI solution
        showSolution(answer);

        // Save to history & state
        saveQuestion({ question, answer, date: new Date().toISOString() });
        state.questionsToday += 1;
        updateQuestionsCount(state.questionsToday);

        // Clear input
        questionInput.value = "";
    } catch (err) {
        console.error(err);
        showError("Failed to get AI solution. Try again later.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "🚀 Get AI Solution";
    }
}

// Initialize app
export function initApp() {
    // Load history
    getHistory().then(historyItems => {
        state.history = historyItems;
        // Optionally render history UI here
    });

    // Update today's questions count
    updateQuestionsCount(state.questionsToday);

    // Attach enter key listener for textarea
    questionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitQuestion();
        }
    });
}

// Start the app
initApp();