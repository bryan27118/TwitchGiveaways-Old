// config/passport.js

var models = require('../models');

var TwitchStrategy = require("passport-twitch").Strategy;

var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/twitchapi.json')[env];

var TWITCH_CLIENT_ID = config.id;
var TWITCH_CLIENT_SECRET = config.secret;

// expose this function to our app using module.exports
module.exports = function (passport) {
    
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        console.log("Serialize id " + user.id + " and name " + user.username);
        done(null, user.id);
    });
    
    passport.deserializeUser(function (id, done) {
        models.User.findById(id).then(function (user) {
            if (user != null) {
                done(null, user);
            } else {
                console.log("Did not find deserialized user with id " + id);
                done(null, false);
            }
        });
    });
    
    passport.use(new TwitchStrategy({
        clientID: TWITCH_CLIENT_ID,
        clientSecret: TWITCH_CLIENT_SECRET,
        callbackURL: config.callback,
        passReqToCallback : true
    },
    function (req, accessToken, refreshToken, profile, done) {
        req.session.token = accessToken;
        var email = "";
        
        if (profile.email != null) {
            email = profile.email;
        }

        models.User.find({ where: { twitchId: profile.id } }).then(function (user) {
            if (user == null) {
                models.User.create({ username: profile.username, twitchId: profile.id, email: email }).then(function (newUser) {
                    return done(null, newUser);
                });
            } else {
                if (user.email == null && profile.email != null) {
                    user.updateAttributes({
                        email: profile.email
                    });
                }

                return done(null, user);
            }
        });
    }))

};