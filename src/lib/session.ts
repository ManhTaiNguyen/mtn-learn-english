import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

const ANONYMOUS_ID_COOKIE = "anonymous_id";

export async function getAnonymousId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANONYMOUS_ID_COOKIE)?.value || null;
}

export async function ensureAnonymousSession(): Promise<string> {
  let anonymousId = await getAnonymousId();

  if (!anonymousId) {
    anonymousId = uuidv4();
    const cookieStore = await cookies();
    cookieStore.set(ANONYMOUS_ID_COOKIE, anonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // Ensure record exists in DB
  // Use upsert to avoid duplicate errors if called multiple times
  await prisma.anonymousSession.upsert({
    where: { id: anonymousId },
    update: {},
    create: {
      id: anonymousId,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
    },
  });

  return anonymousId;
}
