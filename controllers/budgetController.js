const { readData, writeData } = require('../models/dataModel');

function setBudget(req, res) {
  // TODO: Validate input
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid budget amount' });
  }
  // TODO: Implement logic to adjust budget and recalculate allowances
  const budgetData = readData('budget') || {};
  budgetData.amount = amount;
  budgetData.updatedAt = new Date().toISOString();
  // TODO: Recalculate daily allowance and adjust for overspending
  writeData('budget', budgetData);
  res.json({ message: 'Budget set', budget: budgetData });
}

function getBudget(req, res) {
  const budgetData = readData('budget') || { amount: 0 };
  // TODO: Calculate remaining allowance, total spent, remaining budget
  res.json({ budget: budgetData });
}

module.exports = { setBudget, getBudget }; 