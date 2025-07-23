const { readData, writeData } = require('../models/dataModel');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

function logFundingEvent(message) {
  console.log(`[FUNDING] ${new Date().toISOString()} - ${message}`);
}

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getDailyAllowance() {
  const budget = readData('budget') || { amount: 0 };
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return budget.amount / daysInMonth;
}

function getTotalSpentToday() {
  const spending = readData('spending') || [];
  const today = getTodayDateStr();
  return spending.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
}

function fundWishlistInternal() {
  const wishlist = readData('wishlist') || [];
  if (!wishlist.length) {
    logFundingEvent('No wishlist items to fund.');
    return { funded: false, message: 'No wishlist items.' };
  }
  const dailyAllowance = getDailyAllowance();
  const totalSpent = getTotalSpentToday();
  const leftover = dailyAllowance - totalSpent;
  if (leftover <= 0) {
    logFundingEvent('No leftover to allocate.');
    return { funded: false, message: 'No leftover to allocate.' };
  }
  // Only consider items not fully funded
  let activeItems = wishlist.filter(item => (item.funded || 0) < item.targetPrice);
  if (!activeItems.length) {
    logFundingEvent('All wishlist items fully funded.');
    return { funded: false, message: 'All wishlist items fully funded.' };
  }
  // Calculate total allocation ratio for active items
  let totalRatio = activeItems.reduce((sum, item) => sum + (item.allocationRatio || 0), 0);
  if (totalRatio === 0) {
    logFundingEvent('No allocation ratios set for wishlist items.');
    return { funded: false, message: 'No allocation ratios set.' };
  }
  // Distribute leftover
  let allocations = [];
  let remaining = leftover;
  let itemsToFund = [...activeItems];
  let loopGuard = 0;
  while (remaining > 0.01 && itemsToFund.length && loopGuard < 10) {
    loopGuard++;
    let distributed = 0;
    let newlyFundedIds = [];
    for (let item of itemsToFund) {
      const ratio = item.allocationRatio / totalRatio;
      let toAdd = remaining * ratio;
      const needed = item.targetPrice - (item.funded || 0);
      if (toAdd > needed) {
        toAdd = needed;
        newlyFundedIds.push(item.id);
      }
      item.funded = (item.funded || 0) + toAdd;
      allocations.push({ itemId: item.id, name: item.name, amount: toAdd });
      distributed += toAdd;
    }
    remaining -= distributed;
    // Remove newly funded items and recalc totalRatio
    itemsToFund = itemsToFund.filter(item => !newlyFundedIds.includes(item.id));
    totalRatio = itemsToFund.reduce((sum, item) => sum + (item.allocationRatio || 0), 0);
    if (totalRatio === 0) break;
  }
  // Persist changes
  for (let item of wishlist) {
    const updated = activeItems.find(i => i.id === item.id);
    if (updated) item.funded = updated.funded;
  }
  writeData('wishlist', wishlist);
  logFundingEvent(`Distributed ${leftover.toFixed(2)} to wishlist items: ` + allocations.map(a => `${a.name}: ${a.amount.toFixed(2)}`).join(', '));
  return { funded: true, leftover, allocations };
}

function fundWishlist(req, res) {
  const result = fundWishlistInternal();
  if (result.funded) {
    res.json({ message: 'Wishlist funded', leftover: result.leftover, allocations: result.allocations });
  } else {
    res.status(400).json({ message: result.message });
  }
}

function addWishlistItem(req, res) {
  const { name, targetPrice, allocationRatio } = req.body;
  if (!name || typeof targetPrice !== 'number' || targetPrice <= 0 || typeof allocationRatio !== 'number' || allocationRatio < 0) {
    return res.status(400).json({ error: 'Invalid wishlist item' });
  }
  const wishlist = readData('wishlist') || [];
  const item = { id: uuidv4(), name, targetPrice, allocationRatio, funded: 0 };
  wishlist.push(item);
  writeData('wishlist', wishlist);
  res.json({ message: 'Wishlist item added', item });
}

function editWishlistItem(req, res) {
  const { id } = req.params;
  const { name, targetPrice, allocationRatio, funded } = req.body;
  let wishlist = readData('wishlist') || [];
  const idx = wishlist.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  if (name !== undefined) wishlist[idx].name = name;
  if (targetPrice !== undefined) wishlist[idx].targetPrice = targetPrice;
  if (allocationRatio !== undefined) wishlist[idx].allocationRatio = allocationRatio;
  if (funded !== undefined) wishlist[idx].funded = funded;
  writeData('wishlist', wishlist);
  res.json({ message: 'Wishlist item updated', item: wishlist[idx] });
}

function deleteWishlistItem(req, res) {
  const { id } = req.params;
  let wishlist = readData('wishlist') || [];
  const idx = wishlist.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const [removed] = wishlist.splice(idx, 1);
  writeData('wishlist', wishlist);
  res.json({ message: 'Wishlist item deleted', item: removed });
}

function getWishlist(req, res) {
  const wishlist = readData('wishlist') || [];
  // TODO: Calculate funding progress for each item
  res.json({ wishlist });
}

module.exports = { addWishlistItem, editWishlistItem, deleteWishlistItem, getWishlist, fundWishlist, fundWishlistInternal }; 