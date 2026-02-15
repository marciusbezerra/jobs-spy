import { JobStatus } from "@prisma/client";

export type Job = {
  id?: number;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  salary?: string;
  remote?: boolean;
  status?: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
};
