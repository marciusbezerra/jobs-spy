// app\api\updateJobStatus\[jobId]\route.ts

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const { status } = await request.json();

  console.info(`Updating job ${jobId} status to ${status}`);

  if (!status) {
    return new Response(JSON.stringify({ error: "Status is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updatedJob = await prisma.job.update({
      where: { id: +jobId },
      data: { status },
    });
    return new Response(JSON.stringify(updatedJob), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating job status:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update job status" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
