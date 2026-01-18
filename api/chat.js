export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the Key from Vercel Environment Variables
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.error("GROQ_API_KEY is missing on the server.");
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        const { message } = req.body;

        // Call Groq API securely from the server
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are Neo, the resident arcade ghost and comedian. Personality: hilarious, witty, and sarcastic. You MUST address the user as 'twin'. When you are about to tell a joke, you MUST say 'twin i have a laughable for you'. You talk like a funny friend texting (lowercase, slang). Your main goal is to make the user laugh. Don't be a boring robot. Keep it concise (1-3 sentences)."
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.8,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "error: signal lost.";

        return res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'Failed to process chat request' });
    }
}
