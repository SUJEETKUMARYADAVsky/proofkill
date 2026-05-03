const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createId, loadState, withState } = require("../utils/dataStore");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const state = await loadState();
    const projects = state.projects
      .filter((project) => project.createdBy === req.user.id || project.createdBy === "seed")
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching projects.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, difficulty } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required.",
      });
    }

    const normalizedDifficulty = typeof difficulty === "string" ? difficulty.trim() : "Easy";

    if (!["Easy", "Medium", "Hard"].includes(normalizedDifficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be Easy, Medium, or Hard.",
      });
    }

    const project = {
      id: createId(),
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      difficulty: normalizedDifficulty,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await withState((draft) => {
      draft.projects.push(project);
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating project.",
    });
  }
});

router.put("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, difficulty } = req.body || {};

    const updates = {};

    if (typeof title === "string") {
      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        return res.status(400).json({
          success: false,
          message: "Project title cannot be empty.",
        });
      }

      updates.title = normalizedTitle;
    }

    if (typeof description === "string") {
      updates.description = description.trim();
    }

    if (typeof difficulty === "string") {
      const normalizedDifficulty = difficulty.trim();

      if (!["Easy", "Medium", "Hard"].includes(normalizedDifficulty)) {
        return res.status(400).json({
          success: false,
          message: "Difficulty must be Easy, Medium, or Hard.",
        });
      }

      updates.difficulty = normalizedDifficulty;
    }

    let updatedProject = null;

    await withState((draft) => {
      const project = draft.projects.find(
        (item) => item.id === projectId && item.createdBy === req.user.id
      );

      if (!project) {
        return;
      }

      Object.assign(project, updates, {
        updatedAt: new Date().toISOString(),
      });

      updatedProject = project;
    });

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating project.",
    });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const state = await loadState();

    const project = state.projects.find(
      (item) => item.id === projectId && (item.createdBy === req.user.id || item.createdBy === "seed")
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching project.",
    });
  }
});

module.exports = router;
