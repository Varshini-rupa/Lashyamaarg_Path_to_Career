const express = require('express');
const router = express.Router();
const { chat, ragStatus } = require('./chatbotController');
const authMiddleware = require('../../middleware/auth');

router.post('/message', authMiddleware, chat);
router.get('/rag-status', authMiddleware, ragStatus);

module.exports = router;
