/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Job } from "@/types/job";
import React, { useEffect } from "react";

export default function Home() {
  const [filter, setFilter] = React.useState("");
  const [filterSource, setFilterSource] = React.useState("");
  const [jobs, setJobs] = React.useState<Job[]>([]);

  async function fetchJob(action: string, filter: string): Promise<Job[]> {
    const response = await fetch(
      `api/getjobs/?action=${action}&filter=${encodeURIComponent(filter)}`,
    );
    const data = await response.json();
    return data.map((job: any) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: job.description,
      remote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      source: job.source,
    }));
  }

  async function fetchJobs() {
    const [r1, r2, r3, r4, r5] = await Promise.all([
      [], //fetchJob("remotive", filter),
      [], //fetchWeWorkRemotelyJobs(),
      [], // fetchJob("arbeitnow", filter),
      [], // fetchJob("adzuna", filter),
      fetchJob("jsearch", filter),
    ]);
    const jobs = [...r1, ...r2, ...r3, ...r4, ...r5];
    setJobs(jobs);
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
        {/* Button search */}
        <button
          onClick={() => fetchJobs()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="border p-2 rounded w-full max-w-md mb-8"
        >
          <option value="">All Sources</option>
          <option value="Remotive">Remotive</option>
          <option value="Arbeitnow">Arbeitnow</option>
          <option value="Adzuna">Adzuna</option>
          <option value="JSearch">JSearch</option>
        </select>

        <div className="w-full max-w-4xl">
          {/* Example job listing */}
          {jobs
            .filter((job) => !filterSource || job.source === filterSource)
            .map((job) => (
              <div key={job.url} className="border p-4 rounded mb-4">
                <h2 className="text-2xl font-bold">{job.title}</h2>
                <p className="text-gray-600">
                  {job.company} - {job.location}
                </p>
                <a href={job.url} className="text-blue-500">
                  View Job
                </a>
              </div>
            ))}
        </div>
      </main>
    </>
  );
}
