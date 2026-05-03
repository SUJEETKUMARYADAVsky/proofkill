import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSubmission } from "../services/submissionService";
import { getProject } from "../services/projectService";
import { getDashboard } from "../services/insightsService";
import { useAuth } from "../context/AuthContext";

const Submit = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [recommendedNextProject, setRecommendedNextProject] = useState(null);
  const [githubLink, setGithubLink] = useState("");
  const [feedback, setFeedback] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      await createSubmission({ projectId: id, githubLink, feedback }, token);
      setMessage("Submission sent successfully. Next step: get reviewed in 24h.");
      setGithubLink("");
      setFeedback("");
    } catch (err) {
      setError(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getDashboard(token);
        const data = response && (response.data || response);
        setRecommendedNextProject(data?.recommendedNextProject || null);
      } catch (err) {
        setRecommendedNextProject(null);
      }
    };

    const loadProject = async (projectId) => {
      setProjectLoading(true);
      try {
        const res = await getProject(projectId, token);
        const project = res && (res.data || res);
        setProjectTitle(project?.title || "");
        setProjectId(projectId);
      } catch (err) {
        setProjectTitle("");
        setProjectId(projectId);
      } finally {
        setProjectLoading(false);
      }
    };

    loadDashboard();
    if (id) loadProject(id);
  }, [id, token]);

  return (
    <section className="min-h-[calc(100vh-6rem)] px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Submission portal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Submit your work
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Share your GitHub repository for the selected project. The card below keeps the project context visible while you submit.
            </p>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Current project
            </div>
            <div className="mt-1 font-medium">
              {projectLoading
                ? "Loading project..."
                : projectTitle || projectId || "No project selected"}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-slate-950">Project ID:</span>{" "}
              <span className="font-mono text-slate-600">
                {projectId || "(no project specified)"}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="githubLink"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  GitHub Link
                </label>
                <input
                  id="githubLink"
                  type="url"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="feedback"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Feedback <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  placeholder="Add notes, context, or anything helpful for review"
                  className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || projectLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? "Submitting..." : "Submit Work"}
              </button>

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>
          </form>

          <aside className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">
              Submission checklist
            </p>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-semibold text-white">Project locked</span>
                <span className="mt-1 block">Your submission is tied to the project in the URL.</span>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-semibold text-white">GitHub required</span>
                <span className="mt-1 block">Paste a valid repository URL before submitting.</span>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="block font-semibold text-white">Feedback optional</span>
                <span className="mt-1 block">Add context if you want reviewers to have extra details.</span>
              </li>
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                Next project
              </p>
              {recommendedNextProject ? (
                <>
                  <h3 className="mt-2 text-lg font-semibold text-white">{recommendedNextProject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {recommendedNextProject.description || "Keep the loop going with your next challenge."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/submit/${recommendedNextProject.id}`)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
                  >
                    Start Project
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-300">No recommendation available right now.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Submit;
