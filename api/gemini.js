// /api/gemini.js
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Your Gemini API key from Vercel environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("GEMINI_API_KEY is missing!");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    const response = await fetch("https://api.gemini.ai/endpoint", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model: "gemini-1.5", // or your chosen model
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini API error:", text);
      return res.status(500).json({ error: "AI request failed" });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
        }
        // Gemini might return text in different fields; adjust if needed
        const answer = data.output_text || data.output?.[0]?.content?.[0]?.text || "No response";

        res.status(200).json({ answer });
    } catch (err) {
        console.error("Gemini API error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
}
