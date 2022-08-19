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

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.URI);

let itemsMapG = new Map();
let categoriesG = [];

itemsMapG.set("Ex. List", ["Welcome to List++!"]);
itemsMapG.set("Things to do", ["Create an account!", "Create Lists!", "Add Items to your Lists!", "Fall in love with List++!" ]);
itemsMapG.set("Ex. List 2", ["Developed by Jason Y. Lee and Eric Hsiao"]);
categoriesG = ["Ex. List", "Things to do", "Ex. List 2"];

let formCurrTextG = "";
let currCatG = "";


const userSchema = new mongoose.Schema ({
    email: String,
    username: String,
    password: String,
    googleId: String,
    itemsMap: Map,
    categories: [String],
    formCurrText: String,
    currCat: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/listpp",
    // callbackURL: "https://listpp.herokuapp.com/auth/google/listpp",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile.id }, function (err, user) {
       if(user.itemsMap == null){
            User.findOneAndUpdate({googleId: user.googleId}, {itemsMap: new Map(), categories: [], formCurrText: "", currCat: "" }, function(err, foundUser){
                if (!err) {
                    console.log("Registered New Account With Google Auth");
                }
            });
       } else {
           console.log("Logged In With Google Auth");
       }
       return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
    if (req.isAuthenticated()) {
        console.log("Logged In User Accessed Home Page")
        var username = req.user.username;
        res.redirect("/" + username);
    } 
    else {
        console.log("User That Hasnt Logged In Accessed Home Page")

        var itemsMapDef = new Map();
        itemsMapDef.set("Ex. List", ["Welcome to List++!"]);
        itemsMapDef.set("Things to do", ["Create an account!", "Create Lists!", "Add Items to your Lists!", "Fall in love with List++!" ]);
        itemsMapDef.set("Ex. List 2", ["Developed by Jason Y. Lee and Eric Hsiao"]);

        res.render("listpp", {
            newItemText: "",
            currCat: "Ex. List",
            categories: ["Ex. List", "Things to do", "Ex. List 2"],
            itemsMap: itemsMapDef,
            loggedIn: false
        });
    }
});

