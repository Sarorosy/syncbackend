const md5 = require("md5");
const userModel = require("../models/userModel");
const crypto = require("crypto");
const { getIO } = require("../socket");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/users");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Create 'uploads/users' folder if not exists
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user_${Date.now()}${ext}`); // Unique filename
    },
});

const upload = multer({ storage: storage });


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


const updateUser = (req, res) => {
    upload.single("profile_pic")(req, res, () => {
        const { id, name, pronouns, bio, email } = req.body;
        let profile_pic = req.file ? `/uploads/users/${req.file.filename}` : null;

        userModel.updateUser(id, { name, pronouns, bio, profile_pic }, (err, result) => {
            if (err) {
                console.error("Update error:", err);
                return res.status(500).json({ status: false, message: "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            userModel.findUserById(id, (err, updatedUser) => {
                if (err) {
                    console.error("Find user error:", err);
                    return res.status(500).json({ status: false, message: "Error fetching updated user" });
                }
                if (!updatedUser) {
                    console.error("User not found after update:", id);
                    return res.status(404).json({ status: false, message: "User not found after update" });
                }

                const io = getIO(); // Get the initialized io instance
                io.emit("user_updated", updatedUser);

                res.json({ status: true, message: "Profile updated successfully", updatedUser });
            });
        });
    });
};


module.exports = { loginUser , getAllUsers, updateUser};
