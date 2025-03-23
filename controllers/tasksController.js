const taskModel = require("../models/tasksModel");
const sendNotification = require('../sendNotification');

// Create a new task
const createTask = (req, res) => {
    const { title, description, assigned_to, followers, status, priority, due_date, due_time, created_by, image_url } = req.body;

    if (!title || !created_by) {
        return res.status(400).json({ status: false, message: "Title and Created By fields are required" });
    }

    // Ensure description is stored as a JSON string if it contains an object
    const taskDescription = typeof description === "object" ? JSON.stringify(description) : description;

    // ✅ Convert due_date to MySQL format (YYYY-MM-DD)
    let formattedDueDate = null;
    if (due_date) {
        formattedDueDate = new Date(due_date).toISOString().split("T")[0]; // Extracts 'YYYY-MM-DD'
    }

    const newTask = { 
        title, 
        description: taskDescription,
        assigned_to, 
        followers, 
        status, 
        priority, 
        due_date: formattedDueDate, // Fixed format
        due_time, 
        created_by, 
        image_url: image_url || null 
    };

    taskModel.createTask(newTask, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Task created successfully", taskId: result.insertId });

        const userFCMToken = "eO-tyaqrkWkBfQPj5eMrsM:APA91bEfqbpMzOOKCCKiW_ofi35FYqqzU-aV9dtB0Vbt_3h6MLU0H1qvBC352_1sgVQAfPLEnOXQN8GrGV0RIhQXQBxiT7zxhhm7vkvddqOgOqbOj9lxCIk";
        const title = "New Task Assigned!";
        const description = "You have been assigned a new task. Check it now!";
        const customData = { taskId: "12345", priority: "high" };

        sendNotification(userFCMToken, title, description, customData)
            .then(response => console.log("Notification Response:", response))
            .catch(error => console.error("Notification Error:", error));
    });
};

// Get all tasks
const getAllTasks = (req, res) => {
    taskModel.getAllTasks((err, tasks) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, tasks });
    });
};

// Get a single task by ID
const getTaskById = (req, res) => {
    const { id } = req.params;

    taskModel.getTaskById(id, (err, tasks) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        if (tasks.length === 0) return res.status(404).json({ status: false, message: "Task not found" });
        res.json({ status: true, task: tasks[0] });
    });
};
// Get a single task by ID
const getTaskByUniqueId = (req, res) => {
    const { unique_id } = req.params;

    taskModel.getTaskByUniqueId(unique_id, (err, tasks) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        if (tasks.length === 0) return res.status(404).json({ status: false, message: "Task not found" });
        res.json({ status: true, task: tasks[0] });
    });
};

// Update a task
const updateTask = (req, res) => {
    const { id } = req.params;
    const updatedTask = req.body;

    taskModel.updateTask(id, updatedTask, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Task updated successfully" });
    });
};

// Delete a task
const deleteTask = (req, res) => {
    const { id } = req.params;

    taskModel.deleteTask(id, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Task deleted successfully" });
    });
};

const uploadTaskImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, message: "No image uploaded" });
    }
    res.json({
        success: 1, // This is required by EditorJS
        file: {
            url: `http://localhost:5000/uploads/taskuploads/${req.file.filename}`, // Correct format
        },
    });
};

module.exports = { createTask, getAllTasks, getTaskById,getTaskByUniqueId, updateTask, deleteTask, uploadTaskImage };
