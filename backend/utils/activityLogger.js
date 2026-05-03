const { createId, withState } = require("./dataStore");

const logActivity = async (userId, type) => {
  try {
    if (!userId || !type) {
      return;
    }

    await withState((draft) => {
      draft.activities.push({
        id: createId(),
        userId,
        type,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
};

module.exports = {
  logActivity,
};
