// config/passport.js

var models = require('../models');

var TwitchStrategy = require("passport-twitch").Strategy;

var TWITCH_CLIENT_ID = "sube989ttm2hli2jcb34brkh5wq3zdc";
var TWITCH_CLIENT_SECRET = "nhkwmdhwpcaevw54rxvd4j1x3upsmk";

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
        callbackURL: "http://www.twitch-giveaways.com/auth/twitch/callback",
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