require('dotenv').config();

var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var r = require('rethinkdb');

var config = require(__dirname + '/modules/config.js');
var clubs = require(__dirname + '/modules/clubs.js');
var {
  listen
} = require(__dirname + '/modules/listener.js');

var app = express();

app.use(bodyParser.json());

var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

// Probability
// app.route('/probability/:teamHomeId/:teamAwayId').get(probability.getProbability);

/*
 * Store the db connection and start listening on a port.
 */
function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
}

/*
 * Connect to rethinkdb
 * Able to create Tables/Database if we want here and not in the scrapper :)
 */
async.waterfall([
  function connect(callback) {
    r.connect(config.rethinkdb, callback);
  },
  function loadClubs(connection, callback) {
    r.table(process.env.RDB_TABLE_SOURCE_CLUBS).run(connection, (err, cursor) => {
      // Retrieve all users in an array.
      cursor.each((err, row) => {
        if (err) throw err
        clubs.addOrReplace(null, row)
      }, () => {
        console.log(`Loaded ${clubs.getClubsCount()} clubs from database.`)
        callback(err, connection)
      });
    });
  },
  function registerClubsSourcesChanges(connection, callback) {
    r.table(config.ecoutor.source_clubs).changes().run(connection, (err, cursor) => {
      cursor.each(function (err, row) {
        if (err) throw err;
        clubs.addOrReplace(row.old_value, row.new_value)
      });
    }, callback(null, connection))
  },
  function registerClubsDestChanges(connection, callback) {
    r.table(config.ecoutor.dest_clubs).changes().run(connection, (err, cursor) => {
      cursor.each(function (err, row) {
        if (err) throw err;
        clubs.addOrReplace(row.old_value, row.new_value)
        console.log("WINA: New received: " + row)
      });
    }, callback(null, connection))
  },
  function init(connection, callback) {
    client.connect('wss://sports-eu-west-3.winamax.fr/uof-sports-server/socket.io/?language=EN&version=1.73.0&EIO=3&transport=websocket', 'echo-protocol');
    client.on('connectFailed', (error) => console.log('Connect Error: ' + error.toString()));
    client.on('connect', listen);
    callback(null, connection);
  }
], function (err, connection) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  startExpress(connection);
  console.log(`Ecoutor ready on ${process.env.HTTP_HOST}:${process.env.HTTP_PORT}`)
});