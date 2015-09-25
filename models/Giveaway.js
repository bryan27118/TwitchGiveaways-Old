"use strict";

var models = require('./index.js');

module.exports = function (sequelize, DataTypes) {
    var Giveaway = sequelize.define("Giveaway",{
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        fromUser: DataTypes.STRING,
        channel: DataTypes.STRING,
        creator: DataTypes.STRING,
        winner: {
            type: DataTypes.STRING,
            defaultValue: ""
        },
        uniLink: {
            type: DataTypes.STRING,
            defaultValue: ""
        },
        isOpen: {
            type: DataTypes.STRING,
            defaultValue: "true"
        },
        item: DataTypes.TEXT,
        mustFollow: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        enteredList: {
            type: DataTypes.STRING,
            defaultValue: "[]"
        },
        mustSub: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        mustClaim: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        claimTime: {
            type: DataTypes.INTEGER,
            defaultValue: 60
        },
        emailMe: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        classMethods: {
            associate: function (models) {

            }
        },
        
        hooks: {

        },
        
        instanceMethods: {
            getEnteredArray: function () {
                var jsonList = [];
                var array = [];
                
                if (this.enteredList != null) {
                    jsonList = JSON.parse(this.enteredList)
                    array = Object.keys(jsonList).map(function (k) { return jsonList[k] });  //JSON to array
                }
                
                return array;
            },
            enter: function (name) {
                var array = this.getEnteredArray();

                if (this.isOpen == "false") {
                    return false;
                }

                if (array.indexOf(name) >= 0) {
                    return false;
                } else {
                    array.push(name);
                    this.enteredList = JSON.stringify(array);
                    return true;
                }
            },
            checkIfEntered: function (name){
                var array = this.getEnteredArray();
                console.log("Name: " + name + " Index: " +array.indexOf(name));
                if (array.indexOf(name) >= 0) {
                    console.log("true");
                    return true;
                } else {
                    console.log("false");
                    return false;
                }
            },
            chooseWinner: function (){
                var array = this.getEnteredArray();
                if (array.length == 0) {
                    return false;
                }

                var wIndex = Math.floor(Math.seededRandom(array.length, 0));
                if (this.mustClaim == 1) {
                    this.winner = "UNCLAIMED/"+ array[wIndex];
                    return "needclaim";
                } else {
                    this.winner = array[wIndex];
                    this.isOpen = "false";
                    return "won";
                }
            },
            claim: function (name){
                if (this.mustClaim == 1) {
                    var wname = this.winner.substring(this.winner.indexOf("/")+1, this.winner.length);
                    console.log("insideclaime - name: " + wname);
                    if (wname == name) {
                        this.winner = "CLAIMED/" + wname;
                        this.isOpen = "false";
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
            claimFail: function () {
                var array = this.getEnteredArray();
                var getFailedClaimer = this.winner.substring(this.winner.indexOf('/')+1, this.winner.length);
                var wIndex = Math.floor(Math.seededRandom(array.length, 0));
                var flag = true;
                
                if (array.length == 1) {
                    this.winner = "CLAIMED/" + getFailedClaimer;
                    this.isOpen = "false";
                    return "needclaim";
                }

                console.log("Failed claimer: " + getFailedClaimer + " index: " + wIndex);
                while (flag == true) {
                    wIndex = Math.floor(Math.seededRandom(array.length, 0));
                    console.log("index: " + wIndex);
                    if (array[wIndex] != getFailedClaimer) {
                        console.log("array[wIndex]: " + array[wIndex]);
                        flag = false;
                    }
                }

                if (array[wIndex] != getFailedClaimer) {
                    this.winner = "UNCLAIMED/" + array[wIndex];
                    return "needclaim";
                }
            }
        }
    });
    
    Giveaway.sync();
    
    return Giveaway;
};


// the initial seed
Math.seed = 6;

// in order to work 'Math.seed' must NOT be undefined,
// so in any case, you HAVE to provide a Math.seed
Math.seededRandom = function (max, min) {
    max = max || 1;
    min = min || 0;
    
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;
    
    return min + rnd * (max - min);
}