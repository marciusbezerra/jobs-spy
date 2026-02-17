"use client";

import { Job } from "@/types/job";
import { JobStatus } from "@prisma/client";
import React, { useEffect } from "react";

export default function Home() {
  const [filter, setFilter] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<JobStatus | "">(
    JobStatus.NEW,
  );
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [syncErrors, setSyncErrors] = React.useState<string[]>([]);

  const fixedFilters = [
    ".net",
    "c#",
    "angular",
    "ionic",
    "webforms",
    "winforms",
    "vb6",
  ];

  async function syncJob(action: string, filter: string) {
    const response = await fetch(
      `api/syncjobs/?action=${action}&filter=${encodeURIComponent(filter)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      console.error(`Error syncing ${action} jobs:`, data);
      const err = new Error(data.error || "Unknown error");
      setSyncErrors((prev) => [...prev, String(err)]);
      return false;
    }
    console.info(`Successfully synced ${action} jobs for filter "${filter}"`);
    return true;
  }

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const response = await fetch(
          `api/getjobs/?filter=${encodeURIComponent(filter)}&status=${filterStatus}`,
        );
        const data = await response.json();
        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [filter, filterStatus]);

  async function syncJobs() {
    setLoading(true);
    try {
      for (const f of fixedFilters) {
        await syncJob("remotive", f);
        await syncJob("arbeitnow", f);
        await syncJob("adzuna", f);
        await syncJob("jsearch", f);
        // Add a small delay between requests to avoid hitting rate limits
        const delay = Math.random() * 2000 + 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (err) {
      console.error("Error syncing jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateJobStatus(job: Job, status: JobStatus) {
    try {
      const response = await fetch(`/api/updateJobStatus/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update job status");
      }
      // Optimistically update local state immediately
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status } : j)),
      );
    } catch (err) {
      console.error("Error updating job status:", err);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Job Spy
              </h1>
              <p className="text-slate-600">
                Track and manage remote job opportunities
              </p>
            </div>

            {/* Search and Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search jobs by title or company..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setFilter(filter)}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                onClick={() => syncJobs()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Syncing..." : "Sync All"}
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as JobStatus | "")
                  }
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(JobStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {syncErrors.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-4 mt-4">
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <h3 className="font-bold text-red-800 mb-2">Sync Errors:</h3>
              <ul className="space-y-1">
                {syncErrors.map((error, index) => (
                  <li key={index} className="text-red-700 text-sm">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Jobs Gallery by Source */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {["Remotive", "Arbeitnow", "Adzuna", "JSearch"].map((source) => {
              const sourceJobs = jobs
                .filter((job) => job.source === source)
                .filter((job) => !filterStatus || job.status === filterStatus);

              return (
                <div
                  key={source}
                  className="flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Source Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                    <h2 className="text-lg font-bold text-white">{source}</h2>
                    <p className="text-blue-100 text-sm">
                      {sourceJobs.length} job
                      {sourceJobs.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Jobs List with Scroll */}
                  <div className="flex-1 overflow-y-auto max-h-130 px-4 py-4">
                    {sourceJobs.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-slate-400">
                        <p className="text-center text-sm">No jobs found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sourceJobs.map((job) => (
                          <div
                            key={job.url}
                            className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors"
                          >
                            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {job.title}
                              </a>
                            </h3>
                            <p className="text-xs text-slate-600 mt-1">
                              {job.company}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {job.location}
                            </p>
                            {job.remote && (
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                Remote
                              </span>
                            )}
                            <div className="mt-3 flex flex-col gap-2">
                              <a
                                href={job.url}
                                className="text-blue-600 text-xs hover:underline truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Job →
                              </a>
                              <select
                                value={job.status || JobStatus.NEW}
                                onChange={(e) =>
                                  updateJobStatus(
                                    job,
                                    e.target.value as JobStatus,
                                  )
                                }
                                className="w-full px-2 py-1 text-xs bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                {Object.values(JobStatus).map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
