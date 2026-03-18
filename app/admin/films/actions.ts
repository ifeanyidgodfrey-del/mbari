"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function upsertAvailability(formData: FormData) {
  const id          = formData.get("id") as string | null;
  const filmId      = formData.get("filmId") as string;
  const countryCode = (formData.get("countryCode") as string).trim().toUpperCase();
  const platform    = (formData.get("platform") as string).trim();
  const accessType  = (formData.get("accessType") as string).trim();
  const url         = (formData.get("url") as string).trim() || null;
  const slug        = formData.get("slug") as string;

  if (id) {
    await prisma.availability.update({
      where: { id },
      data: { countryCode, platform, accessType, url },
    });
  } else {
    await prisma.availability.create({
      data: { filmId, countryCode, platform, accessType, url },
    });
  }

  revalidatePath(`/admin/films/${slug}`);
  revalidatePath(`/film/${slug}`);
}

export async function deleteAvailability(id: string, slug: string) {
  await prisma.availability.delete({ where: { id } });
  revalidatePath(`/admin/films/${slug}`);
  revalidatePath(`/film/${slug}`);
}
