const express = require("express");
const router = express.Router();
const taskController = require("../controllers/tasksController");
const upload = require("../middlewares/uploadMiddleware"); // Middleware for image uploads
const path = require("path");
const fs = require("fs");

// Define task routes
router.post("/create", taskController.createTask);
router.get("/", taskController.getAllTasks);
router.get("/tasks/:id", taskController.getTaskById);
router.get("/:unique_id", taskController.getTaskByUniqueId);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

// Image Upload Route
router.post("/upload-image", upload.single("image"), taskController.uploadTaskImage);

// Fetch Image Route
router.get("/fetch-image/:filename", (req, res) => {
    const filePath = path.join(__dirname, "../uploads/taskuploads", req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ status: false, message: "Image not found" });
    }
});

module.exports = router;
