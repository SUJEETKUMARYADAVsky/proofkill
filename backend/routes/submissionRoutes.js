const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createSubmission,
  getAdminSubmissions,
  getUserSubmissions,
  getSubmissionById,
  reviewSubmission,
} = require("../controllers/submissionController");

const router = express.Router();

router.use(authMiddleware);

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Forbidden: admin access required.",
  });
};

router.post("/", createSubmission);

router.get("/user", getUserSubmissions);

router.get("/admin", requireAdmin, getAdminSubmissions);

router.get("/:id", (req, res, next) => {
  req.params.submissionId = req.params.id;
  return next();
}, getSubmissionById);

router.put("/review/:id", requireAdmin, reviewSubmission);

module.exports = router;
