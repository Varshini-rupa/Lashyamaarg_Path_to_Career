const express = require('express');
const router = express.Router();
const { getRoles, getDomains, getRoleById } = require('./jobMarketController');

// No auth required — public data
router.get('/roles', getRoles);
router.get('/domains', getDomains);
router.get('/roles/:id', getRoleById);

module.exports = router;
