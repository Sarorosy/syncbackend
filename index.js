require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socket = require("./socket");
const mysql = require("mysql2");
const cors = require("cors");
const admin = require("./firebaseAdmin");


const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/tasksRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const teamsRoutes = require("./routes/teamsRoutes");

// Initialize Express app and server
const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socket.init(server);

// Middleware
app.use(cors());
app.use(express.json());



// Use user routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/uploads/taskuploads", express.static("uploads/taskuploads"));
app.use("/uploads/commentuploads", express.static("uploads/commetuploads"));
app.use("/uploads/users", express.static("uploads/users"));
// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sarorosy',
    database: 'chat_app',
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
    console.log("Connected to MySQL database");
});

// Socket.IO Logic
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle incoming messages
    socket.on("send_message", (data) => {
        const { sender, receiver, message } = data;

        // Save message to the database
        const query = "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)";
        db.query(query, [sender, receiver, message], (err, results) => {
            if (err) {
                console.error("Failed to save message:", err);
                return;
            }
            console.log("Message saved to database");

            // Broadcast the message to all connected clients
            io.emit("receive_message", data);
        });
    });

    socket.on("update_task_title", (data) => {
        const { taskId, title, user_id } = data;

        if (!taskId) {
            console.error("Task ID required");
            return;
        }

        // Step 1: Check if the title has actually changed
        const checkTitleQuery = "SELECT title FROM tbl_tasks WHERE id = ?";
        db.query(checkTitleQuery, [taskId], (err, results) => {
            if (err) {
                console.error("Error fetching task title:", err);
                return;
            }

            if (results.length === 0) {
                console.error("Task not found");
                return;
            }

            const currentTitle = results[0].title;
            console.log("Current task title:", currentTitle);
            console.log("New task title:", title);
            if (currentTitle == title) {
                console.log("No changes detected in task title, skipping update.");
                return; // Skip update if the title is the same
            }

            // Step 2: Proceed with updating the task title in the database
            const updateQuery = "UPDATE tbl_tasks SET title = ? WHERE id = ?";
            db.query(updateQuery, [title, taskId], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating task:", updateErr);
                    return;
                }

                console.log("Task updated successfully");

                // Step 3: Check the last comment before adding a new one
                const checkCommentQuery = `
                    SELECT comment, user_id FROM tbl_comments
                    WHERE task_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 1
                `;

                db.query(checkCommentQuery, [taskId], (commentErr, commentResults) => {
                    if (commentErr) {
                        console.error("Error checking previous comment:", commentErr);
                        return;
                    }

                    // If the last comment is "Edited task title" by the same user, skip insertion
                    if (commentResults.length > 0 && commentResults[0].comment === "Edited task title" && commentResults[0].user_id === user_id) {
                        console.log("Skipping duplicate task edit comment");
                        return;
                    }

                    // Step 4: Insert comment if needed
                    const insertQuery = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
                    db.query(insertQuery, [taskId, user_id, "Edited task title", 1], (insertErr, insertResults) => {
                        if (insertErr) {
                            console.error("Error saving comment:", insertErr);
                            return;
                        }

                        console.log("Comment added successfully");

                        // Fetch and broadcast the new comment
                        const fetchQuery = `
                            SELECT c.*, u.name AS user_name, u.profile_pic 
                            FROM tbl_comments c 
                            JOIN tbl_users u ON c.user_id = u.id 
                            WHERE c.id = ?
                            ORDER BY c.created_at ASC
                        `;

                        db.query(fetchQuery, [insertResults.insertId], (fetchErr, fetchResults) => {
                            if (fetchErr) {
                                console.error("Error fetching comment details:", fetchErr);
                                return;
                            }

                            if (fetchResults.length > 0) {
                                io.emit("new_comment", fetchResults[0]);
                            }
                        });
                    });
                });

                // Step 5: Broadcast task update to all clients
                io.emit("task_updated", { taskId, title });
            });
        });
    });

    socket.on("updated_tags", (data) => {
        const { taskId, tags } = data;
    
        if (!taskId || !Array.isArray(tags)) {
            console.error("Invalid data for tag update");
            return;
        }
    
        // Convert tags array to JSON string for MySQL storage
        const tagsJson = JSON.stringify(tags);
    
        const updateQuery = "UPDATE tbl_tasks SET tags = ? WHERE id = ?";
        db.query(updateQuery, [tagsJson, taskId], (err, result) => {
            if (err) {
                console.error("Error updating task tags:", err);
                return;
            }
    
            console.log("Task tags updated successfully", tags);
    
            // Broadcast update to all connected clients
            io.emit("task_tags_updated", { taskId, tags });
        });
    });
    

    socket.on("edit_task_title", (data) => {
        const { taskId, title, user_id } = data;

        io.emit("task_updated", { taskId, title });
    });


    socket.on("comment_added", (data) => {
        const { taskId, comment, user_id, islog = 0 } = data;

        if (!taskId || !comment.trim()) {
            console.error("Task ID and Comment are required");
            return;
        }

        // Insert into database
        const query = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
        db.query(query, [taskId, user_id, comment, islog], (err, results) => {
            if (err) {
                console.error("Error saving comment:", err);
                return;
            }

            const commentId = results.insertId;
            console.log("Comment added successfully");

            // Fetch the comment with user details
            const fetchQuery = `
                SELECT c.*, u.name AS user_name, u.profile_pic 
                FROM tbl_comments c 
                JOIN tbl_users u ON c.user_id = u.id 
                WHERE c.id = ?
                ORDER BY c.created_at ASC
            `;

            db.query(fetchQuery, [commentId], (fetchErr, fetchResults) => {
                if (fetchErr) {
                    console.error("Error fetching comment details:", fetchErr);
                    return;
                }

                if (fetchResults.length > 0) {
                    const newComment = fetchResults[0];
                    console.log("New comment:", newComment);
                    // Broadcast the new comment to all clients
                    io.emit("new_comment", newComment);
                }
            });
        });
    });



    socket.on("update_task_description", (data) => {
        const { taskId, description, user_id } = data;
        const trimmedDescription = description.trim();

        if (!taskId) {
            console.error("Task ID required");
            return;
        }

        // Get the current description
        const fetchQuery = "SELECT description FROM tbl_tasks WHERE id = ?";
        db.query(fetchQuery, [taskId], (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error("Error fetching task:", fetchErr);
                return;
            }

            if (fetchResults.length === 0) {
                console.error("Task not found");
                return;
            }

            const currentDescription = fetchResults[0].description.trim();

            // Update only if different
            if (currentDescription !== trimmedDescription) {
                const updateQuery = "UPDATE tbl_tasks SET description = ? WHERE id = ?";
                db.query(updateQuery, [trimmedDescription, taskId], (err) => {
                    if (err) {
                        console.error("Error updating task:", err);
                        return;
                    }
                    console.log("Task description updated successfully");

                    // Check last comment
                    const checkQuery = `
                        SELECT comment, user_id FROM tbl_comments
                        WHERE task_id = ? 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `;
                    db.query(checkQuery, [taskId], (checkErr, checkResults) => {
                        if (checkErr) {
                            console.error("Error checking previous comment:", checkErr);
                            return;
                        }

                        if (checkResults.length > 0 && checkResults[0].comment === "Edited task description" && checkResults[0].user_id === user_id) {
                            console.log("Skipping duplicate task edit comment");
                            return;
                        }

                        // Insert comment
                        const insertQuery = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
                        db.query(insertQuery, [taskId, user_id, "Edited task description", 1], (insertErr, insertResults) => {
                            if (insertErr) {
                                console.error("Error saving comment:", insertErr);
                                return;
                            }

                            const commentId = insertResults.insertId;
                            console.log("Comment added successfully");

                            // Fetch and broadcast the new comment
                            const fetchCommentQuery = `
                                SELECT c.*, u.name AS user_name, u.profile_pic 
                                FROM tbl_comments c 
                                JOIN tbl_users u ON c.user_id = u.id 
                                WHERE c.id = ?
                            `;
                            db.query(fetchCommentQuery, [commentId], (fetchErr, fetchResults) => {
                                if (fetchErr) {
                                    console.error("Error fetching comment details:", fetchErr);
                                    return;
                                }

                                if (fetchResults.length > 0) {
                                    io.emit("new_comment", fetchResults[0]);
                                }
                            });
                        });
                    });

                    // Broadcast the update
                    io.emit("task_description_updated", { taskId, description: trimmedDescription });
                });
            }
        });
    });


    socket.on("edit_task_description", (data) => {
        const { taskId, description } = data;

        io.emit("task_description_updated", { taskId, description });
    });

    socket.on("update_task_duedate", (data) => {
        const { taskId, dueDate, user_id } = data;

        if (!taskId) {
            console.error("Task ID required");
            return;
        }

        // Step 1: Check if the title has actually changed
        const checkTitleQuery = "SELECT due_date FROM tbl_tasks WHERE id = ?";
        db.query(checkTitleQuery, [taskId], (err, results) => {
            if (err) {
                console.error("Error fetching task title:", err);
                return;
            }

            if (results.length === 0) {
                console.error("Task not found");
                return;
            }

            const currentDueDate = results[0].due_date;
            console.log("Current task title:", currentDueDate);
            console.log("New task title:", dueDate);
            if (currentDueDate == dueDate) {
                console.log("No changes detected in task Due_date, skipping update.");
                return; 
            }

            // Step 2: Proceed with updating the task title in the database
            const updateQuery = "UPDATE tbl_tasks SET due_date = ? WHERE id = ?";
            db.query(updateQuery, [dueDate, taskId], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating task:", updateErr);
                    return;
                }

                console.log("Task updated successfully");

                const insertQuery = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
                db.query(insertQuery, [taskId, user_id, "Changed due date to " + dueDate, 1], (insertErr, insertResults) => {
                    if (insertErr) {
                        console.error("Error saving comment:", insertErr);
                        return;
                    }

                    console.log("Comment added successfully");

                    // Fetch and broadcast the new comment
                    const fetchQuery = `
                        SELECT c.*, u.name AS user_name, u.profile_pic 
                        FROM tbl_comments c 
                        JOIN tbl_users u ON c.user_id = u.id 
                        WHERE c.id = ?
                        ORDER BY c.created_at ASC
                    `;

                    db.query(fetchQuery, [insertResults.insertId], (fetchErr, fetchResults) => {
                        if (fetchErr) {
                            console.error("Error fetching comment details:", fetchErr);
                            return;
                        }

                        if (fetchResults.length > 0) {
                            io.emit("new_comment", fetchResults[0]);
                        }
                    });
                });

                io.emit("task_duedate_updated", { taskId, dueDate });
            });
        });
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});

app.get("/api/messages", (req, res) => {
    const { sender, receiver } = req.query;

    const query = `
        SELECT * FROM messages
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
        ORDER BY id ASC
    `;

    db.query(query, [sender, receiver, receiver, sender], (err, results) => {
        if (err) {
            console.error("Failed to fetch messages:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.json(results);
    });
});

app.get('/api/users', (req, res) => {
    // Fetch users from the database
    db.query('SELECT * FROM tbl_users', (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching users');
        }
        res.json(result);
    });
});

app.post('/api/saveFcmToken', (req, res) => {
    const { user_id, token } = req.body;

    if (!user_id || !token) {
        return res.status(400).json({ error: 'user_id and token are required' });
    }

    const query = `
        INSERT INTO tbl_fcmtokens (user_id, token) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE token = VALUES(token)
    `;

    db.query(query, [user_id, token], (err, result) => {
        if (err) {
            console.error('Error saving FCM token:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ message: 'FCM token saved successfully' });
    });
});


// API Endpoint to Delete User
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // Query to delete user by ID
    const query = 'DELETE FROM tbl_users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).send('Error deleting user');
        }
        res.status(200).send('User deleted successfully');
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
