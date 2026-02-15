import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "";

  const jobs = await prisma.job.findMany({
    where: {
      title: {
        contains: filter,
        // mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return new Response(JSON.stringify(jobs), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
