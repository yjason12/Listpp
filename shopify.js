require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.URI);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id)
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
   
    })
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/listpp",
    // callbackURL: "https://peaceful-chamber-87462.herokuapp.com/auth/google/listpp",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


const itemsMap = new Map();
const categories = [];

var formCurrText = "";
var currCat = "";
// var currCat = "Category1"; //keeps track of which category to add to



// itemsMap.set("Category1", []) //hard coded/predefined categories, maybe keep cuz we want users to see what the categories layout 
// itemsMap.set("Category2", [])// will look like when they open app
// itemsMap.set("Category3", [])


//TODO: preserve item text box when pressing buttons

app.get("/", function(req, res) {
    if(req.isAuthenticated()){

        res.render("index", {
            newItemText: formCurrText,
            currCat: currCat,
            categories: categories,
            itemsMap: itemsMap
       });

    } else{
        var itemsMapDef = new Map();
        itemsMapDef.set("Example List", ["Welcome to List++!"])
        itemsMapDef.set("Things to do", ["Create an account!", "Create Lists!", "Fall in love with List++!" ])
        itemsMapDef.set("Example List 2", ["Developed by Jason Yongjae Lee and Eric Hsiao B)"])

        res.render("index", {
            newItemText: "",
            currCat: "Example List",
            categories: ["Example List", "Things to do", "Example List 2"],
            itemsMap: itemsMapDef
        });
    }

});

app.post("/", function(req, res) {

    console.log(req.body);
    formCurrText = req.body.newItem;
    let buttn = req.body.buttonType;


    if(buttn === "newCat"){ //creating new category
        console.log("making new category");
        //TODO: add new category
        res.redirect("/newCategory");


    } else if(buttn === "addNewItem"){ //adding new item

        
        if(formCurrText === ""){

            //TODO: pop up or something to alert user



        } else {
            
            console.log("added new Item")
            itemsMap.get(currCat).push(formCurrText);
            formCurrText = "";

        }

        res.redirect("/");

    } else { //just updating which category to add to
        console.log("updated curr Category")
        //TODO: update text of dropdown menu 
        currCat = buttn;
        res.redirect("/");
    }

});

app.get("/newCategory", function(req, res){

    res.sendFile(__dirname + "/newcat.html");

});

app.post("/newCategory", function(req, res){

    let newCategory = req.body.newCategory;
    
    if (newCategory !== "" && !itemsMap.has(newCategory)){
        itemsMap.set(newCategory, []);
        categories.push(newCategory);
        currCat = newCategory;
    }

    res.redirect("/");
});


/********************** Login Page ************************/

app.get("/login", function(req, res) {
    res.render("login", {

    });
});

app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(!err){
            passport.authenticate("local")(req, res, function(){
                res.redirect("/")
            })   
        } else{
            console.log(err);
        }
    });

});

/********************** Register Page ************************/

app.get("/register", function(req, res) {
    res.render("register", {
        
    });
});

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, regUser){
        if(!err){
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            })
        } else{
            console.log(err);
            res.redirect("/register")
        }
    });
});

/********************** Logout Page ************************/

app.get("/logout", function(req, res){
    if(req.isAuthenticated()){
        req.logout();
        res.redirect("/");
    } else{
        res.redirect("/");
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server is running.");
});