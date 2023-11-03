//jshint esversion:6
require("dotenv").config();
/////npm express-session library////

const session=require("express-session")
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate")

//*********************************************************
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");

const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const encrypt=require("mongoose-encryption");
const ejs=require("ejs");
const app=express();
////CALLING BCRYPT NPM HERE////

const bcrypt=require("bcrypt")

///////////////////////////////////
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(session({
    secret:"cookie_secret",
    resave: true,
    saveUninitialized: true
}));


/////CONNECTING DATABASE TO SERVER///////
mongoose.connect("mongodb://127.0.0.1:27017/users",{useNewUrlParser:true});

///DEFINING SCHEMA FOR THE COLLECTION//////
const collectionSchema= new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
})
app.use(passport.initialize());
app.use(passport.session());
collectionSchema.plugin(passportlocalmongoose);


///DEFINING COLLECTION////

const collection=mongoose.model("register",collectionSchema);
passport.use(collection.createStrategy());



passport.serializeUser(async function(user, done) {
  try {
    done(null, user.id);
  } catch (err) {
    console.error("Error while serializing user:", err);
    done(err);
  }
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await collection.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Error while deserializing user:", err);
    done(err);
  }
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/project",
    passReqToCallback: true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
      // Search for user by Google ID

      const user = await collection.findOne({ googleId: profile.id });

      if (!user) {
        // User not found, create a new user
        const newUser = new collection({
          googleId: profile.id
          // Add any other relevant user properties here
        });
        const savedUser = await newUser.save();
        return done(null, savedUser);
      } else {
        // User found, return the existing user
        return done(null, user);
      }
    } catch (err) {
      // Log the error and return it
      console.error("Error:", err);
      return done(err);
    }
  }
));




////HOME PAGE///////
app.get("/",async function(req,res){
  try
  {
    await res.render("home")
  }
  catch(err)
  {
    console.log("error occuring during get request");
  }
});
//////GOOGLE AUTHENTICATIN////
app.get("/auth/google",
  passport.authenticate("google", { scope: ['profile'] }),
  function(req, res) {
    // This callback will only be executed if the authentication is successful
    // You can use req.user to access the authenticated user's information
    console.log(profile);
    res.redirect('/secret'); // Redirect to a different page after authentication
  }
);

////GOOGLE AUTHENTICATION FAILS/////
app.get("/auth/google/project",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  }
);


/////LOGIN PAGE//////

app.get("/login",async function(req,res)
{
  try
  {
    res.render("login");
  }
  catch(err)
  {
    console.log("cannot get login page "+err);
  }
})

////REGISTER PAGE//////
app.get("/register",async function(req,res)
{
  try
  {
    res.render("register");
  }
  catch(err)
  {
    console.log("cannot get register  page "+err);
  }
})

////// POST REQUEST FOR THE REGISTER//////
app.post("/login",async function(req,res){
  const user=new collection({
    username:req.body.username,
    password:req.body.password
  })
  req.login(user,function(err)
{
  if(err)
  {
    console.log("cannot log in" +err)
  }
  else
  {
    res.render("secrets")
  }
})
})
//////SECRET PAGE////////
app.get("/secret",function(req,res){
  if(req.isAuthenticated())
  {
    res.render("secrets")
  }
  else
  {
    res.redirect("/login")
  }
})
app.get("/submit",function(req,res)
{
  if(req.isAuthenticated())
  {
    res.render("submit")
  }
  else
  {
    res.redirect("/login")
  }
})

/////POST REQUEST FOR submit/////
app.post("/submit", async function(req, res) {
  try {
    const submittedSecret = req.body.secret;

    const foundUser = await collection.findById(req.user.id);

    if (foundUser) {
      foundUser.secret = submittedSecret;
      await foundUser.save();
      res.redirect("/secret");
    }
  } catch (err) {
    console.error(err);
    // Handle the error as needed
  }
});

/////POST REQUEST FOR REGISTER/////
app.post("/register", async function(req, res) {
  await collection.register({ username: req.body.username }, req.body.password, function(err, user) {
    if (err) {
      console.log("Error occurred during creating the user: " + err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        console.log("authenticated successfull")
        res.redirect("/secret");
      });
    }
  });
});

//////logot///////
app.get("/logout",function(req,res){
  req.logout(function(err)
{
  if(err)
  {
    console.log("cannot logout");
  }
  else
  {
    res.redirect("/login")
  }
});


})
/////DERVER LISTEN ON GIVEN PORT////
app.listen(3000,function(req,res)
{
  console.log("server is running on port 3000");
})
