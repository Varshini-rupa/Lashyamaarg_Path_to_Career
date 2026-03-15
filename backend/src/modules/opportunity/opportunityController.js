const pool = require('../../config/db');
const { GoogleGenAI } = require('@google/genai');

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Get opportunities from DB + optional AI-generated ones
const getOpportunities = async (req, res) => {
    try {
        const { domain, type } = req.query;

        let query = 'SELECT * FROM opportunities WHERE 1=1';
        const params = [];

        if (domain) {
            params.push(domain);
            query += ` AND LOWER(domain) LIKE LOWER($${params.length})`;
            params[params.length - 1] = '%' + domain + '%';
        }
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        query += ' ORDER BY deadline ASC';

        const result = await pool.query(query, params);
        const now = new Date();

        const opportunities = result.rows.map(opp => {
            const deadline = new Date(opp.deadline);
            const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return {
                ...opp,
                days_left: daysLeft > 0 ? daysLeft : 0,
                is_expired: daysLeft <= 0,
                deadline_display: deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            };
        });

        res.json({ success: true, opportunities, total: opportunities.length });
    } catch (err) {
        console.error('Opportunities error:', err);
        res.status(500).json({ success: false, message: 'Error fetching opportunities' });
    }
};

// Get single opportunity
const getOpportunityById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Opportunity not found' });
        }
        const opp = result.rows[0];
        const now = new Date();
        const deadline = new Date(opp.deadline);
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        res.json({
            success: true,
            opportunity: {
                ...opp,
                days_left: daysLeft > 0 ? daysLeft : 0,
                is_expired: daysLeft <= 0,
            },
        });
    } catch (err) {
        console.error('Opportunity by ID error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── AI-Powered: Fetch fresh opportunities via Gemini ──────────────
const getAIOpportunities = async (req, res) => {
    try {
        const { stream, education_level, type } = req.query;

        if (!ai) {
            return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
        }

        const typeFilter = type ? `Focus ONLY on "${type}" type opportunities.` : 'Include a mix of internships, hackathons, and scholarships.';

        const prompt = `You are an expert on Indian student opportunities — internships, hackathons, and scholarships.

Generate exactly 10 REAL and CURRENT opportunities for an Indian student with these details:
- Education Level: ${education_level || 'B.Tech'}
- Stream/Branch: ${stream || 'Computer Science'}

${typeFilter}

CRITICAL RULES:
1. Only include REAL opportunities that actually exist (from companies, government, or organizations that run these programs)
2. Include the REAL official website URL for registration (not made-up links)
3. Use realistic deadlines (assume current year 2026, upcoming months)
4. Include a mix of well-known national programs AND state-level/niche opportunities
5. For scholarships, include real government scholarship portals like scholarships.gov.in, NSP, AICTE
6. For hackathons, include real ones from Unstop, company-hosted, or government-hosted
7. For internships, include real company/org internship portals

Respond ONLY with valid JSON array. NO markdown, NO backticks, NO explanation. Just the raw JSON array.

Each object must have EXACTLY these fields:
{
  "title": "exact program name",
  "type": "internship" or "hackathon" or "scholarship",
  "domain": "technology" or "business" or "medical" or "law" or "design" or "general",
  "organizer": "company/org name",
  "description": "1-2 sentence description",
  "eligibility": "who can apply",
  "stipend": "amount or null",
  "prize": "prize amount or null",
  "deadline": "YYYY-MM-DD format",
  "registration_link": "real URL to apply"
}`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        let text = result.text.trim();

        // Clean up: remove markdown backticks if present
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

        let aiOpportunities;
        try {
            aiOpportunities = JSON.parse(text);
        } catch (parseErr) {
            console.error('AI response parse error:', parseErr.message);
            console.error('Raw AI text:', text.substring(0, 500));
            return res.status(500).json({ success: false, message: 'AI generated invalid response, try again' });
        }

        // Format them like DB opportunities
        const now = new Date();
        const formatted = aiOpportunities.map((opp, i) => {
            const deadline = new Date(opp.deadline);
            const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return {
                id: 10000 + i,
                ...opp,
                days_left: daysLeft > 0 ? daysLeft : 0,
                is_expired: daysLeft <= 0,
                deadline_display: deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                ai_generated: true,
            };
        });

        console.log(`🤖 AI generated ${formatted.length} opportunities for ${stream || 'general'} (${education_level || 'B.Tech'})`);

        res.json({ success: true, opportunities: formatted, total: formatted.length, ai_generated: true });
    } catch (err) {
        console.error('AI Opportunities error:', err);
        res.status(500).json({ success: false, message: 'Error fetching AI opportunities' });
    }
};

module.exports = { getOpportunities, getOpportunityById, getAIOpportunities };
