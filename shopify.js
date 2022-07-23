
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

const itemsMap = new Map();
const categories = ["cat1", "cat2", "cat3"];

var formCurrText = "";
var currCat = "cat1"; //keeps track of which category to add to



itemsMap.set("cat1", []) //hard coded/predefined categories, maybe keep cuz we want users to see what the categories layout 
itemsMap.set("cat2", [])// will look like when they open app
itemsMap.set("cat3", [])


//TODO: preserve item text box when pressing buttons

app.get("/", function(req, res) {
    res.render("index", {
         categoryItems: itemsMap.get("cat1"), //hard coded, in the future I think we pass in entirety of itemsMap
         categoryItems2: itemsMap.get("cat2"),
         categoryItems3: itemsMap.get("cat3"),
         newItemText: formCurrText,
         currCat: currCat
    })
})

app.post("/", function(req, res) {

    console.log(req.body);
    formCurrText = req.body.newItem;
    let buttn = req.body.buttonType;


    if(buttn === "newCat"){ //creating new category
        console.log("making new category")
        //TODO: add new category
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

    } else{ //just updating which category to add to
        console.log("updated curr Category")
        //TODO: update text of dropdown menu 
        currCat = buttn;
        res.redirect("/");
    }

});

app.get("/newCategory", function(req, res){

    res.sendFile(__dirname + "/newcat.html");

})

app.post("/newCategory", function(req, res){

    let newCategory = req.body.newCategory;
    
    if(newCategory !== "" && !itemsMap.has(newCategory)){
        itemsMap.set(newCategory, []);
        categories.push(newCategory);
    }

    res.redirect("/");
});

app.listen(3000, function() {
    console.log("Server is running.");
});