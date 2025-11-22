// src/ui.js

const submitBtn = document.getElementById("submitBtn");
const solutionBox = document.getElementById("solutionBox");
const solutionText = document.getElementById("solutionText");

/**
 * Shows the AI solution in the UI
 * @param {string} answer - The answer from AI
 */
export function showSolution(answer) {
  if (!solutionBox || !solutionText) return;
  solutionText.textContent = answer;
  solutionBox.style.display = "block";
  submitBtn.disabled = false;
  submitBtn.innerHTML = "🚀 Get AI Solution";
}

/**
 * Shows a loading state while AI is generating answer
 */
export function showLoading() {
  submitBtn.disabled = true;
  submitBtn.innerHTML = "⏳ Generating...";
  solutionBox.style.display = "none";
}

/**
 * Hides loading state (if needed)
 */
export function hideLoading() {
  submitBtn.disabled = false;
  submitBtn.innerHTML = "🚀 Get AI Solution";
}

/**
 * Toggles the mobile menu dropdown
 */
export function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  if (!menu) return;
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/**
 * Shows a specific page: 'home' or 'history'
 * @param {string} pageId
 */
export function showPage(pageId) {
  const pages = ["homePage", "historyPage"];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === pageId + "Page" ? "block" : "none";
  });

  // Close menu if open
  const menu = document.getElementById("menuDropdown");
  if (menu) menu.style.display = "none";
}

/**
 * Resets the authentication modal to the first step
 */
export function resetAuthModal() {
  const emailStep = document.getElementById("emailLoginStep");
  const sentStep = document.getElementById("emailSentStep");
  if (emailStep) emailStep.style.display = "block";
  if (sentStep) sentStep.style.display = "none";
  const emailInput = document.getElementById("authEmail");
  if (emailInput) emailInput.value = "";
}

/**
 * Share app via native share or fallback
 */
export function shareApp() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: "EduPadi - AI Homework Helper", url });
  } else {
    prompt("Copy this link to share:", url);
  }
}