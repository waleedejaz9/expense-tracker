import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, context: { params: { groupId: string } }) {
  const { groupId } = await context.params;

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  try {
    // Step 1: Get userIds from memberships
    const { data: membershipData, error: membershipError } = await supabase
      .from("memberships")
      .select("userId")
      .eq("groupId", groupId);

    if (membershipError) throw membershipError;

    const userIds = membershipData.map((m) => m.userId);

    if (userIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 2: Fetch user details for those userIds
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, username, email")
      .in("id", userIds);

    if (userError) throw userError;

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  // 1️⃣ Get the `groupId` from the URL
  const groupId = req.nextUrl.pathname.split("/")[3]; // Extract `groupId` from `/api/groups/[groupId]/remove-members`
  const { memberIds, userId } = await req.json(); // Extract the request body

  if (!groupId || !memberIds?.length || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 2️⃣ **Check if the requester is the group admin**
  const { data: group, error: groupError } = await supabase
    .from("group")
    .select("adminId")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.adminId !== userId) {
    return NextResponse.json({ error: "Unauthorized: Only the admin can remove members" }, { status: 403 });
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