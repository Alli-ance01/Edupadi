// src/premium.js

import { state } from "./state.js";

export function isPremiumUser() {
    return state.isPremium;
}

export function getDailyLimit() {
    return 3; // Free plan daily limit
}