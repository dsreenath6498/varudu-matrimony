import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../db'; // We import your database connection!

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/message', async (req, res) => {
    try {
        const { message, history } = req.body;

        // 1. The Magic Prompt: We teach it how to trigger a search
        const systemPrompt = `You are a premium AI Matchmaker for Varudu Matrimony. 
        You understand English, Telugu, and Tanglish.
        
        CRITICAL INSTRUCTION: If the user asks to find, search, or show profiles (e.g., "Find me brides in Hyderabad", "I want a groom from Vijayawada"), you MUST NOT reply normally. You must reply ONLY with a JSON object like this:
        {"action": "SEARCH", "place": "Hyderabad", "gender": "Female"}
        
        If they just say "Hi" or ask a general question, reply normally in their language. Keep it short.`;

        const chatContents = history
            ? history.map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
            : [];

        chatContents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatContents,
            config: { systemInstruction: systemPrompt }
        });

        const replyText = response.text || '';

        // 2. We intercept the AI's response. Did it give us the secret JSON?
        if (replyText.includes('"action": "SEARCH"')) {
            try {
                // Clean up the string just in case Gemini added markdown code blocks
                const cleanJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
                const searchParams = JSON.parse(cleanJson);

                const db = getDb();

                // 3. Build the SQL Query dynamically based on what the AI extracted!
                let query = "SELECT id, name, age, place, gender, photos FROM users WHERE 1=1";
                let queryParams: any[] = [];
                let paramIndex = 1;

                if (searchParams.place) {
                    query += ` AND place ILIKE $${paramIndex}`;
                    queryParams.push(`%${searchParams.place}%`);
                    paramIndex++;
                }
                if (searchParams.gender) {
                    query += ` AND gender = $${paramIndex}`;
                    queryParams.push(searchParams.gender);
                    paramIndex++;
                }

                query += " LIMIT 5";

                // 4. Execute the query
                const profiles = await db.all(query, queryParams);

                // 5. Send a special response to the frontend containing the array of profiles!
                return res.json({
                    reply: `Here are some ${searchParams.gender || ''} profiles I found in ${searchParams.place || 'our database'}:`,
                    profiles: profiles
                });

            } catch (e) {
                console.error("Search parsing error", e);
                return res.json({ reply: "I tried searching but ran into a tiny issue. Could you ask differently?" });
            }
        }

        // If no search was needed, just reply normally
        res.json({ reply: replyText });

    } catch (error) {
        console.error('Error talking to Gemini:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
