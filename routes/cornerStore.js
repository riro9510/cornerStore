const express = require('express');
const router = express.Router();  
const {setItem,GeAllItems,editItemById,deleteItemById,createCart,getAllCartItems,editCart,deleteCart,completePurchase} = require('../cornerStore.js');
const passport = require('passport');
const {isAuthenticated} = require("../middleware/authentificate.js");
router.get('/items/',GeAllItems);
router.post("/items/",isAuthenticated,setItem);
router.put("/items/:id",isAuthenticated,editItemById);
router.delete("/items/:id",isAuthenticated,deleteItemById);

router.get('/cart/',getAllCartItems);
router.post("/cart/",isAuthenticated,createCart);
router.put("/cart/:id",isAuthenticated,editCart);
router.delete("/cart/:id",isAuthenticated,deleteCart);
router.put("/cart/CompletePurchase/:id",isAuthenticated,completePurchase);

router.get("/login",passport.authenticate('github'),(req,res)=>{});

router.get("/logout",function(req,res,next){
    req.logOut(function(err){
        if(err){ return next(err);}
        res.redirect("/cornerStore");
    })
})

module.exports = router;