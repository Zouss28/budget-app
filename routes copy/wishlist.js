const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.post('/', wishlistController.addWishlistItem);
router.put('/:id', wishlistController.editWishlistItem);
router.delete('/:id', wishlistController.deleteWishlistItem);
router.get('/', wishlistController.getWishlist);
router.post('/fund', wishlistController.fundWishlist);

module.exports = router; 