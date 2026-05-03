const express = require("express");
const { loadState } = require("../utils/dataStore");

const router = express.Router();

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const showAll = req.query.all === "true";

    const state = await loadState();
    const user = state.users.find((entry) => entry.username === String(username).toLowerCase());

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const submissions = state.submissions
      .filter((submission) => submission.userId === user.id)
      .filter((submission) => (showAll ? true : submission.status === "reviewed"))
      .map((submission) => ({
        id: submission.id,
        projectId: submission.projectId,
        project: state.projects.find((project) => project.id === submission.projectId)?.title || "Untitled project",
        githubLink: submission.githubLink,
        rating: submission.rating,
        feedback: submission.feedback,
        reviewedAt: submission.reviewedAt,
        createdAt: submission.createdAt,
      }))
      .sort(
        (left, right) =>
          new Date(right.reviewedAt || right.createdAt || 0) - new Date(left.reviewedAt || left.createdAt || 0)
      );

    const ratedSubmissions = submissions.filter((submission) => typeof submission.rating === "number");
    const averageRating =
      ratedSubmissions.length > 0
        ? Math.round(
            (ratedSubmissions.reduce((total, submission) => total + submission.rating, 0) / ratedSubmissions.length) * 10
          ) / 10
        : null;

    const reviewedDates = submissions
      .filter((submission) => submission.reviewedAt)
      .map((submission) => new Date(submission.reviewedAt).toISOString().slice(0, 10))
      .sort()
      .reverse();

    let streak = 0;
    let checkDate = new Date();

    for (const reviewedDate of reviewedDates) {
      const currentDateKey = checkDate.toISOString().slice(0, 10);

      if (reviewedDate !== currentDateKey) {
        break;
      }

      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio || "",
        totalProjects: submissions.length,
        averageRating,
        streak,
        submissions,
      },
    });
  } catch (error) {
    console.error("Public profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;
