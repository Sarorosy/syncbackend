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
const findUserById = (id, callback) => {
    const query = "SELECT id, name, pronouns, bio, email, profile_pic FROM tbl_users WHERE id = ?";
    db.query(query, [id], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);
        callback(null, results[0]);
    });
};


const updateUser = (id, userData, callback) => {
    const { name, pronouns, bio, profile_pic } = userData;
    const query = "UPDATE tbl_users SET name = ?, pronouns = ?, bio = ?, profile_pic = ? WHERE id = ?";
    db.query(query, [name, pronouns, bio, profile_pic, id], callback);
};

module.exports = { findUserByEmail, updateUserToken, getAllUsers, updateUser, findUserById };
