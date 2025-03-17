const express = require('express');
const router = express.Router();  
const {setItem,GeAllItems,editItemById,deleteItemById,createCart,getAllCartItems,editCart,deleteCart,completePurchase} = require('../cornerStore.js');

router.get('/items/',GeAllItems);
router.post("/items/",setItem);
router.put("/items/:id",editItemById);
router.delete("/items/:id",deleteItemById);

router.get('/cart/',getAllCartItems);
router.post("/cart/",createCart);
router.put("/cart/:id",editCart);
router.delete("/cart/:id",deleteCart);
router.put("/cart/CompletePurchase/:id",completePurchase)
module.exports = router;