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
app.use("/uploads/taskuploads", express.static("uploads/taskuploads"));
app.use("/uploads/commentuploads", express.static("uploads/commetuploads"));
app.use("/uploads/users", express.static("uploads/users"));
// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
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
    
        // Update the task title in database
        const query = "UPDATE tbl_tasks SET title = ? WHERE id = ?";
        db.query(query, [title, taskId], (err, results) => {
            if (err) {
                console.error("Error updating task:", err);
                return;
            }
            console.log("Task updated successfully");
    
            if (!taskId) {
                console.error("Task ID required");
                return;
            }
    
            // Check the last comment for the same task and user
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
    
                // If the last comment is "Edited task title" by the same user, do not insert
                if (checkResults.length > 0 && checkResults[0].comment === "Edited task title" && checkResults[0].user_id === user_id) {
                    console.log("Skipping duplicate task edit comment");
                    return;
                }
    
                // Insert into database
                const insertQuery = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
                db.query(insertQuery, [taskId, user_id, "Edited task title", 1], (insertErr, insertResults) => {
                    if (insertErr) {
                        console.error("Error saving comment:", insertErr);
                        return;
                    }
    
                    const commentId = insertResults.insertId;
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
    
            // Broadcast the update to all clients
            io.emit("task_updated", { taskId, title });
        });
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

        // Update the task title in database
        const query = "UPDATE tbl_tasks SET description = ? WHERE id = ?";
        db.query(query, [description, taskId], (err, results) => {
            if (err) {
                console.error("Error updating task:", err);
                return;
            }
            console.log("Task updated successfully");

            if (!taskId) {
                console.error("Task ID required");
                return;
            }
    
            // Check the last comment for the same task and user
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
    
                // If the last comment is "Edited task title" by the same user, do not insert
                if (checkResults.length > 0 && checkResults[0].comment === "Edited task description" && checkResults[0].user_id === user_id) {
                    console.log("Skipping duplicate task edit comment");
                    return;
                }
    
                // Insert into database
                const insertQuery = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
                db.query(insertQuery, [taskId, user_id, "Edited task description", 1], (insertErr, insertResults) => {
                    if (insertErr) {
                        console.error("Error saving comment:", insertErr);
                        return;
                    }
    
                    const commentId = insertResults.insertId;
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

            // Broadcast the update to all clients
            io.emit("task_description_updated", { taskId, description });
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
