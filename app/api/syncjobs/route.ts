/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job } from "@/types/job";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

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
    try {
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
          data?.["00-warning"] ||
          data?.["0-legal-notice"] ||
          data?.message ||
          "";
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

      let inserted = 0;
      for (const j of data.jobs) {
        if (!j.url) continue;
        const exists = await prisma.job.findFirst({ where: { url: j.url } });
        if (exists) continue;

        await prisma.job.create({
          data: {
            publishedAt: j.publication_date
              ? new Date(j.publication_date)
              : undefined,
            title: j.title,
            company: j.company_name,
            location: j.candidate_required_location,
            url: j.url,
            description: j.description,
            source: "Remotive",
            remote: j.remote ?? false,
            salary: j.salary ?? undefined,
          },
        });
        inserted++;
      }
      console.info(`Inserted ${inserted} new jobs from Remotive`);
      return new Response(JSON.stringify({ message: "OK" }), { status: 200 });
    } catch (err: any) {
      console.error("Error saving Remotive jobs:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
      });
    }
  }

  async function fetchArbeitnowJobs(searchParams: URLSearchParams) {
    try {
      const filter = searchParams.get("filter") || "";
      const upstream = await fetch(
        `https://arbeitnow.com/api/job-board-api?search=${encodeURIComponent(filter)}`,
      );

      const data = await upstream.json();

      let inserted = 0;
      for (const j of data.data) {
        if (!j.url) continue;
        const exists = await prisma.job.findFirst({ where: { url: j.url } });
        if (exists) continue;
        await prisma.job.create({
          data: {
            title: j.title,
            publishedAt: j.created_at
              ? new Date(j.created_at * 1000)
              : undefined,
            company: j.company_name,
            location: j.location,
            url: j.url,
            description: j.description,
            source: "Arbeitnow",
            remote:
              (j.remote ?? false) || (j.tags?.includes("Remote") ?? false),
            salary: j.salary ?? undefined,
          },
        });
        inserted++;
      }
      console.info(`Inserted ${inserted} new jobs from Arbeitnow`);
      return new Response(JSON.stringify({ message: "OK" }), { status: 200 });
    } catch (err: any) {
      console.error("Error saving Arbeitnow jobs:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
      });
    }
  }

  async function fetchAdzunaJobs(searchParams: URLSearchParams) {
    try {
      const filter = searchParams.get("filter") || "";
      const apiId = process.env.ADZUNA_APP_ID;
      const apiKey = process.env.ADZUNA_APP_KEY;
      const upstream = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${apiId}&app_key=${apiKey}&results_per_page=20&what=${encodeURIComponent(filter)}`,
      );
      const data = await upstream.json();

      let inserted = 0;
      for (const j of data.results) {
        if (!j.redirect_url) continue;
        const exists = await prisma.job.findFirst({
          where: { url: j.redirect_url },
        });
        if (exists) continue;

        await prisma.job.create({
          data: {
            title: j.title,
            publishedAt: j.created ? new Date(j.created) : undefined,
            company: j.company?.display_name,
            location: j.location?.display_name,
            url: j.redirect_url,
            description: j.description,
            source: "Adzuna",
            remote:
              j.category?.tag === "remote" ||
              j.tags?.includes("remote") ||
              false,
            salary: `${j.salary_min ?? ""} - ${j.salary_max ?? ""}`,
          },
        });
        inserted++;
      }
      console.info(`Inserted ${inserted} new jobs from Adzuna`);
      return new Response(JSON.stringify({ message: "OK" }), { status: 200 });
    } catch (err: any) {
      console.error("Error saving Adzuna jobs:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
      });
    }
  }

  async function fetchJSearchJobs(searchParams: URLSearchParams) {
    try {
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

      let inserted = 0;
      for (const j of data.data) {
        if (!j.job_apply_link) continue;
        const exists = await prisma.job.findFirst({
          where: { url: j.job_apply_link },
        });
        if (exists) continue;

        const publishedAt =
          parseJSearchDate(j.job_posted_at) ||
          new Date(j.job_posted_at_timestamp) ||
          new Date(j.job_posted_at_datetime_utc) ||
          new Date() ||
          undefined;

        await prisma.job.create({
          data: {
            title: j.job_title,
            publishedAt: publishedAt,
            company: j.employer_name,
            location: `${j.job_city}, ${j.job_state}, ${j.job_country}`,
            url: j.job_apply_link || j.apply_options?.[0]?.link,
            description: j.job_description,
            source: "JSearch",
            remote: j.job_is_remote ?? false,
            salary: `${j.job_salary_min ?? ""} - ${j.job_salary_max ?? ""}`,
          },
        });
        inserted++;
      }
      console.info(`Inserted ${inserted} new jobs from JSearch`);
      return new Response(JSON.stringify({ message: "OK" }), { status: 200 });
    } catch (err: any) {
      console.error("Error saving JSearch jobs:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
      });
    }
  }

  function parseJSearchDate(text: string | null): Date | undefined {
    try {
      if (!text) return undefined;
      const match = text.match(/há\s+(\d+)\s+(\w+)/);
      if (!match) return undefined;
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const now = new Date();
      switch (unit) {
        case "minuto":
        case "minutos":
          return new Date(now.getTime() - value * 60 * 1000);
        case "hora":
        case "horas":
          return new Date(now.getTime() - value * 60 * 60 * 1000);
        case "dia":
        case "dias":
          return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        case "semana":
        case "semanas":
          return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        case "mês":
        case "meses":
          return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
        case "ano":
        case "anos":
          return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
        default:
          return undefined;
      }
    } catch (err) {
      console.error("Error parsing JSearch date:", err);
      return undefined;
    }
  }
}
