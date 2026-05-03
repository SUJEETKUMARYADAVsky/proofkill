import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../services/publicProfileService";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getPublicProfile(username);
        const data = response && (response.data || response);
        setProfile(data || null);
      } catch (err) {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  if (loading) return <div className="p-6">Loading profile…</div>;
  if (error) return <div className="p-6 text-rose-600">{error}</div>;
  if (!profile) return <div className="p-6">No profile data.</div>;

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[16px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{profile.name}</h1>
              <p className="text-sm text-slate-500">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Projects</p>
              <p className="text-xl font-semibold">{profile.totalProjects}</p>
              <p className="text-sm text-slate-500">Avg rating: {profile.averageRating || "-"}</p>
              <p className="text-sm text-slate-500">Streak: {profile.streak || 0}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {profile.submissions.length === 0 ? (
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-6 text-slate-600">No reviewed projects yet.</div>
          ) : (
            profile.submissions.map((s) => (
              <div key={s.id} className="rounded-[12px] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{s.project}</h3>
                    <p className="mt-1 text-sm text-slate-600">{s.feedback}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{s.rating ? `${s.rating}/5` : "-"}</p>
                    <p className="text-sm text-slate-500">{formatDate(s.reviewedAt)}</p>
                    {s.githubLink && (
                      <a href={s.githubLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-slate-700 underline">Open GitHub</a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PublicProfile;
