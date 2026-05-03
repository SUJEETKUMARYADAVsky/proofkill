import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/insightsService";

const badgeToneClasses = {
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

const levelHelpText = {
  Beginner: "0-2 projects",
  Intermediate: "3-5 projects",
  Advanced: "6-9 projects",
  Pro: "10+ projects",
};

const formatDate = (value) => {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const Profile = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getDashboard(token);
        const data = response && (response.data || response);
        setDashboard(data || null);
      } catch (err) {
        setError(err.message || "Could not load profile dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const summary = dashboard?.summary || {};
  const user = dashboard?.user || {};
  const badges = dashboard?.badges || [];
  const submissions = dashboard?.submissions || [];
  const leaderboard = dashboard?.leaderboard || [];
  const recommendedNextProject = dashboard?.recommendedNextProject || null;

  const sortedSubmissions = useMemo(() => {
    return [...(submissions || [])].sort((a, b) => {
      const aReviewed = a.status === "reviewed" ? 0 : 1;
      const bReviewed = b.status === "reviewed" ? 0 : 1;
      if (aReviewed !== bReviewed) return aReviewed - bReviewed;

      const aDate = new Date(a.reviewedAt || a.submittedAt || 0).getTime();
      const bDate = new Date(b.reviewedAt || b.submittedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [submissions]);

  const nextProjectButtonLabel = recommendedNextProject ? "Start Next Project" : "No project available";

  const profileHeadline = useMemo(() => {
    if (!summary.level?.name) {
      return "Beginner";
    }

    return summary.level.name;
  }, [summary.level]);

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const copyProfileLink = async () => {
    const uname = user.username || slugify(user.name || user.email || "user");
    const url = `${window.location.origin}/u/${uname}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard");
    } catch (err) {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      alert("Profile link copied to clipboard");
    }
  };

  const goToProjects = () => navigate("/projects");

  if (loading) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          Loading profile dashboard...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-sm">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Profile</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Your progress dashboard</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            See what you completed, what comes next, and which milestones you have unlocked.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {profileHeadline}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{user.name || user.email || "Your profile"}</h2>
                  <button
                    type="button"
                    onClick={copyProfileLink}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Copy Profile Link
                  </button>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Complete real tasks, earn visible rewards, and keep moving toward the next level.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Projects Completed: {summary.completedProjects || 0}
                  </span>
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                    🔥 {summary.currentStreakDays || 0}-day streak
                  </span>
                  <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                    Level: {summary.level?.name || "Beginner"}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-sm rounded-[24px] bg-slate-950 p-5 text-slate-100 shadow-lg shadow-slate-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Next milestone</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {summary.nextMilestone?.progressLabel || "0/3 completed"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {summary.nextMilestone?.target
                    ? `Finish ${summary.nextMilestone.target - (summary.nextMilestone.current || 0)} more project(s) to level up.`
                    : "You have reached the top progression band. Keep the streak alive."}
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  {levelHelpText[summary.level?.name] || "0-2 projects"}
                </div>
              </div>
            </div>

            {recommendedNextProject && (
              <div className="mt-8 rounded-[24px] border border-teal-100 bg-teal-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Recommended next project</p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{recommendedNextProject.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {recommendedNextProject.description || "No description provided."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/submit/${recommendedNextProject.id}`)}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {nextProjectButtonLabel}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Projects Completed</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.completedProjects || 0}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current Streak (days)</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.currentStreakDays || 0}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Next Milestone</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{summary.nextMilestone?.progressLabel || "0/3 completed"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Level</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{summary.level?.name || "Beginner"}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Badges</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Visible rewards</h3>
                </div>
                <span className="text-sm text-slate-500">{badges.length} earned</span>
              </div>

              {badges.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Earn your first badge by submitting a project.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${badgeToneClasses[badge.tone] || badgeToneClasses.emerald}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Leaderboard</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Top users</h3>
                </div>
                <span className="text-sm text-slate-500">Top 5 only</span>
              </div>

              {leaderboard.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Leaderboard will appear once more users submit work.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {entry.rank}. {entry.name}
                        </p>
                        <p className="text-sm text-slate-500">{entry.completedProjects} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950">Avg rating: {entry.averageRating}</p>
                        <p className="text-xs text-slate-500">Competition drives growth</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">My Projects</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">My Work</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToProjects}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start New Project
              </button>
            </div>
          </div>

          {sortedSubmissions.length === 0 ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">No projects submitted yet. Start building to showcase your skills.</p>
              <button
                type="button"
                onClick={goToProjects}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                Start New Project
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {sortedSubmissions.map((submission) => (
                <article
                  key={submission.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeToneClasses[submission.projectDifficulty === "Medium" ? "amber" : "emerald"]}`}>{submission.projectDifficulty || "Easy"}</span>
                        <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          {summary.level?.name || "Beginner"}
                        </span>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-slate-950">{submission.project}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{submission.projectDescription || "Submitted work for review."}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        submission.status === "reviewed"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                      }`}
                    >
                      {submission.status === "reviewed" ? "Reviewed" : "Pending"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(submission.badges || []).map((badge) => (
                      <span
                        key={`${submission.id}-${badge.label}`}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeToneClasses[badge.tone] || badgeToneClasses.emerald}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-950">Submitted:</span> {formatDate(submission.submittedAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">Reviewed:</span> {formatDate(submission.reviewedAt)}
                    </p>
                  </div>

                  {submission.status === "reviewed" && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Feedback</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {submission.feedback || "No feedback provided."}
                      </p>
                    </div>
                  )}

                  {typeof submission.rating === "number" && submission.status === "reviewed" && (
                    <div className="mt-4 inline-flex items-center gap-2">
                      <div className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">Rating: {submission.rating}/5</div>
                      <div className="text-sm text-slate-600">{Array.from({ length: submission.rating }).map((_, i) => (
                        <span key={i} className="text-amber-500">★</span>
                      ))}</div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {submission.githubLink && (
                      <a
                        href={submission.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                      >
                        View Project
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={goToProjects}
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Start New Project
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Return trigger</p>
          <h3 className="mt-2 text-xl font-semibold text-white">New project, new streak, new reward.</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Come back when a review lands, a new project is added, or your next milestone is within reach.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Profile;
