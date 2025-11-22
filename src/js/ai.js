// src/ai.js

export async function getAiSolution(question) {
    const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "AI request failed");
    }

    const data = await response.json();
    return data.answer;
}