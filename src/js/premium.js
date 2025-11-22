import { CONFIG } from "./config.js";
import { state } from "./state.js";

export function upgrade() {
    FlutterwaveCheckout({
        public_key: CONFIG.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: "edupadi_" + Date.now(),
        amount: CONFIG.PREMIUM_PRICE,
        currency: "NGN",
        customer: { email: state.userEmail },
        callback: (d) => {
            if (d.status === "successful") {
                state.isPremium = true;
                alert("Premium activated!");
            } else {
                alert("Payment failed.");
            }
        }
    });
}