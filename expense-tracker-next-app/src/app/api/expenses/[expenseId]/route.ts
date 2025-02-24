import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function PATCH(req: NextRequest, { params }: { params: { expenseId: string } }) {
  try {
    const { expenseId } = params;
    const { description, amount, category, date, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch the expense to check ownership
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("created_by")
      .eq("id", expenseId)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (existingExpense.created_by !== userId) {
      return NextResponse.json({ error: "Unauthorized: You can only edit your own expenses" }, { status: 403 });
    }

    // Update the expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({ description, amount, category, date })
      .eq("id", expenseId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch the username of the creator
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", updatedExpense.created_by)
      .single();

    if (userError) {
      return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
    }

    // Return updated expense with username
    return NextResponse.json({
      ...updatedExpense,
      created_by_name: user?.username || "Unknown",
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { expenseId: string } }) {
  const expenseId = await params.expenseId; // Extract the expense ID from the URL
  const userId = req.headers.get("X-User-Id"); // Extract user ID from headers

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .match({ id: expenseId, created_by: userId }); // Ensures only the owner can delete

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Expense deleted successfully" });
}


export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const groupIdNumber = await Number(params.groupId);

  if (!params.groupId || isNaN(groupIdNumber)) {
    return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
  }

  // Fetch expenses with user details
  const { data, error } = await supabase
    .from("expenses")
    .select("*, user:createdBy (id, username)") // Join users table
    .eq("groupId", groupIdNumber);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format response to include username
  const formattedData = data.map(expense => ({
    ...expense,
    created_by_name: expense.user?.username || "Unknown",
  }));

  return NextResponse.json(formattedData, { status: 200 });
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