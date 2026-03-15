const express = require('express');
const router = express.Router();
const { getQuestions, submitAssessment } = require('./psychometricController');
const { submitAssessmentV2 } = require('./psychometricV2Controller');
const authMiddleware = require('../../middleware/auth');

router.get('/questions', getQuestions);
router.post('/submit', authMiddleware, submitAssessment);
router.post('/submit-v2', authMiddleware, submitAssessmentV2);

module.exports = router;
