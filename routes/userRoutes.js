const express = require("express");
const { loginUser } = require("../controllers/userController");
const { getAllUsers } = require("../controllers/userController");
const { updateUser } = require("../controllers/userController");
const {addUser , editUser, deleteUser} = require('../controllers/userController');
const { getUserById } = require("../controllers/userController");


const router = express.Router();

// Login route
router.post("/login", loginUser);

router.get("/fetchallusers", getAllUsers);

router.put("/update", updateUser);

router.post("/add", addUser);

// Edit user
router.put("/edit", editUser);

router.get("/user/:id", getUserById);

// Delete user (soft delete)
router.delete("/delete/:id", deleteUser);

module.exports = router;
