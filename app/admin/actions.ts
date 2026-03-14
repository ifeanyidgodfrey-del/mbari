"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveSubmission(id: string) {
  await prisma.submission.update({
    where: { id },
    data: { status: "approved", updatedAt: new Date() },
  });
  revalidatePath("/admin");
}

export async function rejectSubmission(id: string) {
  await prisma.submission.update({
    where: { id },
    data: { status: "rejected", updatedAt: new Date() },
  });
  revalidatePath("/admin");
}
