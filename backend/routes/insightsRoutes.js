const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { loadState } = require("../utils/dataStore");

const router = express.Router();

router.use(authMiddleware);

const LEVELS = [
  { name: "Beginner", min: 0, max: 2 },
  { name: "Intermediate", min: 3, max: 5 },
  { name: "Advanced", min: 6, max: 9 },
  { name: "Pro", min: 10, max: Infinity },
];

const getLevel = (completedProjects) =>
  LEVELS.find((level) => completedProjects >= level.min && completedProjects <= level.max) || LEVELS[0];

const formatDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const getCurrentStreak = (activities) => {
  const uniqueDays = [...new Set(activities.map((activity) => formatDateKey(activity.createdAt)))].sort(
    (left, right) => right.localeCompare(left)
  );

  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let index = 0; index < 366; index += 1) {
    const candidate = new Date(today);
    candidate.setUTCDate(today.getUTCDate() - index);
    const candidateKey = formatDateKey(candidate);

    if (uniqueDays.includes(candidateKey)) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
};

const buildBadges = ({ submissions, streak, state }) => {
  const oldestSubmission = submissions[submissions.length - 1] || null;
  const firstSubmissionId = oldestSubmission ? oldestSubmission.id : null;
  const summary = [];

  const mapped = submissions.map((submission) => {
    const badges = [];
    const project = state.projects.find((item) => item.id === submission.projectId);
    const isFirstSubmission = firstSubmissionId && submission.id === firstSubmissionId;
    const projectCreatedAt = project ? new Date(project.createdAt) : null;
    const submittedAt = submission.createdAt ? new Date(submission.createdAt) : null;
    const fastFinisher =
      projectCreatedAt && submittedAt && submittedAt.getTime() - projectCreatedAt.getTime() <= 24 * 60 * 60 * 1000;
    const topRated = typeof submission.rating === "number" && submission.rating >= 4;
    const consistency = streak >= 3;

    if (isFirstSubmission) {
      badges.push({ label: "First Submission", tone: "emerald" });
      summary.push({ label: "First Submission", tone: "emerald" });
    }

    if (fastFinisher) {
      badges.push({ label: "Fast Finisher", tone: "amber" });
      summary.push({ label: "Fast Finisher", tone: "amber" });
    }

    if (topRated) {
      badges.push({ label: "Top Rated", tone: "rose" });
      summary.push({ label: "Top Rated", tone: "rose" });
    }

    if (consistency) {
      badges.push({ label: "Consistency", tone: "sky" });
      summary.push({ label: "Consistency", tone: "sky" });
    }

    return {
      id: submission.id,
      project: project ? project.title : "Untitled project",
      projectDescription: project ? project.description : "",
      projectCreatedAt: project ? project.createdAt : null,
      projectDifficulty: project ? project.difficulty : "Easy",
      githubLink: submission.githubLink,
      rating: submission.rating,
      status: submission.status,
      feedback: submission.feedback,
      submittedAt: submission.createdAt,
      reviewedAt: submission.reviewedAt || null,
      badges,
    };
  });

  const uniqueSummary = Array.from(new Map(summary.map((badge) => [badge.label, badge])).values());

  return { submissions: mapped, summary: uniqueSummary };
};

const getLeaderboard = (state) => {
  const stats = new Map();

  for (const submission of state.submissions) {
    const current = stats.get(submission.userId) || {
      completedProjects: 0,
      ratingSum: 0,
      ratedCount: 0,
    };

    if (submission.status === "reviewed") {
      current.completedProjects += 1;
    }

    if (typeof submission.rating === "number") {
      current.ratingSum += submission.rating;
      current.ratedCount += 1;
    }

    stats.set(submission.userId, current);
  }

  return [...stats.entries()]
    .map(([userId, entry]) => {
      const user = state.users.find((item) => item.id === userId);
      const averageRating = entry.ratedCount > 0 ? Number((entry.ratingSum / entry.ratedCount).toFixed(1)) : 0;

      return {
        id: userId,
        name: user ? user.name : "Unknown user",
        email: user ? user.email : "",
        completedProjects: entry.completedProjects,
        averageRating,
      };
    })
    .sort((left, right) => right.completedProjects - left.completedProjects || right.averageRating - left.averageRating)
    .slice(0, 5)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

router.get("/dashboard", async (req, res) => {
  try {
    const state = await loadState();
    const user = state.users.find((item) => item.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const submissions = state.submissions
      .filter((submission) => submission.userId === req.user.id)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const projects = state.projects
      .filter((project) => project.createdBy === req.user.id || project.createdBy === "seed")
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const completedProjects = submissions.filter((submission) => submission.status === "reviewed").length;
    const level = getLevel(completedProjects);
    const streak = getCurrentStreak(state.activities.filter((activity) => activity.userId === req.user.id));
    const { submissions: decoratedSubmissions, summary: badges } = buildBadges({ submissions, streak, state });
    const submittedProjectIds = new Set(submissions.map((submission) => submission.projectId));
    const recommendedNextProject =
      projects.find((project) => !submittedProjectIds.has(project.id)) || projects[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        summary: {
          completedProjects,
          totalSubmissions: submissions.length,
          currentStreakDays: streak,
          level: {
            name: level.name,
            min: level.min,
            max: level.max === Infinity ? null : level.max,
          },
          nextMilestone: (() => {
            const milestones = [3, 5, 10, 15];
            const target = milestones.find((milestone) => completedProjects < milestone);

            if (!target) {
              return {
                current: completedProjects,
                target: null,
                text: "Pro status maintained",
                progressLabel: `${completedProjects}+ completed`,
              };
            }

            return {
              current: completedProjects,
              target,
              text: `${completedProjects}/${target} completed`,
              progressLabel: `${completedProjects}/${target} completed`,
            };
          })(),
        },
        badges,
        submissions: decoratedSubmissions,
        leaderboard: getLeaderboard(state),
        recommendedNextProject: recommendedNextProject
          ? {
              id: recommendedNextProject.id,
              title: recommendedNextProject.title,
              description: recommendedNextProject.description,
              difficulty: recommendedNextProject.difficulty || "Easy",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while loading dashboard.",
    });
  }
});

module.exports = router;
