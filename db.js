var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '',//sarorosy
    database : 'chat_app',
    charset  : 'utf8mb4'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;