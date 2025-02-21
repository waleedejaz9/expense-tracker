"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_by: string;
  created_by_name: string;
  group_id: string;
}

export default function GroupExpensesPage() {
  const { groupId } = useParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "", date: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUser(user)
    }
    async function fetchExpenses() {
      try {
        const res = await axios.get(`/api/expenses/${groupId}`);
        setExpenses(res.data || []);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!expenses.length) fetchExpenses(); // Prevent duplicate fetches
  }, [groupId]);

  const handleAddExpense = async () => {
    if (!user) return alert("User not found!");

    try {
      const res = await axios.post(`http://localhost:3000/api/expenses/${groupId}`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        created_by: user.id,
        groupId: parseInt(groupId as string),
      }, {
        headers: { "Content-Type": "application/json" }
      });

      setExpenses([...expenses, res.data]);
      setNewExpense({ description: "", amount: "", category: "", date: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Group Expenses</h1>

      <table className="w-full border-collapse border border-gray-300 mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Description</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Created By</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border">
              <td className="border p-2">{expense.description}</td>
              <td className="border p-2">${expense.amount}</td>
              <td className="border p-2">{expense.category}</td>
              <td className="border p-2">{new Date(expense.date).toLocaleDateString()}</td>
              <td className="border p-2">{expense.created_by_name}</td>
              <td className="border p-2">
                {user?.id === expense.created_by && (
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
          {/* Add Expense Row */}
          <tr className="border bg-gray-100">
            <td className="border p-2"><input type="text" placeholder="Description" value={newExpense.description} 
              onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="border p-2 w-full" /></td>
            <td className="border p-2"><input type="number" placeholder="Amount" value={newExpense.amount} 
              onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="border p-2 w-full" /></td>
            <td className="border p-2"><input type="text" placeholder="Category" value={newExpense.category} 
              onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="border p-2 w-full" /></td>
            <td className="border p-2"><input type="date" value={newExpense.date} 
              onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="border p-2 w-full" /></td>
            <td className="border p-2">{user?.name || "Unknown"}</td>
            <td className="border p-2"><button onClick={handleAddExpense} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button></td>
          </tr>
        </tbody>
      </table>
      
      {/* Total Expenses */}
      <div className="mt-4 text-right font-bold text-lg">
        Total: ${expenses.reduce((total, exp) => total + exp.amount, 0).toFixed(2)}
      </div>
    </div>
  );
}
