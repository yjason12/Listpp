
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://projadmin:wordpass321@cluster0.ihixa6b.mongodb.net/listDB");

const itemsMap = new Map();
const categories = [];

var formCurrText = "";
var currCat = "";


app.get("/", function(req, res) {
    res.render("index", {
         newItemText: formCurrText,
         currCat: currCat,
         categories: categories,
         itemsMap: itemsMap
    });
});

app.post("/", function(req, res) {

    console.log(req.body);
    formCurrText = req.body.newItem;
    let buttn = req.body.buttonType;


    if(buttn === "newCat"){ //creating new category
        console.log("making new category")
        res.redirect("/newCategory")


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

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running.");
});