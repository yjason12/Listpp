
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-jason:test123@cluster0.vzkhjep.mongodb.net/shopifyDB");

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
    res.render("index", {
        //  categoryItems: itemsMap.get("Category1"), //hard coded, in the future I think we pass in entirety of itemsMap
        //  categoryItems2: itemsMap.get("Category2"),
        //  categoryItems3: itemsMap.get("Category3"),
         newItemText: formCurrText,
         currCat: currCat,
         categories: categories,
         itemsMap: itemsMap
    })
})



app.get("/newCategory", function(req, res){

    res.sendFile(__dirname + "/newcat.html");

});

app.post("/newCategory", function(req, res){

    let newCategory = req.body.newCategory;
    
    if (newCategory !== "" && !itemsMap.has(newCategory)){
        console.log("creating new category called " + newCategory)
        itemsMap.set(newCategory, []);
        categories.push(newCategory);
        currCat = newCategory;
    }

    res.redirect("/");
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running.");
});



app.post("/", function(req, res) {//post request for adding new item

    console.log(req.body);
    formCurrText = req.body.newItem;
        
    if(formCurrText === ""){//new item empty string

        //TODO: pop up or something to alert user
        console.log("Prevented empty item addition")


    } else {
        
        if(itemsMap.has(currCat)){
            console.log("added " + formCurrText + " to " + currCat)
            itemsMap.get(currCat).push(formCurrText);
            formCurrText = "";
        }


    }

    res.redirect("/");

});

app.post("/newCat", function(req, res){//post request for adding new category
    console.log("Switched to new Category page")
    res.redirect("/newCategory")

})

app.post("/chooseCat", function(req, res){//post request for choosing new category
    console.log("switched current category to " + currCat)
    currCat = req.body.chosenCat;
    res.redirect("/");
})