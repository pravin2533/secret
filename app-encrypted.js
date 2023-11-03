//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const ejs=require("ejs");
const app=express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs')

/////CONNECTING DATABASE TO SERVER///////
mongoose.connect("mongodb://127.0.0.1:27017/users",{useNewUrlParser:true});

///DEFINING SCHEMA FOR THE COLLECTION//////
const collectionSchema= new mongoose.Schema({
  email:String,
  password:String
})

///DEFINING COLLECTION////
collectionSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})
const collection=mongoose.model("register",collectionSchema);

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
app.post("/register",async function(req,res){
  try
  {
    const emailid=req.body.username;
    const pass=req.body.password;
    const finditem=await collection.findOne({email:emailid,password:pass});
    if(finditem)
    {
      res.send("these username is already taken");
    }
    else
    {
      const collectionobj=await new collection({
      email:req.body.username,
      password:req.body.password
    })
    collectionobj.save();
    res.redirect("/")
    }
  }
  catch(err)
  {
    console.log("error occur during adding the object during post request "+err)
  }
})

/////POST REQUEST FOR LOGIN/////
app.post("/login",async function(req,res){
  try
  {
    const emai=req.body.username;
    const pass=req.body.password;
    const original=await collection.findOne({email:emai});
    console.log(original);
    if(original && original.password==pass)
    {
      res.render("secrets")
    }
    else
    {
      res.send("please register yourself")
    }
  }
  catch(err)
  {
    console.log("error occur in post request of login page" +err);
  }
})
/////DERVER LISTEN ON GIVEN PORT////
app.listen(3000,function(req,res)
{
  console.log("server is running on port 3000");
})
