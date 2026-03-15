const pool = require('../../config/db');

// Submit V2 assessment answers
const submitAssessmentV2 = async (req, res) => {
    try {
        const {
            answers,
            riasecScores,
            hollandCode,
            bigFiveScores,
            topStrengths,
            recommendedTags
        } = req.body;

        if (!answers || !hollandCode) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        const userId = req.user.id;

        // Insert result into V2 table
        await pool.query(
            `INSERT INTO psychometric_results_v2 
             (user_id, answers, riasec_scores, holland_code, big_five_scores, top_strengths, recommended_tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId,
                JSON.stringify(answers),
                JSON.stringify(riasecScores),
                hollandCode,
                JSON.stringify(bigFiveScores),
                JSON.stringify(topStrengths),
                JSON.stringify(recommendedTags)
            ]
        );

        // Update User Profile
        await pool.query(
            `UPDATE users SET
             psychometric_completed = 1,
             holland_code = $1,
             recommended_tags = $2
             WHERE id = $3`,
            [hollandCode, JSON.stringify(recommendedTags), userId]
        );

        res.json({
            success: true,
            message: 'Results saved successfully'
        });
    } catch (err) {
        console.error('Assessment V2 submit error:', err);
        res.status(500).json({ success: false, message: 'Server error during assessment saving' });
    }
};

module.exports = { submitAssessmentV2 };
