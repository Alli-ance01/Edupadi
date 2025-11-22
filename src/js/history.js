// src/history.js

import { state } from "./state.js";

export function saveQuestion(item) {
    state.history.push(item);
    localStorage.setItem("eduHistory", JSON.stringify(state.history));
}

export async function getHistory() {
    const stored = localStorage.getItem("eduHistory");
    return stored ? JSON.parse(stored) : [];
}