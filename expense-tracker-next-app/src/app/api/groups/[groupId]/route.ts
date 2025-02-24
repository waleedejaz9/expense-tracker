import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, context: { params: { groupId: string } }) {
    try {
      const { params } = context; // Correct way to access params
      const groupId = await Number(params.groupId); // Extract groupId safely
  
      if (isNaN(groupId)) {
        return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
      }
  
      const { description, amount, category, date, created_by } = await req.json();
  
      if (!created_by) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      const { data, error } = await supabase
        .from("expenses")
        .insert([{ description, amount, category, date, created_by, groupId }])
        .select("*");
  
      if (error) {
        console.error("Insert Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      // Fetch the user's username (not `name`)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username") // Make sure this column exists
        .eq("id", created_by)
        .single();
  
      if (userError) {
        console.error("User Fetch Error:", userError.message);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      return NextResponse.json({ ...data[0], created_by_name: userData.username }, { status: 201 });
    } catch (error) {
      console.error("Unexpected Error:", error);
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
}

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