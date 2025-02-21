import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function PUT(req: NextRequest, { params }: { params: { expenseId: string } }) {
  const { expenseId } = params;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { description, amount, category, date } = await req.json();

    // Check if expense exists and belongs to the user
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .single();

    if (fetchError || !expense || expense.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized action" }, { status: 403 });
    }

    // Update the expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({ description, amount: parseFloat(amount), category, date: new Date(date) })
      .eq("id", expenseId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { expenseId: string } }) {
    const { expenseId } = params;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
  
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    try {
      // Check if expense exists and belongs to the user
      const { data: expense, error: fetchError } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", expenseId)
        .single();
  
      if (fetchError || !expense || expense.created_by !== user.id) {
        return NextResponse.json({ error: "Unauthorized action" }, { status: 403 });
      }
  
      // Delete the expense
      const { error: deleteError } = await supabase.from("expenses").delete().eq("id", expenseId);
  
      if (deleteError) throw deleteError;
  
      return NextResponse.json({ message: "Expense deleted successfully" }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
  }