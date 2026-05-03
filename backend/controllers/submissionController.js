const { createId, loadState, withState } = require("../utils/dataStore");
const { logActivity } = require("../utils/activityLogger");

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const serializeSubmissionForUser = (submission, state) => ({
  id: submission.id,
  project: state.projects.find((project) => project.id === submission.projectId)?.title || "Untitled project",
  projectDescription: state.projects.find((project) => project.id === submission.projectId)?.description || "",
  projectCreatedAt: state.projects.find((project) => project.id === submission.projectId)?.createdAt || null,
  projectDifficulty: state.projects.find((project) => project.id === submission.projectId)?.difficulty || "Easy",
  githubLink: submission.githubLink,
  rating: submission.rating,
  status: submission.status,
  reviewedAt: submission.reviewedAt || null,
  feedback: submission.feedback,
});

const serializeSubmissionForAdmin = (submission, state) => ({
  id: submission.id,
  project: state.projects.find((project) => project.id === submission.projectId)?.title || "Untitled project",
  projectDescription: state.projects.find((project) => project.id === submission.projectId)?.description || "",
  githubLink: submission.githubLink,
  rating: submission.rating,
  status: submission.status,
  feedback: submission.feedback,
  submittedAt: submission.createdAt,
  reviewedAt: submission.reviewedAt || null,
  user: state.users.find((user) => user.id === submission.userId)
    ? {
        id: state.users.find((user) => user.id === submission.userId).id,
        name: state.users.find((user) => user.id === submission.userId).name,
        email: state.users.find((user) => user.id === submission.userId).email,
        role: state.users.find((user) => user.id === submission.userId).role,
      }
    : null,
});

const getUserSubmissions = async (req, res) => {
  try {
    const state = await loadState();
    const submissions = state.submissions
      .filter((submission) => submission.userId === req.user.id)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const data = submissions.map((submission) => serializeSubmissionForUser(submission, state));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get submissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching submissions.",
    });
  }
};

const getAdminSubmissions = async (req, res) => {
  try {
    const state = await loadState();
    const submissions = [...state.submissions].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );

    const data = submissions.map((submission) => serializeSubmissionForAdmin(submission, state));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get admin submissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admin submissions.",
    });
  }
};

const getSubmissionById = async (req, res) => {
  try {
    const { submissionId, id } = req.params;
    const targetId = submissionId || id;
    const state = await loadState();

    const submission = state.submissions.find(
      (item) => item.id === targetId && item.userId === req.user.id
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeSubmissionForUser(submission, state),
    });
  } catch (error) {
    console.error("Get submission by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching submission.",
    });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const reviewerRole = req.user && req.user.role;

    if (reviewerRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admin access required.",
      });
    }

    const { id } = req.params;
    const { rating, feedback } = req.body || {};

    if (typeof rating !== "number" || Number.isNaN(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number.",
      });
    }

    if (typeof feedback !== "string") {
      return res.status(400).json({
        success: false,
        message: "Feedback must be a string.",
      });
    }

    let updatedSubmission = null;

    await withState((draft) => {
      const submission = draft.submissions.find((item) => item.id === id);

      if (!submission) {
        return;
      }

      submission.status = "reviewed";
      submission.rating = rating;
      submission.feedback = feedback.trim();
      submission.reviewedAt = new Date().toISOString();
      updatedSubmission = submission;
    });

    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission reviewed successfully.",
      data: updatedSubmission,
    });
  } catch (error) {
    console.error("Review submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while reviewing submission.",
    });
  }
};

const createSubmission = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { projectId, githubLink, feedback } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (typeof projectId !== "string" || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid projectId is required.",
      });
    }

    if (typeof githubLink !== "string" || !githubLink.trim()) {
      return res.status(400).json({
        success: false,
        message: "GitHub link is required.",
      });
    }

    if (!isValidHttpUrl(githubLink.trim())) {
      return res.status(400).json({
        success: false,
        message: "GitHub link must be a valid URL.",
      });
    }

    const state = await loadState();
    const project = state.projects.find(
      (item) => item.id === projectId && (item.createdBy === userId || item.createdBy === "seed")
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const submission = {
      id: createId(),
      userId,
      projectId,
      githubLink: githubLink.trim(),
      status: "pending",
      rating: null,
      feedback: typeof feedback === "string" ? feedback.trim() : "",
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };

    await withState((draft) => {
      draft.submissions.push(submission);
    });

    await logActivity(userId, "submission");

    return res.status(201).json({
      success: true,
      message: "Submission created successfully.",
      data: submission,
    });
  } catch (error) {
    console.error("Create submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating submission.",
    });
  }
};

module.exports = {
  createSubmission,
  getAdminSubmissions,
  getUserSubmissions,
  getSubmissionById,
  reviewSubmission,
};
