const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");
const authenticateUser = require("../middlewares/authMiddleware");

// Routes for teams
router.post("/create", authenticateUser, teamsController.createTeam);
router.get("/", teamsController.getAllTeams);
router.get("/present-teams",authenticateUser, teamsController.getPresentTeams);
router.get("/:id", teamsController.getTeamById);
router.get("/unique/:id", teamsController.getTeamByUniqueId);
router.put("/:id", authenticateUser, teamsController.updateTeam);
router.delete("/:id", authenticateUser, teamsController.deleteTeam);

module.exports = router;
