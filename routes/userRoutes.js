const express = require("express");
const { loginUser } = require("../controllers/userController");
const { getAllUsers } = require("../controllers/userController");
const { updateUser } = require("../controllers/userController");
const router = express.Router();

// Login route
router.post("/login", loginUser);

router.get("/fetchallusers", getAllUsers);

router.put("/update", updateUser);

module.exports = router;
