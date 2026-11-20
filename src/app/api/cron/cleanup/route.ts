import { deleteIdleGuests } from "@/game/server";

/** Daily (see vercel.json): removes guests idle for 90 days, with their octopuses. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const deleted = await deleteIdleGuests(90);
  return Response.json({ deleted });
}
