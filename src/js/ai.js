import { CONFIG } from "./config.js";

export async function generateSolution(question) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: question }] }],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7
                }
            }),
        }
    );

    const data = await response.json();

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("AI failed");
    }

    return data.candidates[0].content.parts[0].text.trim();
}