import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  // 1️⃣ Get the `groupId` from the URL
  const groupId = req.nextUrl.pathname.split("/")[3]; // Extract `groupId` from `/api/groups/[groupId]/remove-members`
  const { memberIds, userId } = await req.json(); // Extract the request body

  if (!groupId || !memberIds?.length || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 2️⃣ **Check if the requester is the group admin**
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("adminId")
    .eq("id", groupId)
    .single();
  console.log(group)
  if (groupError || !group) {
    return NextResponse.json({  error: "Unauthorized: Only admins can remove members"  }, { status: 404 });
  }

  // 3️⃣ **Update memberships table to "gray out" removed members**
  const { error: updateError } = await supabase
    .from("memberships")
    .update({ removed: true }) // Ensure `removed` column exists in `memberships`
    .in("userId", memberIds)
    .eq("groupId", groupId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to remove members" }, { status: 500 });
  }

  return NextResponse.json({ message: "Members removed successfully" });
}
