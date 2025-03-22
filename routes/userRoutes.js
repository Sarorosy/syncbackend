const express = require("express");
const { loginUser } = require("../controllers/userController");
const { getAllUsers } = require("../controllers/userController");
const router = express.Router();

// Login route
router.post("/login", loginUser);

router.get("/fetchallusers", getAllUsers);

module.exports = router;
