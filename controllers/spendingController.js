const { readData, writeData } = require('../models/dataModel');
const { v4: uuidv4 } = require('uuid');

function addSpending(req, res) {
  // TODO: Validate input
  const { amount, date } = req.body;
  if (typeof amount !== 'number' || amount <= 0 || !date) {
    return res.status(400).json({ error: 'Invalid spending entry' });
  }
  const spendingData = readData('spending') || [];
  const entry = { id: uuidv4(), amount, date };
  spendingData.push(entry);
  writeData('spending', spendingData);
  res.json({ message: 'Spending added', entry });
}

function editSpending(req, res) {
  const { id } = req.params;
  const { amount, date } = req.body;
  let spendingData = readData('spending') || [];
  const idx = spendingData.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
  if (amount !== undefined) spendingData[idx].amount = amount;
  if (date !== undefined) spendingData[idx].date = date;
  writeData('spending', spendingData);
  res.json({ message: 'Spending updated', entry: spendingData[idx] });
}

function deleteSpending(req, res) {
  const { id } = req.params;
  let spendingData = readData('spending') || [];
  const idx = spendingData.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
  const [removed] = spendingData.splice(idx, 1);
  writeData('spending', spendingData);
  res.json({ message: 'Spending deleted', entry: removed });
}

function getHistory(req, res) {
  const spendingData = readData('spending') || [];
  res.json({ history: spendingData });
}

module.exports = { addSpending, editSpending, deleteSpending, getHistory }; 