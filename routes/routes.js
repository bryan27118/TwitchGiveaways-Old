var models = require('../models');
var async = require('async');
var nodemailer = require('nodemailer');
var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config/mailer.json')[env];
var globalInterval = null;
var sm = require('sitemap');

var transporter = nodemailer.createTransport({
    service: config.service,
    auth: {
        user: config.username,
        pass: config.password
    }
});

module.exports = function (app,passport) {
    
    //Home
    app.get('/', function (req, res) {
        var username = ""
        var userCount = 0;

        if (req.user != null) {
            username = req.user.username;
        }

        models.Giveaway.findAndCount().then(function (giveaways) {          
            for(var i = 0; i < giveaways.rows.length; i++) {
                userCount = userCount + giveaways.rows[i].getEnteredArray().length;
            }
            models.Giveaway.count({where: {isOpen: "true"}}).then(function (openG) {
                res.render('index',{
                    title: 'Home',
                    username: username,
                    giveaways: giveaways.count.toString(),
                    users: userCount,
                    open: openG,
                    year: new Date().getFullYear()
                });
            });
        });

    });
    
    app.get('/about', function (req, res){
        res.render('about', {
            title: 'About',
            year: new Date().getFullYear()
        }); 
    });
    
    app.get('/support', function (req, res) {
        res.render('support', {
            title: 'Support',
            message: "",
            year: new Date().getFullYear()
        });
    });
    
    app.get('/create', ensureAuthenticated, function (req, res) {
        req.session.returnTo = "/"; 
        res.render('create', {
            title: 'Create Giveaway',
            username: req.user.username,
            year: new Date().getFullYear()
        });
    });
    
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/twitch',
        passport.authenticate('twitch', { scope: [ "chat_login","user_subscriptions","user_read"] }));
    
    app.get('/auth/twitch/callback', 
        passport.authenticate('twitch', { failureRedirect: '/' }),
        function (req, res) {
        // Successful authentication, redirect home.
            req.session.user = req.user;
            res.redirect(req.session.returnTo || '/');
    });

    app.get('/ga/:id', function (req, res) {
        var uniID = req.params.id;
        var username = "";
        var isEntered = false;
        var following = false;
        var subscribed = false;
        var winner = "";
        
        if (req.user == null) {
            req.session.returnTo = req.path; 
        } else {
            req.session.returnTo = "/"; 
        }

        models.Giveaway.find({where: {uniLink: uniID}}).then(function (giveaway) {
            if (giveaway == null) {
                res.redirect('/');
            } else {
                isEntered = giveaway.checkIfEntered(username);
                if (giveaway.winner.indexOf('/') >= 0) {
                    winner = giveaway.winner.substring(giveaway.winner.indexOf('/')+1, giveaway.winner.length);
                } else {
                    winner = giveaway.winner;
                }

                if (req.user != null) {
                    username = req.user.username;
                    async.series([
                        function (callback) {
                            following = req.user.isFollowing(giveaway.channel, callback);
                        },
                        function (callback) {
                            subscribed = req.user.isSubscribed(giveaway.channel, req.session.token, callback);
                        }
                    ], function (err, result) {
                        res.render('giveaway', {
                            title: 'Giveaway',
                            username: username,
                            giveaway: giveaway,
                            entered: isEntered.toString(),
                            following: result[0],
                            subbed: result[1],
                            winner: winner,
                            claimTime: giveaway.claimTime,
                            entries: giveaway.getEnteredArray().length,
                            year: new Date().getFullYear()
                        });
                    });
                } else {
                    res.render('giveaway', {
                        title: 'Giveaway',
                        username: username,
                        giveaway: giveaway,
                        entered: isEntered.toString(),
                        following: following,
                        subbed: subscribed,
                        winner: winner,
                        entries: giveaway.getEnteredArray().length,
                        year: new Date().getFullYear()
                    });
                }
            }
        });

    });
    
    app.get('/roll/:id', ensureAuthenticated, function (req, res) {
        var giveawayId = req.params.id;
        
        models.Giveaway.findById(giveawayId).then(function (giveaway) {
            var winner = giveaway.chooseWinner();
            giveaway.save();
            if (winner == false) {
                res.send("NoEntries");
            } else if (winner.indexOf("won") >= 0) {
                
                //TODO Send EMAIL
                models.User.find({ where: { username: giveaway.creator } }).then(function (user) {
                    if (user.email != "" && giveaway.emailMe == 1) {
                        var mailOptions = {
                            from: 'Twitch-Giveaways.com <mailer@Twitch-Giveaways.com>', // sender address
                            to: user.email, // list of receivers
                            subject: 'TwitchGiveaways: Giveaway for ' + giveaway.item + " has a Winner!", // Subject line
                            html: '<b>The giveaway has ended and a winner was selected!</b><p>The winner of the ' + giveaway.item + ' was <a href="http://www.twitch.tv/'+ giveaway.winner +'/profile">' + giveaway.winner + '</a></p><p>Link to the Giveaway Page: <a href="http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '">http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '</a></p><p>Please take the necessary action to get in contact with the winner and supply the item they have won.</p>' // html body
                        };
                        
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                        });
                    }
                });
                
                models.User.find({ where: { username: giveaway.winner } }).then(function (user) {
                    if (user.email != "") {
                        var mailOptions = {
                            from: 'Twitch-Giveaways.com <mailer@TwitchGiveaways.com>', // sender address
                            to: user.email, // list of receivers
                            subject: 'TwitchGiveaways: You have won a giveaway!', // Subject line
                            html: '<b>You have won ' + giveaway.item + ' on ' + giveaway.channel + 's twitch channel!</b><p>You will be contacted on twitch by <a href="http://www.twitch.tv/' + giveaway.creator + '/profile">' + giveaway.creator + '</a> within 48 hours.</p><p>Link to the Giveaway Page: <a href="http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '">http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '</a></p><p>If you have not received time item within 48 hours contact the giveaway creator, <a href="http://www.twitch.tv/' + giveaway.creator + '/profile">' + giveaway.creator + '</a> , on twitch.</p>' // html body
                        };
                        
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                        });
                    }
                });


                res.send("won");
            } else if (winner.indexOf("needclaim") >= 0) {
                res.send("needclaim");
                var myInterval = setInterval(function () {
                    if (giveaway.winner.indexOf("UNCLAIMED/") >= 0) {
                        giveaway.claimFail();
                        giveaway.save();
                    } else {
                        var name = giveaway.winner.substring(giveaway.winner.indexOf('/')+1, giveaway.winner.length);
                        models.User.find({ where: { username: giveaway.creator } }).then(function (user) {
                            if (user.email != "" && giveaway.emailMe == 1) {
                                var mailOptions = {
                                    from: 'Twitch-Giveaways.com <mailer@TwitchGiveaways.com>', // sender address
                                    to: user.email, // list of receivers
                                    subject: 'TwitchGiveaways: Giveaway for ' + giveaway.item + " has a Winner!", // Subject line
                                    html: '<b>The giveaway has ended and a winner was selected!</b><p>The winner of the ' + giveaway.item + ' was <a href="http://www.twitch.tv/' + name + '/profile">' + name + '</a></p><p>Link to the Giveaway Page: <a href="http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '">http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '</a></p><p>Please take the necessary action to get in contact with the winner and supply the item they have won.</p>' // html body
                                };
                                
                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        return console.log(error);
                                    }
                                });
                            }
                        });

                        clearInterval(myInterval);
                    }
                }, (giveaway.claimTime + 15) * 1000);
                globalInterval = myInterval;
            }

        });

    });
    
    app.get('/claim/:id', ensureAuthenticated, function (req, res) {
        var giveawayId = req.params.id;

        models.Giveaway.findById(giveawayId).then(function (giveaway) {
            var claim = giveaway.claim(req.user.username);
            giveaway.save();
            console.log("claim: "+claim);
            if (claim == true) {
                
                //TODO Send EMAIL
                models.User.find({ where: { username: req.user.username } }).then(function (user) {
                    if (user.email != "") {
                        var mailOptions = {
                            from: 'Twitch-Giveaways.com<mailer@Twitch-Giveaways.com>', // sender address
                            to: user.email, // list of receivers
                            subject: 'TwitchGiveaways: You have won a giveaway!', // Subject line
                            html: '<b>You have won '+ giveaway.item + ' on ' + giveaway.channel + 's twitch channel!</b><p>You will be contacted on twitch by <a href="http://www.twitch.tv/' + giveaway.creator + '/profile">' + giveaway.creator + '</a> within 48 hours.</p><p>Link to the Giveaway Page: <a href="http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '">http://www.twitch-giveaways.com/ga/' + giveaway.uniLink + '</a></p><p>If you have not received time item within 48 hours contact the giveaway creator, <a href="http://www.twitch.tv/'+ giveaway.creator +'/profile">' + giveaway.creator + '</a> , on twitch.</p>' // html body
                        };
                        
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                        });
                    }
                });
                res.send("claimed " + req.user.username);
                clearInterval(globalInterval);
            } else {
                res.send("failed");
            }
        });

    });
    
    app.get('/update/:id', ensureAuthenticated, function (req, res) {
        var giveawayId = req.params.id;
        
        models.Giveaway.findById(giveawayId).then(function (giveaway) {
            var entires = giveaway.getEnteredArray().length;
            if (giveaway.winner.length > 0) {
                if (giveaway.winner.indexOf("UNCLAIMED/") >= 0) {
                    res.send(entires + " " + giveaway.winner);
                } else if (giveaway.winner.indexOf("CLAIMED/") >= 0) {
                    res.send(entires + " " + giveaway.winner);
                }
                else {
                    res.send(entires + " " + giveaway.winner);
                }
            } else {
                res.send(entires.toString());
            }
        });

    });
    
    //robots.txt
    app.get('/robots.txt', function (req, res) {
        res.type('text/plain');
        res.send("User-agent: *");
    });
    
    //sitemap
    app.get('/sitemap.xml', function (req, res) {
        
        var sitemap = sm.createSitemap({
            hostname: 'http://www.twitch-giveaways.com',
            cacheTime: 600000,  // 600 sec cache period 
            urls: [
                { url: '/', changefreq: 'daily', priority: 0.3 },
                { url: '/about', changefreq: 'weekly', priority: 0.7 },
                { url: '/support', changefreq: 'weekly', priority: 0.7 },
            ]
        });
        res.header('Content-Type', 'application/xml');
        res.send(sitemap.toString());
        
    });

    app.get('/enter/:id', ensureAuthenticated, function (req, res) {
        var giveawayId = req.params.id;

        models.Giveaway.findById(giveawayId).then(function (giveaway) {
            if (giveaway.enter(req.user.username)) {
                giveaway.save();
                res.send("success");
            } else {
                res.send("failed");
            }
        });
    });
    
    // process the support form
    app.post('/support', function (req, res) {
        var message = req.body.message;
        var name = req.body.name;
        var ip = req.connection.remoteAddress;
        
        var username = "";
        
        if (req.user != null) {
            username = req.user.username;
        }
        
        var mailOptions = {
            from: 'Site Mailer <mailer@TwitchGiveaways.com>', // sender address
            to: 'specscape1@gmail.com', // list of receivers
            subject: 'Message from TwitchGiveaways', // Subject line
            html: '<b>New message!</b><p>From: ' + name + '</p><br><p>' + message + '</p><br><p>' + ip + '</p>' // html body
        };
        
        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.render('support', { title: 'Support', message: 'There was an error with sending the message.' });
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            res.render('support', { title: 'Support', message: 'Message Sent' });
        });

    });

    // process the create form
    app.post('/create', ensureAuthenticated, function (req, res) {
        var item = escapeHtml(req.body.item);
        var from = req.body.from;
        var fromName = escapeHtml(req.body.fromName);
        var channel = escapeHtml(req.body.channel);
        var claim = req.body.claim || 1;
        var emailMe = req.body.emailMe || 1;
        var claimTime = req.body.claimTime || 30;
        var mustFollow = req.body.following || 0;
        var mustSub = req.body.subscribe || 0;
        var uniLink = guid();

        var fromUsername = req.user.username;
        
        if (from == 0) {
            fromUsername = fromName;
        }

        models.Giveaway.create({ item: item, channel: channel, emailMe: emailMe, claimTime: claimTime, mustClaim: claim, uniLink: uniLink, creator: req.user.username, fromUser: fromUsername, mustFollow: mustFollow, mustSub: mustSub }).then(function (giveaway) {
            res.redirect('/ga/' + giveaway.uniLink);
        });
    });
};

//app.get('/account', ensureAuthenticated, function(req, res){
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/')
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
    }
    return s4() + s4();
}

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return entityMap[s];
    });
}

