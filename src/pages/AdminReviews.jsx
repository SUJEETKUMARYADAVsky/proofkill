import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminSubmissions, reviewSubmission } from "../services/submissionService";

const emptyReview = {
  rating: 5,
  feedback: "",
};

const AdminReviews = () => {
  const { token, currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [viewMode, setViewMode] = useState("pending");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyReview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedId) || null,
    [submissions, selectedId]
  );

  const filteredSubmissions = useMemo(() => {
    if (viewMode === "all") {
      return submissions;
    }

    return submissions.filter((submission) => submission.status === "pending");
  }, [submissions, viewMode]);

  const summary = useMemo(() => {
    const pendingCount = submissions.filter((submission) => submission.status === "pending").length;
    const reviewedCount = submissions.filter((submission) => submission.status === "reviewed").length;

    return {
      total: submissions.length,
      pending: pendingCount,
      reviewed: reviewedCount,
    };
  }, [submissions]);

  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminSubmissions(token);
        const list = Array.isArray(response) ? response : response.data || [];
        setSubmissions(list);

        if (list.length > 0) {
          const first = list.find((submission) => submission.status === "pending") || list[0];
          setSelectedId(first.id);
          setForm({
            rating: typeof first.rating === "number" ? first.rating : 5,
            feedback: first.feedback || "",
          });
        }
      } catch (err) {
        setError(err.message || "Could not load submissions.");
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [token]);

  useEffect(() => {
    if (!selectedSubmission) {
      return;
    }

    setForm({
      rating: typeof selectedSubmission.rating === "number" ? selectedSubmission.rating : 5,
      feedback: selectedSubmission.feedback || "",
    });
  }, [selectedSubmission]);

  const handleSelect = (submission) => {
    setSelectedId(submission.id);
    setMessage("");
    setError("");
  };

  const handleFilterChange = (nextMode) => {
    setViewMode(nextMode);
    setMessage("");
    setError("");

    if (nextMode === "pending") {
      const nextSelection = submissions.find((submission) => submission.status === "pending");

      if (nextSelection) {
        setSelectedId(nextSelection.id);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSubmission) {
      setError("Select a submission first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await reviewSubmission(
        selectedSubmission.id,
        {
          rating: Number(form.rating),
          feedback: form.feedback,
        },
        token
      );

      const response = await getAdminSubmissions(token);
      const list = Array.isArray(response) ? response : response.data || [];
      setSubmissions(list);

      const updated = list.find((submission) => submission.id === selectedSubmission.id) || null;

      if (updated) {
        setSelectedId(updated.id);
        setForm({
          rating: typeof updated.rating === "number" ? updated.rating : 5,
          feedback: updated.feedback || "",
        });
      }

      setMessage("Submission reviewed successfully.");
    } catch (err) {
      setError(err.message || "Could not review submission.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading admin review queue...</p>;
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Submission Reviews</h1>
          <p className="muted">
            Review submitted proof, add a rating, and write feedback for the student.
          </p>
        </div>
        <div className="admin-summary">
          <span>Logged in as</span>
          <strong>{currentUser?.email || "admin"}</strong>
          <div className="summary-grid">
            <div>
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
            <div>
              <span>Reviewed</span>
              <strong>{summary.reviewed}</strong>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {message && <p className="alert alert-success">{message}</p>}

      <div className="admin-layout">
        <aside className="panel queue-panel">
          <div className="queue-header">
            <h2>Queue</h2>
            <div className="filter-toggle" role="tablist" aria-label="Submission filters">
              <button
                type="button"
                className={viewMode === "pending" ? "filter-button active" : "filter-button"}
                onClick={() => handleFilterChange("pending")}
              >
                Pending
              </button>
              <button
                type="button"
                className={viewMode === "all" ? "filter-button active" : "filter-button"}
                onClick={() => handleFilterChange("all")}
              >
                All
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <p className="muted">No submissions available.</p>
          ) : (
            <ul className="queue-list">
              {filteredSubmissions.map((submission) => (
                <li key={submission.id}>
                  <button
                    type="button"
                    className={submission.id === selectedId ? "queue-item active" : "queue-item"}
                    onClick={() => handleSelect(submission)}
                  >
                    <span className="queue-item-title">{submission.project}</span>
                    <span className="queue-item-meta">
                      {submission.user?.email || "Unknown user"} · {submission.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="panel review-panel">
          <h2>Review details</h2>

          {selectedSubmission ? (
            <div className="review-card">
              <div className="review-header">
                <div>
                  <p className="eyebrow">Submission</p>
                  <h3>{selectedSubmission.project}</h3>
                </div>
                <span className={`status-badge ${selectedSubmission.status}`}>
                  {selectedSubmission.status}
                </span>
              </div>

              <p>
                <strong>Student:</strong> {selectedSubmission.user?.name || "Unknown"} ({selectedSubmission.user?.email || "No email"})
              </p>
              <p>
                <strong>GitHub:</strong> <a href={selectedSubmission.githubLink} target="_blank" rel="noreferrer">Open submission</a>
              </p>
              <p>
                <strong>Current rating:</strong> {selectedSubmission.rating ?? "Not reviewed"}
              </p>

              <form onSubmit={handleSubmit} className="review-form">
                <div className="field-row">
                  <div>
                    <label htmlFor="rating">Rating</label>
                    <input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      value={form.rating}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, rating: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="feedback">Feedback</label>
                  <textarea
                    id="feedback"
                    rows={5}
                    value={form.feedback}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, feedback: event.target.value }))
                    }
                    placeholder="Leave constructive feedback for the student"
                    required
                  />
                </div>

                <button type="submit" disabled={saving} className="primary-button">
                  {saving ? "Saving..." : "Save review"}
                </button>
              </form>
            </div>
          ) : (
            <p className="muted">Select a submission from the queue to review it.</p>
          )}
        </section>
      </div>
    </section>
  );
};

export default AdminReviews;