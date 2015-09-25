"use strict";

var https = require('https');
var models = require('./index.js');

module.exports = function (sequelize, DataTypes) {
    var User = sequelize.define("User", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        twitchId: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        username: DataTypes.STRING,
        email: DataTypes.STRING
    }, {
        classMethods: {
            associate: function (models) {

            }
        },
        
        hooks: {

        },
        
        instanceMethods: {
            isFollowing: function (channel, callback){
                https.get("https://api.twitch.tv/kraken/users/" + this.username + "/follows/channels/"+channel, function (res) {
                    var body = '';

                    res.on('data', function (chunk) {
                        body += chunk;
                    });

                    res.on('end', function () {
                        var twitchRes = JSON.parse(body);
                        //console.log("Got response: ", twitchRes);

                        if (twitchRes.status == "404") {
                            callback(null, "false");
                        } else {
                            callback(null, "true");
                        }
                    });
                }).on('error', function (e) {
                    console.log("Got error: ", e);
                });
            },
            isSubscribed: function (channel,token, callback) {
                https.get("https://api.twitch.tv/kraken/users/" + this.username + "/subscriptions/" + channel + "?oauth_token="+token, function (res) {
                    var body = '';
                    
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    
                    res.on('end', function () {
                        var twitchRes = JSON.parse(body);
                        //console.log("Got response: ", twitchRes);
                        
                        if (twitchRes.status == "404") {
                            callback(null, "false");
                        } else {
                            callback(null, "true");
                        }
                    });
                }).on('error', function (e) {
                    console.log("Got error: ", e);
                });
            }
        }
    });
    
    User.sync();
    
    return User;
};