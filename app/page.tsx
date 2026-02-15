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
      // Optimistically update local state so the select shows the new value
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status } : j)),
      );
    } catch (err) {
      console.error("Error updating job status:", err);
    }
  }

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-4xl font-bold mb-8">Job Spy</h1>
        <input
          type="text"
          placeholder="Search for jobs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded w-full max-w-md mb-8"
        />
        {/* Button consultar */}
        <button
          onClick={() => {
            setFilter(filter); // Trigger useEffect to refetch jobs
          }}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          {loading ? "Loading..." : "Consultar"}
        </button>
        {/* Button sincronizar */}
        <button
          onClick={() => syncJobs()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Sincronizar"}
        </button>
        {/* Sync Errors */}
        {syncErrors.length > 0 && (
          <div className="mt-4 text-red-500">
            <h3 className="font-bold">Sync Errors:</h3>
            <ul>
              {syncErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as JobStatus)}
          className="border p-2 rounded w-full max-w-md mb-8"
        >
          <option value="">All Statuses</option>
          {Object.values(JobStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div className="w-full max-w-4xl">
          {/* Example job listing */}
          {jobs
            .filter((job) => !filterStatus || job.status === filterStatus)
            .map((job) => (
              <div key={job.url} className="border p-4 rounded mb-4">
                <h2 className="text-2xl font-bold">{job.title}</h2>
                <p className="text-gray-600">
                  {job.company} - {job.location}
                </p>
                <a
                  href={job.url}
                  className="text-blue-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Job
                </a>
                <div className="mt-2">
                  <select
                    value={job.status}
                    onChange={(e) =>
                      updateJobStatus(job, e.target.value as JobStatus)
                    }
                    className="border p-2 rounded"
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
      </main>
    </>
  );
}
