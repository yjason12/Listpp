const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

const itemsMap = new Map();

itemsMap.set("cat1", ["item1", "item2", "item3"])



app.get("/", function(req, res) {
    console.log("WE ENTERED")
    res.sendFile(__dirname + "/index.html");

    res.render("index", {
         categoryItems: itemsMap.get("cat1")
    })
})

app.post("/", function(req, res) {
    let newItem = req.body.newItem;
    let category = req.body.catbutton;
    console.log(newItem);
    console.log(category);

    //itemsMap.get(category).push(newItem); //Assume creating categories already creates a new category

    if(itemsMap.has("cat1")){

        itemsMap.get("cat1").push(newItem); //Assume creating categories already creates a new category

    } else{

        itemsMap.set("cat1", [newItem]);

    }

    
    res.redirect("/");

});


app.listen(3000, function() {
    console.log("Server is running.");
});