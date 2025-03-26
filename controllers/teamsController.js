const teamModel = require("../models/teamsModel");
const { getIO } = require("../socket");
// Create a new team
const createTeam = (req, res) => {
    const { team_name, description, members } = req.body;

    if (!team_name || !description || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ status: false, message: "Team name, description, and members are required" });
    }

    teamModel.createTeam({ team_name, description, members }, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        const io = getIO();
        io.emit("team_created", team_name);
        res.json({ status: true, message: "Team created successfully", teamId: result.insertId });
    });
    
};

const getAllTeams = (req, res) => {
    teamModel.getAllTeams((err, teams) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, teams });
    });
};

// Get team by ID
const getTeamById = (req, res) => {
    const { id } = req.params;
    
    teamModel.getTeamById(id, (err, team) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        if (!team) return res.status(404).json({ status: false, message: "Team not found" });
        res.json({ status: true, team });
    });
};

// Get team by ID
const getTeamByUniqueId = (req, res) => {
    const { id } = req.params;
    
    teamModel.getTeamByUniqueId(id, (err, team) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        if (!team) return res.status(404).json({ status: false, message: "Team not found" });
        res.json({ status: true, team });
    });
};

// Update a team
const updateTeam = (req, res) => {
    const { id } = req.params;
    const { team_name, description, members } = req.body;

    if (!team_name || !description || !members || !Array.isArray(members)) {
        return res.status(400).json({ status: false, message: "Team name, description, and members are required" });
    }

    teamModel.updateTeam(id, { team_name, description, members }, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Team updated successfully" });
    });
};

// Delete a team
const deleteTeam = (req, res) => {
    const { id } = req.params;

    teamModel.deleteTeam(id, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Team deleted successfully" });
    });
};

// Get present teams based on user ID
const getPresentTeams = (req, res) => {
    const userId = req.user.id;

    teamModel.getPresentTeams(userId, (err, teams) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, teams });
    });
};
module.exports = { createTeam, getAllTeams, getTeamById, updateTeam, deleteTeam, getTeamByUniqueId, getPresentTeams };
