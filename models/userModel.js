const db = require("../db");

// Find user by email
const findUserByEmail = (email, callback) => {
    const query = "SELECT * FROM tbl_users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results.length ? results[0] : null);
    });
};

const updateUserToken = (userId, token, callback) => {
    const query = "UPDATE tbl_users SET token = ? WHERE id = ?";
    db.query(query, [token, userId], callback);
};

const getAllUsers = (callback) => {
    const query = "SELECT * FROM tbl_users";
    db.query(query, (err, results) => {
        if (err) return callback(err, null);
        callback(null, results);
    });
};

module.exports = { findUserByEmail, updateUserToken, getAllUsers };
