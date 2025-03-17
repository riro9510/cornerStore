const express = require('express');
const MongoClient = require("mongodb").MongoClient;
const cornerRoutes = require("./routes/cornerStore.js");
const swaggerRoutes = require('./routes/swagger');
const app = express();
const port = process.env.PORT||8080;
const mongodb = require("./db/connect.js")
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Z-Key');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  next();
})
app.use(swaggerRoutes);
app.use('/cornerStore', (req, res, next) => {
  next();  
}, cornerRoutes);

mongodb.initDb((err,mongodb)=>{
  if(err){
    console.log(err);
  }else{
    app.listen(port);
    console.log("Connected to Db an listen in port",port);
  }
})
