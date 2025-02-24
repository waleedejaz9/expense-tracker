import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Extract `groupId` from the URL
    const groupId = await req.nextUrl.pathname.split("/")[3]; // `/api/groups/[groupId]/remove-members`
    console.log("sdfgsdfgsdf",req.nextUrl.pathname.split("/")[3])
    console.log(groupId)
    const { memberIds, userId } = await req.json(); // Extract request body

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
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}