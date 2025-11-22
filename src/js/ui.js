import { state } from "./state.js";

export function initUI() {
    document.getElementById("homePage").style.display = "block";
    document.getElementById("authPage").style.display = "none";

    document.getElementById("emailDisplay").textContent = state.userEmail;
    document.getElementById("questionsLeft").textContent =
        state.isPremium ? "∞" : 5 - state.questionsToday;
}