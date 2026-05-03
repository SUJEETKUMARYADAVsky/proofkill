const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const dataFilePath = path.join(__dirname, "..", "data", "db.json");

const createId = () => crypto.randomUUID().replace(/-/g, "");

const createSeedState = () => ({
  users: [
    {
      id: createId(),
      name: "Test User",
      email: "test+bot@example.com",
      password: bcrypt.hashSync("password", 10),
      role: "student",
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: createId(),
      title: "Build REST API",
      description:
        "Design and implement a production-ready REST API with authentication, validation, and clean resource routes.",
      difficulty: "Medium",
      createdBy: "seed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Create Login System",
      description:
        "Build a secure login and registration flow with password hashing, token-based sessions, and protected routes.",
      difficulty: "Easy",
      createdBy: "seed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Build Todo App",
      description:
        "Create a task manager with add, edit, complete, and delete actions plus a tidy responsive UI.",
      difficulty: "Easy",
      createdBy: "seed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Create Blog Backend",
      description:
        "Implement a blog backend with posts, categories, author management, and CRUD endpoints for content workflows.",
      difficulty: "Medium",
      createdBy: "seed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  submissions: [],
  activities: [],
});

let cachedState = null;

const ensureDir = async () => {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
};

const loadState = async () => {
  if (cachedState) {
    return cachedState;
  }

  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    cachedState = JSON.parse(raw);
  } catch (error) {
    cachedState = createSeedState();
    await saveState(cachedState);
  }

  cachedState.users = cachedState.users || [];
  cachedState.projects = cachedState.projects || [];
  cachedState.submissions = cachedState.submissions || [];
  cachedState.activities = cachedState.activities || [];

  return cachedState;
};

const saveState = async (state) => {
  cachedState = state;
  await ensureDir();
  await fs.writeFile(dataFilePath, JSON.stringify(state, null, 2), "utf8");
};

const withState = async (updater) => {
  const state = await loadState();
  const result = await updater(state);
  await saveState(state);
  return result;
};

module.exports = {
  createId,
  loadState,
  saveState,
  withState,
  dataFilePath,
};
