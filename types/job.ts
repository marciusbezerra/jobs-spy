export type Job = {
  id?: number;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  status?: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export enum JobStatus {
  NEW = "NEW",
  DISCARDED = "DISCARDED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  INTERVIEWING = "INTERVIEWING",
  IN_CONTACT = "IN_CONTACT",
  SEE_LATER = "SEE_LATER",
}
