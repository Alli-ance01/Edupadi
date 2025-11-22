import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { initUI } from "./ui.js";

export async function login(email) {
    const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) throw error;

    alert("Check your email for login link");
}

export async function loadUser() {
    const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    let { data } = await supabase.auth.getUser();

    if (!data?.user) return false;

    state.userEmail = data.user.email;

    await loadUserData();
    initUI();

    return true;
}

export async function loadUserData() {
    const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    let { data } = await supabase
        .from("users")
        .select("*")
        .eq("email", state.userEmail)
        .single();

    if (!data) return;

    state.isPremium = data.is_premium;
    state.premiumExpiry = data.premium_expiry;
    state.questionsToday = data.questions_today || 0;
    state.history = data.history || [];
}