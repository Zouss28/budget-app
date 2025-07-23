require('dotenv').config();
const express = require('express');
const cors = require('cors');
const next = require('next');
const path = require('path');
// Detect environment
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev: false });
const handle = nextApp.getRequestHandler();
// Route imports
const budgetRoutes = require('./routes/budget');
const spendingRoutes = require('./routes/spending');
const wishlistRoutes = require('./routes/wishlist');
const { fundWishlistInternal } = require('./controllers/wishlistController');

function getYesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function wasFundedForDate(dateStr) {
  // For simplicity, check if any wishlist item was updated today (could be improved with a funding log)
  const wishlist = require('./models/dataModel').readData('wishlist') || [];
  return wishlist.some(item => item.lastFundedDate === dateStr);
}

function markFundedForToday() {
  const today = new Date().toISOString().split('T')[0];
  const wishlist = require('./models/dataModel').readData('wishlist') || [];
  for (let item of wishlist) {
    item.lastFundedDate = today;
  }
  require('./models/dataModel').writeData('wishlist', wishlist);
}

// On startup, check if yesterday's funding was missed
(function checkMissedFunding() {
  const yesterday = getYesterdayDateStr();
  if (!wasFundedForDate(yesterday)) {
    const result = fundWishlistInternal();
    if (result.funded) {
      markFundedForToday();
      console.log(`[FUNDING] Missed funding for ${yesterday} processed on startup.`);
    }
  }
})();

nextApp.prepare().then(() => {
  const app = express();

  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());

  app.use('/budget', budgetRoutes);
  app.use('/spending', spendingRoutes);
  app.use('/wishlist', wishlistRoutes);

  app.all('*splat', (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  }); 
})