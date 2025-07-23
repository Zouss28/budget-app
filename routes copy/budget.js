const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

router.post('/', budgetController.setBudget);
router.get('/', budgetController.getBudget);

module.exports = router; 