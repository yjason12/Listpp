const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

const itemsMap = new Map();

itemsMap.set("cat1", []) //hard coded/predefined categories, maybe keep cuz we want users to see what the categories layout 
itemsMap.set("cat2", [])// will look like when they open app
itemsMap.set("cat3", [])

var currCat = "cat1"; //keeps track of which category to add to

//TODO: preserve item text box when pressing buttons

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");

    res.render("index", {
         categoryItems: itemsMap.get("cat1"), //hard coded, in the future I think we pass in entirety of itemsMap
         categoryItems2: itemsMap.get("cat2"),
         categoryItems3: itemsMap.get("cat3")
    })
})

app.post("/", function(req, res) {

    console.log(req.body);
    let newItem = req.body.newItem;
    let buttn = req.body.buttonType;


    if(buttn === "newCat"){ //creating new category
        console.log("making new category")
        //FINISH! add new category

    } else if(buttn === "addNewItem"){ //adding new item

        console.log("added new Item")
        itemsMap.get(currCat).push(newItem);
        

    } else{ //just updating which category to add to
        console.log("updated curr Category")
        //FINISH! update text of dropdown menu 
        currCat = buttn;
    }

    
    res.redirect("/");

});


app.listen(3000, function() {
    console.log("Server is running.");
});