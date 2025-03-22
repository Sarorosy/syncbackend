const md5 = require("md5");
const userModel = require("../models/userModel");
const crypto = require("crypto");

// Login user
const loginUser = (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = md5(password); // Hash password using MD5

    // Find user by email
    userModel.findUserByEmail(email, (err, user) => {
        if (err) return res.status(500).json({ status:false , message: "Database error" });
        if (!user) return res.status(401).json({ status:false , message: "User not found" });

        // Compare hashed passwords
        if (user.password !== password) {
            return res.status(401).json({ status:false , message: "Invalid credentials" });
        }

        const token = crypto.randomBytes(16).toString("hex");

        // Update the user's token in the database
        userModel.updateUserToken(user.id, token, (err) => {
            if (err) return res.status(500).json({ status: false, message: "Failed to update token" });

            res.json({ status: true, message: "Login successful", token, data: user });
        });

    });
};

const getAllUsers = (req, res) => {
    userModel.getAllUsers((err, users) => {
        if (err) return res.status(500).json({ status: false, message: "Database error" });
        res.json({ status: true, data: users });
    });
};
module.exports = { loginUser , getAllUsers};
