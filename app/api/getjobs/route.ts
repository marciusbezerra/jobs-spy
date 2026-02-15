/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job } from "@/types/job";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const action = searchParams.get("action");

  switch (action) {
    case "remotive":
      return await fetchRemotiveJobs(searchParams);
    case "arbeitnow":
      return await fetchArbeitnowJobs(searchParams);
    case "adzuna":
      return await fetchAdzunaJobs(searchParams);
    case "jsearch":
      return await fetchJSearchJobs(searchParams);
    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }

  async function fetchRemotiveJobs(searchParams: URLSearchParams) {
    const filter = searchParams.get("filter") || "";

    const upstream = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(filter)}`,
      {
        // include a UA so upstream can identify non-browser traffic if needed
        headers: { "User-Agent": "jobs-spy/1.0 (+https://google.com)" },
      },
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("Remotive upstream error", upstream.status, text);
      return new Response(JSON.stringify([]), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json().catch((err) => {
      console.error("Failed parsing Remotive JSON", err);
      return null;
    });

    if (!data || !Array.isArray(data.jobs)) {
      const warning =
        data?.["00-warning"] || data?.["0-legal-notice"] || data?.message || "";
      if (warning) console.warn("Remotive warning:", warning);
      // keep compatibility with the frontend which expects an array of jobs
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "x-remotive-warning": String(warning),
        },
      });
    }

    const jobs: Job[] = data.jobs.map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      url: job.url,
      description: job.description,
      source: "Remotive",
    }));

    console.info(
      `Fetched ${jobs.length} jobs from Remotive for filter "${filter}"`,
    );

    return new Response(JSON.stringify(jobs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function fetchArbeitnowJobs(searchParams: URLSearchParams) {
    const filter = searchParams.get("filter") || "";
    const upstream = await fetch(
      `https://arbeitnow.com/api/job-board-api?search=${encodeURIComponent(filter)}`,
    );
    const data = await upstream.json();
    console.info("Arbeitnow API response data:", data.data[0]);
    const result = data.data.map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.location,
      url: job.url,
      description: job.description,
      source: "Arbeitnow",
    }));
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function fetchAdzunaJobs(searchParams: URLSearchParams) {
    const filter = searchParams.get("filter") || "";
    const apiId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_APP_KEY;
    const upstream = await fetch(
      `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${apiId}&app_key=${apiKey}&results_per_page=20&what=${encodeURIComponent(filter)}`,
    );
    const data = await upstream.json();
    console.info("Adzuna API response data:", data.results[0]);
    const jobs: Job[] = data.results.map(
      (job: any) =>
        ({
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          url: job.redirect_url,
          description: job.description,
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          source: "Adzuna",
        }) as Job,
    );
    return new Response(JSON.stringify(jobs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function fetchJSearchJobs(searchParams: URLSearchParams) {
    const filter = searchParams.get("filter") || "";
    const apiKey = process.env.JSEARCH_APP_KEY;
    const upstream = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(filter)}&page=1&num_pages=1&country=us&date_posted=all&work_from_home=true&language=pt`,
      // date_posted=all|today|3days|week|month
      // language=pt
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey || "",
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      },
    );
    const data = await upstream.json();
    console.info("JSearch API response data:", data.data[0]);
    const result = data.data.map((job: any) => ({
      title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city}, ${job.job_state}, ${job.job_country}`,
      url: job.job_apply_link,
      description: job.job_description,
      remote: job.job_is_remote,
      salaryMin: job.job_salary_min,
      salaryMax: job.job_salary_max,
      source: "JSearch",
    }));
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
