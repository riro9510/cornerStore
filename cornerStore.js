const mongoDb = require('./db/connect');
const ObjectId = require("mongodb").ObjectId;
const Joi = require('joi');

const errorCode = (error, res) => {
    console.log("Error",error)
    if (error.name === 'MongoNetworkError') {    
        res.status(503).send('Error in connection to database'); 
    } else if (error.name === 'MongoServerError') {
        res.status(500).send('Internal Error'); 
    } else {    
        res.status(400).send('Bad Request'); 
    }
};
const itemSchema = Joi.object({
    nameItem: Joi.string().required(),  
    price: Joi.number().positive().required(),
    numberItems: Joi.number().integer().positive().required() 
});
const cartItemSchema = Joi.object({
        idItem: Joi.string().required(),  
        numberItems: Joi.number().integer().positive().required() 
});
const listCartSchema = Joi.array().items(cartItemSchema);
const setItem = async (req, res, next) => {
    const { error } = itemSchema.validate(req.body);
    
    if (error) {
        return res.status(400).send(`Validation Error: ${error.details[0].message}`);
    }

    
    try {
        const result = await mongoDb.getDb().collection('items').insertOne(req.body);
        if (result.acknowledged) {  
            res.status(201).send('Item succesfully added to the Db');  
        } else {
            res.status(400).send('Item creation failed');
        }
    } catch (error) {
        errorCode(error, res);
    }
};
const GeAllItems = async(req,res,next)=>{
    try{
    const result = await mongoDb.getDb().collection('items').find().toArray();
    if(result.length == 0 ){
        res.status(200).json({"Message":"There´s no items in this store yet"});
    }else{
        res.status(200).json(result);
    }
    }catch(error){
     errorCode(error,res)   
    }
};
const editItemById = async(req,res,next)=>{
    const itemId = new ObjectId(req.params.id);
    try{
        const { error } = itemSchema.validate(req.body);
        if (error) {
            return res.status(400).send(`Validation Error: ${error.details[0].message}`);
        } 
        
    const result = await mongoDb.getDb().collection('items').updateOne({ _id: itemId },{ $set: req.body });  
    if (result.modifiedCount > 0) {  
        res.status(200).send(`Item ${item.nameItem} successfully updated in the Db`);  
    } else {
        res.status(400).send('Item updated failed');
    }
    }catch(error){
    errorCode(error,res)
    }
};
const deleteItemById = async(req,res,next)=>{
    const itemId = new ObjectId(req.params.id);
    try{
    const result = await mongoDb.getDb().collection('items').deleteOne({ _id: itemId } );
    if (result.deletedCount > 0) {  
        res.status(200).send(`Deleted of item ${itemId} succesful`);  
    } else {
        res.status(400).send('There was an error deleting the item.');
    }
    }catch(error){
    errorCode(error,res)
    }
};
const createCart = async(req,res,next)=>{
    try{
        const {error} = listCartSchema.validate(req.body);
        if(error){
            return res.status(400).send(`Validation Error: ${error.details[0].message}`);
        }
        const result = await mongoDb.getDb().collection('purchases').insertOne({ cartItems: req.body });;
        if (result.acknowledged) {  
            res.status(201).send('Items successfully added to the Cart');  
        } else {
            res.status(400).send('Items creation failed');
        }
    }catch(error){
    errorCode(error,res)
    }
};
const getAllCartItems = async(req,res,next)=>{
    try{
        const result = await  mongoDb.getDb().collection('purchases').find().toArray();
        console.log("resp cart",result);
        if(result.length == 0 ){
            res.status(200).json({"Message":"There´s no items in this cart yet. Let´s add some..."});
        }else{
            res.status(200).json(result);
        }
    }catch(error){
    errorCode(error,res)
    }
};
const editCart = async(req,res,next)=>{
    cartId =  new ObjectId(req.params.id);
    try{
        const {error} = listCartSchema.validate(req.body);
        if(error){
            return res.status(400).send(`Validation Error: ${error.details[0].message}`);
        }
        const result = await mongoDb.getDb().collection('purchases').updateOne({ _id: cartId },  
            { $set: { cartItems: req.body } } );  
        if (result.modifiedCount > 0) {  
            res.status(200).send(`Cart${cartId} successfully updated in the Db`);  
        } else {
            res.status(400).send('Cart updated failed');
        }
    }catch(error){
    errorCode(error,res)
    }
};
const deleteCart = async(req,res,next)=>{
    cartId =  new ObjectId(req.params.id);
    try{
        const result = await mongoDb.getDb().collection('purchases').deleteOne({ _id: itemId } );
        if (result.deletedCount > 0) {  
            res.status(200).send(`Deleted of cart ${itemId} succesful`);  
        } else {
            res.status(400).send('There was an error deleting the cart.');
        }
    }catch(error){
    errorCode(error,res)
    }
};
const completePurchase = async (req, res, next) => {
    try {
        const cartId = new ObjectId(req.params.id);
        const cart = await mongoDb.getDb().collection('purchases').findOne({ _id: cartId });
        if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
            return res.status(404).json({ message: "Cart not found or empty" });
        }
        const recoverProducts = await Promise.all(
            cart.cartItems.map(async (eachProduct) => {
                const product = await mongoDb.getDb().collection('items').findOne({ _id: new ObjectId(eachProduct.idItem) });  
                if (!product) {
                    throw new Error(`Product with id ${eachProduct.idItem} not found`);
                }

                return {
                    id: eachProduct.idItem,
                    item: product.nameItem,
                    amountRequest: eachProduct.numberItems,
                    amountToPay: eachProduct.numberItems * product.price,
                    newAmountSystem: product.numberItems - eachProduct.numberItems
                };
            })
        );

        await Promise.all(
            recoverProducts.map(async (element) => {
                await mongoDb.getDb().collection('items').updateOne(
                    { _id: new ObjectId(element.id) },
                    { $set: { numberItems: element.newAmountSystem } }
                );
            })
        );
        const remove = await mongoDb.getDb().collection("purchases").deleteOne({ _id: cartId },
        );
        if (remove.deletedCount > 0) {
            return res.status(200).json({
                message: "Purchase successful",
                cart: recoverProducts.map(values => ({
                    Item: values.item,
                    Amount: values.amountRequest,
                    Total: values.amountToPay,
                    message1: "Number of items updated",
                    message2: "Cart cleared"
                }))
            });
        }

        return res.status(500).json({ message: "Failed to clear the cart" });

    } catch (error) {
        errorCode(error, res);
    }
};


module.exports = {setItem,GeAllItems,editItemById,deleteItemById,createCart,getAllCartItems,editCart,deleteCart,completePurchase}