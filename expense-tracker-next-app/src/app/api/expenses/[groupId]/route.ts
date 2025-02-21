import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const urlSegments = req.nextUrl.pathname.split("/");
  const groupId = Number(urlSegments[urlSegments.length - 1]); // Extract groupId from URL

  if (isNaN(groupId)) {
    return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("groupId", groupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const urlSegments = req.nextUrl.pathname.split("/");
    const groupId = Number(urlSegments[urlSegments.length - 1]); // Extract groupId from URL
    const { description, amount, category, date, created_by } = await req.json();

    if (!created_by) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (isNaN(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const { data , error } = await supabase
      .from("expenses")
      .insert([{ description, amount, category, date, created_by, groupId: groupId }])
      .select("*");

      if (error || !data) {
        return NextResponse.json({ error: "Expense creation failed" }, { status: 500 });
      }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}
