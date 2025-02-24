import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function GET(req: NextRequest) {
  try {
    const urlSegments = req.nextUrl.pathname.split("/");
    const groupId = Number(urlSegments[urlSegments.length - 1]);

    if (isNaN(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*, users(username)")
      .eq("groupId", groupId);

    if (error) {
      console.error("Fetch Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data.map(exp => ({ ...exp, created_by_name: exp.users?.username })),
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected Error:", error);
    return NextResponse.json({ error: "Error fetching expenses" }, { status: 500 });
  }
}


