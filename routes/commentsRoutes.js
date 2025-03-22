const express = require("express");
const router = express.Router();
const commentsController = require("../controllers/commentsController");
const authenticateUser = require("../middlewares/authMiddleware");
const upload = require("../middlewares/commentuploadMiddleware"); // Middleware for image uploads
const path = require("path");
const fs = require("fs");


// Routes for comments
router.post("/create", authenticateUser, commentsController.createComment);
router.get("/:task_id", commentsController.getCommentsByTaskId);
router.delete("/:id", commentsController.deleteComment);

router.post("/upload-image", upload.single("image"), commentsController.uploadCommentImage);

module.exports = router;
