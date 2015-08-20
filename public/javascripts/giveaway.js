var readyToRoll = false;

var winnerDisplayed = false;
var curClaimTimeLeft = claimTime;
var claimed = false;
var winnerLastTick = "";

$(document).ready(function () {
    if (isopen == true && username.length > 0) {
        startAjaxInterval();
    }
});

$("#enter").click(function () {
    if (checkReq() == true) {
        $.get('/enter/' + id, function (data) {
            var entries = parseInt($("#entriesNum").html());
            entries++;
            if (data == "success") {
                $("#entriesNum").html(entries);
                $("#success").css("display", "block");
            } else if (data == "failed") {
                $("#errors").html("Failed to enter. Check requirements or the giveaway might be over.");
            }
            $("#enter").hide();
        });
    } else {
        $("#errors").html("Check requirements.");
    }
});

$("#roll").click(function () {
    $.get('/roll/' + id, function (data) {
        if (data == "NoEntries") {
            $("#rollerror").html("No one has entered this giveaway.");
        } else {
            $("#roll").parent().hide();
            if (readyToRoll == false) {
                readyToRoll = true;
            }
            //$("#wheel").append("p").html("The winner is " + data);
        }

    });
});

$(document).on('click', '#claim', function () {
    $.get('/claim/' + id, function (data) {
        console.log(data);
        if (data.indexOf("claimed") >= 0) {
            claimed = true;
            var user = data.substring(data.indexOf("claimed"), data.length);
            $("#wheel").empty();
            $("#wheel").append("<h1 style='margin-top: 0px;' class='text-center'>" + user + " has claimed the prize!</h1>");
        }
    });
});

function checkReq() {
    var pass = false;

    if (checkFollowReq() && checkSubReq())
    {
        pass = true;
    }
    console.log(pass);
    return pass;
}

function checkFollowReq() {
    console.log("mustFollow: " + mustFollow + " following: " + following);
    if(mustFollow == 1){
        if(following == true){
            return true;
        }else{
            return false;
        }
    }else{
        return true;
    }
}

function checkSubReq() {
    console.log("mustSub: " + mustSub + " subbed: " + subbed);
    if (mustSub == 1) {
        if (subbed == true) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

function startAjaxInterval() {
    setTimeout(ajax, 5000);
}

var ajax = function() {
    $.get('/update/' + id, function (data) {
        if (data.indexOf(" ") > 0) {
            var winner = data.substring(data.indexOf(" "), data.length);
            console.log(winner + " " + winner.indexOf("UNCLAIMED/"));
            if (winner.indexOf("UNCLAIMED/") >= 0) {
                var realname = winner.substring(winner.indexOf("/") + 1, winner.length);
                if (winnerLastTick != realname) {
                    if(winnerLastTick != ""){
                        $("#wheel").empty();
                        $("#wheel").append("<p style='margin-bottom: 0px;' class='text-center'>" + winnerLastTick + " failed to claim, rerolling.</p>");
                    }
                    winnerLastTick = realname;
                    winnerDisplayed = false;
                    curClaimTimeLeft = claimTime;
                }
                if (winnerDisplayed == false) {
                    
                    $("#wheel").append("<h1 style='margin-bottom: 0px;' class='text-center'>And the winner is</h1>");
                    $("#wheel").append("<h1 style='width: 100%;margin-top: 0px;' id='roller' class='text-center textroller'></h1>");
                    var elt = document.getElementById("roller");
                    var texts = ["...", realname];
                    elt.textroller = new TextRoller({
                        el: elt,
                        values: texts,    // an array of texts.     default : [el.innerHtml]
                        align: "middle",    // right, left or middle. default : middle
                        delay: 5000,      // in milliseconds,       default : 5000
                        loop: false       // at the end, restart.   default : true
                    });
                    setTimeout(function () {
                        if (username == realname) {
                            $("#wheel").append("<h1 style='margin-top: 0px;' class='text-center'>You are the winner!</h1>");
                            $("#wheel").append("<p style='margin-bottom: 0px;' class='text-center'>Press the claim button within the allowed time to claim your prize.</p>");
                            $("#wheel").append("<p id='timeleft' class='text-center'>You have " + claimTime + " seconds to claim!</p>");
                            $("#wheel").append("<a id='claim' style='width: 200px' class='centerBtn btn btn-lg btn-primary'>Claim</a>");
                            //startClaimCountdown();
                        } else {
                            $("#wheel").append("<h1 id='claimstatus' style='margin-top: 0px;' class='text-center'>Prize is unclaimed.</h1>");
                            $("#wheel").append("<p class='text-center'>The winner has " + claimTime + " seconds to claim the prize.</p>");
                        }
                    },7000);

                    winnerDisplayed = true;
                }
                setTimeout(ajax, 5000);
            } else if (winner.indexOf("CLAIMED/") >= 0) {
                var realname = winner.substring(winner.indexOf("/") + 1, winner.length);
                $("#wheel").empty();
                $("#wheel").append("<h1 style='margin-top: 0px;' class='text-center'>" + realname + " has claimed the prize!</h1>");
            } else {
                if (winnerDisplayed == false) {
                    $("#wheel").append("<h1 style='margin-bottom: 0px;' class='text-center'>And the winner is</h1>");
                    $("#wheel").append("<h1 style='width: 100%;margin-top: 0px;' id='roller' class='text-center textroller'></h1>");
                    var elt = document.getElementById("roller");
                    var texts = ["...", winner];
                    elt.textroller = new TextRoller({
                        el: elt,
                        values: texts,    // an array of texts.     default : [el.innerHtml]
                        align: "middle",    // right, left or middle. default : middle
                        delay: 5000,      // in milliseconds,       default : 5000
                        loop: false       // at the end, restart.   default : true
                    });
                    winnerDisplayed = true;
                }
            }
        } else {
            $("#entriesNum").html(data);
            setTimeout(ajax, 5000);
        }

    });
}

function startClaimCountdown(){
    var interval = setInterval(function () {
        if (curClaimTimeLeft != 0) {
            decrementClaimTime();
            $("#timeleft").html("Time Left: "+curClaimTimeLeft+"s");
        } else {
            if (claimed == false) {
                console.log("failed to claim in time");
                $("#wheel").empty();
                $.get('/claimfail/' + id, function (data) {

                });
            }
            clearInterval(interval);
        }
    }, 1200);
}

function decrementClaimTime() {
    curClaimTimeLeft = curClaimTimeLeft - 1;
    if (curClaimTimeLeft < 0) {
        curClaimTimeLeft = 0;
    }
}