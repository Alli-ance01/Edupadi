// src/ai.js

import { showSolution, showLoading, hideLoading } from "./ui.js";
import { saveToHistory } from "./history.js";
import { incrementQuestionCount, isPremiumUser } from "./state.js";

export async function submitQuestion(question) {
  if (!question || question.trim() === "") {
    alert("Please enter a question!");
    return;
  }

  showLoading();

  try {
    // Call your Vercel serverless function
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    // Check if the API returned an error
    if (data.error) {
      throw new Error(data.error);
    }

    // Get answer from the API response
    const answer = data.answer || data.text || "Sorry, no answer received.";

    // Show the AI solution on UI
    showSolution(answer);

    // Save question & answer to history (local storage or Supabase)
    saveToHistory({ question, answer });

    // Increment the daily question counter (if user is free)
    if (!isPremiumUser()) {
      incrementQuestionCount();
    }

  } catch (err) {
    console.error("AI fetch error:", err);
    showSolution("⚠️ Error getting answer. Please try again.");
  } finally {
    hideLoading();
  }
}