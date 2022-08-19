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
    // secret: "aldfjslfoiejdslamcslckmeoifjlsajfdlkf",
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb+srv://projadmin:wordpass@cluster0.ihixa6b.mongodb.net/shopifyDB");
mongoose.connect(process.env.URI);

let itemsMap = new Map();
let categories = [];

itemsMap.set("Ex. List", ["Welcome to List++!"]);
itemsMap.set("Things to do", ["Create an account!", "Create Lists!", "Add Items to your Lists!", "Fall in love with List++!" ]);
itemsMap.set("Ex. List 2", ["Developed by Jason Y. Lee and Eric Hsiao"]);
categories = ["Ex. List", "Things to do", "Ex. List 2"];

let formCurrText = "";
let currCat = "";

const userSchema = new mongoose.Schema ({
    email: String,
    username: String,
    password: String,
    googleId: String,
    itemsMap: Map,
    categories: [String]
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
    // clientID: "40572528001-soah1nmb4pj8bljr5qsv9frs02eotqhg.apps.googleusercontent.com",
    // clientSecret: "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",
    // callbackURL: "https://peaceful-chamber-87462.herokuapp.com/auth/google/listpp",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    
    User.findOrCreate({ googleId: profile.id, username: profile.id }, function (err, user) {
       
        
        
       if(user.itemsMap == null){
            User.findOneAndUpdate({googleId: user.googleId}, {itemsMap: new Map(), categories: [] }, function(err, foundUser){
                if(!err){
                    console.log("Registered New Account With Google Auth")
                }
            });
       } else {
           console.log("Logged In With Google Auth")
       }

       loadUserData(user.username);

       return cb(err, user);
    });

    
  }
));

// //TODO: testing how I want to structure data
// const userDataSchema = {
//     itemsMap: Map,
//     categories: [],
//     userID: Number
// }

// const UserData = mongoose.model("Data", userDataSchema);
// var user2;

// User.findOne({username: "bob@gmail.com"}, function(err, foundItem){
//     // console.log(err);
//     // console.log("HELLO")
//     user2 = new UserData({
//         itemsMap: new Map(),
//         userID: foundItem._id
//     });
// });

// console.log(user2.itemsMap);
// console.log(user2.categories);
// user2.categories.add("hi");
// console.log(user2.categories);
// console.log(user2.userID);



// var currCat = "Category1"; //keeps track of which category to add to



// itemsMap.set("Category1", []) //hard coded/predefined categories, maybe keep cuz we want users to see what the categories layout 
// itemsMap.set("Category2", [])// will look like when they open app
// itemsMap.set("Category3", [])

// const testUser = new User({
//     username: "hi'",
//     password: "hi'",
//     googleId: "hi'",
//     itemsMap: new Map(),
//     categories: []
// });
// testUser.save();
// console.log("MONGODB IS CONNECTED");

//TODO: preserve item text box when pressing buttons

app.get("/", function(req, res) {
    if (req.isAuthenticated()) {
        console.log("Logged In User Accessed Home Page")

        res.render("listpp", {
            newItemText: formCurrText,
            currCat: currCat,
            categories: categories,
            itemsMap: itemsMap,
            loggedIn: true
       });

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

    console.log(req.body);
    formCurrText = req.body.newItem;
    let buttn = req.body.buttonType;


    if(buttn === "newCat"){ //creating new category
        console.log("Redirecting To New Category Page")
        //TODO: add new category
        res.redirect("/newCategory");


    } 
    else if (buttn === "addNewItem") { //adding new item

        
        if (formCurrText === "") {

            console.log("User Tried To Add Empty Item String")


        } 
        else {
            
            if(categories.length === 0){
                console.log("No Categories To Add New Item To")
            } else{
                itemsMap.get(currCat).push(formCurrText);
                console.log("Added Item: " + formCurrText + " To Category: " + currCat);
            }

            formCurrText = "";

        }

        res.redirect("/");

    } 
    else { //just updating which category to add to
        console.log("Updated Current Category to: " + buttn);
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
    
    console.log("Creating New Category")

    if (newCategory !== "" && !itemsMap.has(newCategory)){
        itemsMap.set(newCategory, []);
        categories.push(newCategory);
        currCat = newCategory;
    }

    res.redirect("/");
});

app.post("/deleteItem", function(req, res) {
    const checkedItemIndex = req.body.checkbox;
    const categoryName = req.body.categoryName;

    console.log("Deleting item")

    itemsMap.get(categoryName).pop(checkedItemIndex);
    res.redirect("/");


    // if (listName === "/") {
    //   Item.findByIdAndRemove(checkedItemID, function(err) {
    //     if (!err) {
    //       console.log("Successfully deleted checked item.");
    //       res.redirect("/");
    //     }
    //   });
    // }
    // else {
    //   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function (err, foundList) {
    //     if (!err) {
    //       res.redirect("/" + listName);
    //     }
    //   });
    // }
  
});

app.post("/deleteCategory", function(req, res) {
    const checkedCategoryIndex = req.body.checkbox;
    const categoryName = req.body.categoryName;

    categories.pop(checkedCategoryIndex);
    itemsMap.delete(categoryName);

    if(categoryName === currCat){
        console.log("Updating currText")
        if (categories.length !== 0) {
            currCat = categories[0];
        } else { 
            currCat = "";
        }
    }

    console.log("Deleted Category " + categoryName)
    res.redirect("/");

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
    User.register({username: req.body.username, itemsMap: new Map(), categories: []}, req.body.password, function(err, regUser){
        if(!err){
            console.log("Successfully Registered New User")
            passport.authenticate("local")(req, res, function(){
                loadUserData(req.user.username);
                res.redirect("/");
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
                loadUserData(req.user.username);
                res.redirect("/");
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
        User.findOneAndUpdate({username: req.user.username}, {itemsMap: itemsMap, categories: categories}, function(err, foundUser){
            if (err) {
                console.log("Error When Saving Items")
            } else {
                console.log("Successfully Saved Items For User: ")
            }
        });
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

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server is running.");
});


//helper method
function loadUserData(username){

    User.findOne({username: username}, function(err, foundUser){
        if(!err){
            itemsMap = foundUser.itemsMap;
            categories = foundUser.categories;
            formCurrText = "";
            console.log("Loaded User Data For User: " + username)
            if (foundUser.categories.length === 0 ) {
                currCat = "";
            } else {
                currCat = foundUser.categories[0];
            }

        }
    });
}