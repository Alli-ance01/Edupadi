// src/auth.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { user } from "./state.js";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signIn() {
    const email = document.getElementById("authEmail").value;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return alert(error.message);
    document.getElementById("sentEmailDisplay").textContent = email;
    document.getElementById("emailLoginStep").style.display = "none";
    document.getElementById("emailSentStep").style.display = "block";
}

export function resetAuthModal() {
    document.getElementById("emailLoginStep").style.display = "block";
    document.getElementById("emailSentStep").style.display = "none";
}

export function logout() {
    user = null;
    location.reload();
}