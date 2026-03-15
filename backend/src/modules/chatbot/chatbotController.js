const knowledgeBase = require('./knowledgeBase');
const { GoogleGenAI } = require('@google/genai');
const pool = require('../../config/db');
const { searchSimilar, getStats } = require('./ragPipeline');

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const chat = async (req, res) => {
    try {
        const { message, language = 'en', parent_mode = false } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const lang = language === 'te' ? 'te' : 'en';
        const kb = knowledgeBase[lang];

        // Fetch User Context
        let userContext = "No prior assessment data found.";
        if (req.user && req.user.id) {
            try {
                const userResult = await pool.query('SELECT name, education_level, stream FROM users WHERE id = $1', [req.user.id]);
                const assessmentResult = await pool.query('SELECT scores, top_domain FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.user.id]);
                if (userResult.rows.length > 0) {
                    const u = userResult.rows[0];
                    const a = assessmentResult.rows[0];
                    userContext = `User Name: ${u.name}\nEducation: ${u.education_level} (Stream: ${u.stream})`;
                    if (a) {
                        userContext += `\nRecommended Domain: ${a.top_domain}\nPsychometric Scores: ${a.scores}`;
                    }
                }
            } catch (err) {
                console.error("Error fetching context:", err);
            }
        }

        // ─── RAG Pipeline: Retrieve relevant chunks ───────────────
        let ragContext = '';
        let ragSources = [];
        let ragUsed = false;

        try {
            // Step 1: Embed the query and search for similar chunks
            const ragResults = await searchSimilar(message, 5, 0.3);

            if (ragResults.length > 0) {
                ragUsed = true;

                // Step 2: Build context from retrieved chunks
                ragContext = ragResults
                    .map((r, i) => `[Source: ${r.source}] (Relevance: ${(r.score * 100).toFixed(1)}%)\n${r.chunk}`)
                    .join('\n\n');

                // Collect unique sources for attribution
                ragSources = [...new Set(ragResults.map(r => r.source))];

                console.log(`🔍 RAG Retrieved ${ragResults.length} chunks from: ${ragSources.join(', ')} (top score: ${(ragResults[0].score * 100).toFixed(1)}%)`);
            } else {
                console.log('🔍 RAG: No relevant chunks found above threshold');
            }
        } catch (ragErr) {
            console.error('RAG search error (falling back to knowledge base):', ragErr.message);
        }

        // ─── LLM Generation with RAG context ─────────────────────
        if (ai) {
            try {
                // Build knowledge context — RAG chunks + fallback to knowledge base
                let context = '';
                if (ragUsed && ragContext) {
                    context = ragContext;
                } else {
                    // Fallback: use original knowledge base (keyword-based)
                    context = kb.topics.map(t => t.response).join('\n\n');
                }

                let prompt = `You are LakshyaBot, an expert AI career intelligence guide designed for Indian students.
You must base your answer primarily on the following RETRIEVED KNOWLEDGE CONTEXT. These are the most relevant passages from our knowledge base, retrieved using RAG (Retrieval-Augmented Generation) with cosine similarity matching.

=== RETRIEVED KNOWLEDGE CONTEXT ===
${context}
===================================

=== USER PROFILE ===
${userContext}
====================

User's language preference: ${lang === 'te' ? 'Telugu' : 'English'}
Parent Mode Active: ${parent_mode ? 'Yes. You MUST explain the career, its financial stability, respectability, and benefits formally to convince traditional Indian parents.' : 'No. Speak directly to the student in a friendly, encouraging way.'}

Important Rules:
1. Base your answer on the retrieved context above. If the context covers the topic, use that information.
2. If the context doesn't cover the query, use your general knowledge but mention that.
3. Keep the response formatted using Markdown (with bold, lists, and emojis).
4. Personalize your response using the User Profile if relevant.
5. Do NOT mention "context" or "RAG" or "retrieved" — just answer naturally.
${ragUsed ? `6. The context came from these sources: ${ragSources.join(', ')}. You may reference the topic area naturally (e.g., "Based on scholarship information..." or "According to engineering career data...").` : ''}

User Message: "${message}"`;

                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt,
                });

                return res.json({
                    success: true,
                    response: response.text,
                    language: lang,
                    parent_mode,
                    rag: ragUsed,
                    rag_sources: ragSources,
                    rag_chunks_used: ragUsed ? ragContext.split('\n\n').length : 0,
                });
            } catch (llmError) {
                console.error("LLM Generation Failed, falling back to keyword logic:", llmError);
            }
        }

        // ─── Fallback: Local Keyword Matching ────────────────────
        const lowerMsg = message.toLowerCase().replace(/[\s,]/g, '');

        const greetWords = ['hi', 'hello', 'hey', 'namaskaram', 'namaste', 'helo', 'vanakkam'];
        if (greetWords.some(g => lowerMsg.includes(g))) {
            return res.json({ success: true, response: kb.greetings[0], language: lang, rag: false });
        }

        let matched = null;
        for (const topic of kb.topics) {
            if (topic.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
                matched = topic;
                break;
            }
        }

        let responseText = matched ? matched.response : kb.fallback;

        if (parent_mode && matched) {
            const domain = detectDomain(matched.keywords[0]);
            responseText = knowledgeBase.parent.intro(domain) + responseText + knowledgeBase.parent.suffix;
        }

        return res.json({ success: true, response: responseText, language: lang, parent_mode, rag: false });
    } catch (err) {
        console.error('Chatbot error:', err);
        res.status(500).json({ success: false, message: 'Chatbot error' });
    }
};

// ─── RAG Stats endpoint ─────────────────────────────────────────────
const ragStatus = async (req, res) => {
    try {
        const stats = getStats();
        res.json({ success: true, ...stats });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error getting RAG stats' });
    }
};

const detectDomain = (keyword) => {
    const map = {
        ai: 'AI/ML Engineering',
        engineering: 'Engineering',
        btech: 'B.Tech',
        mbbs: 'Medicine',
        doctor: 'Medicine',
        neet: 'Medical (NEET)',
        law: 'Law',
        clat: 'Law',
        business: 'Business / MBA',
        mba: 'MBA',
        bba: 'BBA / Business',
        design: 'Multimedia & Design',
        creative: 'Creative Design',
        tech: 'Technology',
        software: 'Software Engineering',
    };
    return map[keyword] || 'your chosen career';
};

module.exports = { chat, ragStatus };