app.post("/", function(req, res) {

    var formCurrText = req.body.newItem;
    let buttn = req.body.buttonType;
    let username = req.user.username;
    
    User.findOne({username: username}, function(err, foundUser) {
        if (buttn === "newCat") { //creating new category
            console.log("Redirecting To New Category Page")
            res.redirect("/newCategory");
        } 
        else if (buttn === "addNewItem") { //adding new item
            if (formCurrText === "") {
                console.log("User Tried To Add Empty Item String")
            } 
            else {
                if (foundUser.categories.length === 0) {
                    console.log("No Categories To Add New Item To")
                } 
                else {
                    foundUser.itemsMap.get(foundUser.currCat).push(formCurrText);
                    console.log("Added Item: " + formCurrText + " ///// Category: " + foundUser.currCat);
                    foundUser.formCurrText = "";
                    User.findOneAndUpdate({username: foundUser.username}, {itemsMap: foundUser.itemsMap}, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
            res.redirect("/" + username);
        } 
        else { //just updating which category to add to
            console.log("Updated Current Category to: " + buttn);
    
            foundUser.currCat = buttn;
            foundUser.save();

            res.redirect("/" + username);
        }
    });

});

app.get("/newCategory", function(req, res) {

    res.sendFile(__dirname + "/newcat.html");

});

app.post("/newCategory", function(req, res) {

    if(!req.isAuthenticated()) {
        res.redirect("/");
    }
    
    let newCategory = req.body.newCategory;
    
    console.log("Creating New Category")

    User.findOne({username: req.user.username}, function(err, foundUser){
        
        if (newCategory !== "" && !foundUser.itemsMap.has(newCategory)){
            foundUser.itemsMap.set(newCategory, []);
            foundUser.categories.push(newCategory);
            foundUser.currCat = newCategory;
        }
        foundUser.save();
        res.redirect("/" + req.user.username);
    });

});

app.post("/deleteItem", function(req, res) {
    const checkedItemIndex = req.body.checkbox;
    const categoryName = req.body.categoryName;

    console.log("Deleting item")

    User.findOne({username: req.user.username}, function(err, foundUser){
        let itemsMap = foundUser.itemsMap;

        itemsMap.get(categoryName).pop(checkedItemIndex);
        User.findOneAndUpdate({username: foundUser.username}, {itemsMap: foundUser.itemsMap}, function(err) {
            if (err) {
                console.log(err);
            }
        });

    });

    res.redirect("/" + req.user.username);

});

app.post("/deleteCategory", function(req, res) {

    const checkedCategoryIndex = req.body.checkbox;
    const categoryName = req.body.categoryName;
    User.findOne({username: req.user.username}, function(err, foundUser){
        foundUser.categories.pop(checkedCategoryIndex);
        foundUser.itemsMap.delete(categoryName);
        //update users data
        if(categoryName === foundUser.currCat){
            if (foundUser.categories.length !== 0) {
                foundUser.currCat = foundUser.categories[0];
            } else { 
                foundUser.currCat = "";
            }
        }

        console.log("Deleted Category " + categoryName)
        foundUser.save();

        res.redirect("/" + req.user.username);
    });
});

/********************** Google thing ************************/

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);


app.get("/auth/google/listpp",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication
    console.log("Successfully Authenticated User Using Google")
    res.redirect("/");
  });

/********************** Register Page ************************/

app.get("/register", function(req, res) {
    if(req.isAuthenticated()){
        res.redirect("/");
    } 
    else {
        res.render("register");
    }
});

app.post("/register", function(req, res){
    User.register({username: req.body.username, itemsMap: new Map(), categories: [], formCurrText: "", currCat: ""}, req.body.password, function(err, regUser){
        if(!err){
            console.log("Successfully Registered New User")
            passport.authenticate("local")(req, res, function(){
                res.redirect("/" + req.user.username);
            });
        } 
        else {
            console.log("Something Went Wrong When Trying to Register")
            res.redirect("/register");
        }
    });
});

/********************** Login Page ************************/

app.get("/login", function(req, res) {
    if(req.isAuthenticated()){
        res.redirect("/");
    } 
    else {
        res.render("login");
    }
});


app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (!err) {
            console.log("Successfully Logged In User")
            passport.authenticate("local")(req, res, function(){
                res.redirect("/" + req.user.username);
            });
        } 
        else {
            console.log("Something Went Wrong When Trying To Log In")
        }
    });

});

/********************** Logout Page ************************/

app.get("/logout", function(req, res){

    if (req.isAuthenticated()) {
        req.logout(function(err) {
            if (err) {
                console.log(err);
            } 
            else {
                console.log("Successfully Logged Out User: ")
                res.redirect("/");
            }
        });
    } 
    else {
        res.redirect("/");
    }

});

/********************** No Access Page ************************/

app.get("/noaccess", function(req, res) {
    res.render("noAccess", {
        loggedIn: false
    });
});

/********************** Separate Pages ************************/

app.get("/:username", function(req, res) {

    let usernameReq = req.params.username;
    
    let usernameUser = req.user.username;

    if(usernameReq !== usernameUser){
        res.redirect("/");
    
    }
    console.log("Attempting To Get Seperate Page")
    if (req.isAuthenticated()) {
        User.findOne({username: usernameUser}, function(err, foundUser) {
            if (!err) {
                console.log("Rendering Page for User: " + usernameUser);
                console.log("User's categories from itemsMap: " + Array.from(foundUser.itemsMap.keys()));
                res.render("listpp", {
                    itemsMap: foundUser.itemsMap,
                    categories: foundUser.categories,
                    currCat: foundUser.currCat,
                    newItemText: foundUser.formCurrText,
                    loggedIn: true
                });
            }
            else {
                console.log(err);
            }
        });
    }
    else {
        res.redirect("noAccess");
    }
});

/********************** Closer ************************/

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server is running.");
});
