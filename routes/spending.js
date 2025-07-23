const express = require('express');
const router = express.Router();
const spendingController = require('../controllers/spendingController');

router.post('/', spendingController.addSpending);
router.put('/:id', spendingController.editSpending);
router.delete('/:id', spendingController.deleteSpending);
router.get('/history', spendingController.getHistory);

module.exports = router; 