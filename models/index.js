var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config/database.json')[env];
var ip = process.env.OPENSHIFT_MYSQL_IP || "127.3.134.2" || "127.0.0.1";
var port = process.env.OPENSHIFT_MYSQL_PORT || "3306";
var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: ip,
    port: port,
    dialect: "mysql",
    logging: false
});
var db = {};

fs

  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
})
  .forEach(function (file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
});

Object.keys(db).forEach(function (modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
