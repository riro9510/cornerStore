const express = require('express');
const MongoClient = require("mongodb").MongoClient;
const cornerRoutes = require("./routes/cornerStore.js");
const swaggerRoutes = require('./routes/swagger');
const app = express();
const port = process.env.PORT||8080;
const mongodb = require("./db/connect.js");
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github2').Strategy;

app.use(cors());
app.use(express.json());
app.use(session({
  secret:"secret",
  resave: false,
  saveUninitialized:true,
}))
app.use(passport.initialize()).use(passport.session());

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Z-Key');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  next();
})
app.use(swaggerRoutes);
app.use('/', (req, res, next) => {
  next();  
}, cornerRoutes);

passport.use(new GitHubStrategy({
  clientID:process.env.GITHUB_CLIENT_ID,
  clientSecret:process.env.GITHUB_CLIENT_SECRET,
  callbackURL:process.env.CALLBACK_URL
},
function(accessToken,refreshToken,profile,done){
  //User.findOrCreate({githubId:profile.id},function(err,user){
    return done(null,profile);
  //});
  
}
));

passport.serializeUser((user,done)=>{
  done(null,user);
})
passport.deserializeUser((user,done)=>{
  done(null,user);
})

app.get('/',(req,res)=>{res.send(req.session.user !== undefined? `logged in as ${req.session.user.displayName}`:"logged Out")});
app.get('/github/callback',passport.authenticate('github',{
  failureRedirect: '/api-docs',session:false}),
  (req,res)=>{
    req.session.user = req.user;
    res.redirect('/');
  }
)

mongodb.initDb((err,mongodb)=>{
  if(err){
    console.log(err);
  }else{
    app.listen(port);
    console.log("Connected to Db an listen in port",port);
  }
})
