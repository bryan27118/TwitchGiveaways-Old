$("#yes").click(function () {
    $("#fromname").css("display", "none");
    $("#fromname input").prop('required', false);
});

$("#no").click(function () {
    $("#fromname").css("display", "block")
    $("#fromname input").prop('required', true);
});

$("#noClaim").click(function () {
    $("#claimTime").css("display", "none");
    $("#claimTime input").prop('required', false);
});

$("#yesClaim").click(function () {
    $("#claimTime").css("display", "block")
    $("#claimTime input").prop('required', true);
});