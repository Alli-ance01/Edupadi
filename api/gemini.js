// api/gemini.js
import fetch from "node-fetch";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Missing question" });
    }

    try {
        // Your Gemini API key stored in Vercel environment variables
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error("Gemini API key not set in environment variables");
        }

        // Call Gemini AI
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gemini-1.5",
                input: question
            })
        });

        const data = await response.json();

        // Gemini might return text in different fields; adjust if needed
        const answer = data.output_text || data.output?.[0]?.content?.[0]?.text || "No response";

        res.status(200).json({ answer });
    } catch (err) {
        console.error("Gemini API error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
}