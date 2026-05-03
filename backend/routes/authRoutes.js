const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createId, loadState, withState } = require("../utils/dataStore");
const { logActivity } = require("../utils/activityLogger");

const router = express.Router();

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isObjectBody = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const jwtOptions = {
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  algorithm: "HS256",
  issuer: process.env.JWT_ISSUER || "auth-api",
  audience: process.env.JWT_AUDIENCE || "auth-client",
};

router.post("/register", async (req, res) => {
  try {
    if (!isObjectBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object.",
      });
    }

    const { name, email, password, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password must be strings.",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedUsername = typeof username === "string" && username.trim() ? String(username).toLowerCase().trim() : null;

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const state = await loadState();
    const existingUser = state.users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // validate or generate username
    let finalUsername = normalizedUsername;
    const isValidUsername = (u) => /^[a-z0-9-_]+$/.test(u);

    if (finalUsername && !isValidUsername(finalUsername)) {
      return res.status(400).json({ success: false, message: "Username can only contain lower-case letters, numbers, hyphen and underscore." });
    }

    if (finalUsername) {
      const usernameTaken = state.users.find((u) => u.username === finalUsername);
      if (usernameTaken) {
        return res.status(409).json({ success: false, message: "Username already taken." });
      }
    } else {
      // generate from name
      const base = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      let candidate = base || `user${Math.floor(Math.random() * 10000)}`;
      let suffix = 0;
      while (state.users.find((u) => u.username === candidate)) {
        suffix += 1;
        candidate = `${base}-${suffix}`;
      }
      finalUsername = candidate;
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    await withState((draft) => {
      draft.users.push({
        id: createId(),
        name: normalizedName,
        username: finalUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: "student",
        createdAt: new Date().toISOString(),
      });
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while registering user.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!isObjectBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password must be strings.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const state = await loadState();
    const user = state.users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(String(password), user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      jwtOptions
    );

    await logActivity(user._id, "login");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while logging in.",
    });
  }
});

module.exports = router;
