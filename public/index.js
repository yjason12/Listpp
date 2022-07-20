
$(".cat-btn").click(function() {
    var selectedCategory = $(this).attr("id");
    $("#category").text(selectedCategory);
});