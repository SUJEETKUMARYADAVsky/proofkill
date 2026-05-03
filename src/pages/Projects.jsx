import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../services/projectService";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getProjects(token);
        const list = Array.isArray(response) ? response : response.data || [];
        setProjects(list);
      } catch (err) {
        setError(err.message || "Could not load projects.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [token]);

  const navigate = useNavigate();

  const getDisplayDifficulty = (project) => {
    if (project.difficulty) {
      return project.difficulty;
    }

    const mediumTitles = ["Build REST API", "Create Blog Backend"];

    return mediumTitles.includes(project.title) ? "Medium" : "Easy";
  };

  const getDifficultyBadgeClass = (difficulty) => {
    switch (difficulty) {
      case "Medium":
        return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
      case "Hard":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
      default:
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }
  };

  if (loading) {
    return <p>Loading projects...</p>;
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Available Projects
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Available Projects
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Complete real tasks and prove your skills.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!error && projects.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-slate-600 shadow-sm">
            No projects available right now. Check back soon.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const projectKey = project._id || project.id;
            const difficulty = getDisplayDifficulty(project);

            return (
              <article
                key={projectKey}
                className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.14)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyBadgeClass(difficulty)}`}
                    >
                      {difficulty}
                    </span>
                    <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                      {project.title || "Untitled project"}
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    ID: {String(projectKey).slice(-6)}
                  </span>
                </div>

                <p
                  className="mt-4 flex-1 text-sm leading-6 text-slate-600"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {project.description || "No description provided for this project."}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    {project.difficulty ? `Difficulty: ${project.difficulty}` : "Difficulty: Easy"}
                  </div>
                  <button
                    onClick={() => navigate(`/submit/${projectKey}`)}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white opacity-90 transition-all duration-200 hover:bg-slate-800 hover:opacity-100"
                  >
                    Start Project
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
