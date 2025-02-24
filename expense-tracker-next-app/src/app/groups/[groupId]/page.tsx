"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios, { AxiosError } from "axios";

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
  const params = useParams();
  const groupId = params?.groupId;
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "", date: "" });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [currencies, setCurrencies] = useState<{ [key: string]: number }>({});
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Fetch logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch group details
  // useEffect(() => {
  //   if (!groupId) {
  //     router.push("/dashboard");
  //     return;
  //   }

  //   async function fetchGroupDetails() {
  //     try {
  //       const res = await axios.get(`/api/groups/${groupId}`);
  //       if (!res.data) throw new Error("Group not found");
  //       setGroup(res.data);
  //     } catch (error) {
  //       console.error("Error fetching group:", error);
  //       router.push("/dashboard");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchGroupDetails();
  // }, [groupId, router]);

  // Fetch group members
  useEffect(() => {
    if (!groupId) return;

    async function fetchMembers() {
      try {
        const res = await axios.get(`/api/groups/${groupId}/members`);
        setMembers(res.data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    }

    fetchMembers();
  }, [groupId]);

  // Fetch expenses
  useEffect(() => {
    if (!groupId) return;
  
    async function fetchExpenses() {
      try {
        const res = await axios.get(`/api/groups/${groupId}`);
        setExpenses(res.data || []);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    }
  
    fetchExpenses();
  }, [groupId]);

  // Fetch exchange rates
  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const res = await axios.get("https://open.er-api.com/v6/latest/USD");
        setCurrencies(res.data.rates);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    }

    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (currencies[currency]) {
      setExchangeRate(currencies[currency]);
    }
  }, [currency, currencies]);

  // if (loading) return <p>Loading...</p>;

  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const res = await axios.get("https://open.er-api.com/v6/latest/USD"); // Replace with your API key if required
        setCurrencies(res.data.rates);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    }
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (currencies[currency]) {
      setExchangeRate(currencies[currency]);
    }
  }, [currency, currencies]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await axios.get(`/api/groups/${groupId}/members`);
        setMembers(res.data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    }
    fetchMembers();
  }, [groupId]);

  useEffect(() => {
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
    fetchExpenses();
  }, [groupId]);

  const handleAddExpense = async () => {
    if (!user) return alert("User not found!");
  
    try {
      const res = await axios.post(`/api/groups/${groupId}`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date).toISOString(),
        created_by: user.id,
      });
  
      setExpenses([...expenses, res.data]);
      setNewExpense({ description: "", amount: "", category: "", date: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleSaveExpense = async (expenseId: string) => {
    if (!user) {
      alert("User not found!");
      return;
    }
  
    try {
      const res = await axios.patch(`/api/expenses/${expenseId}`, {
        ...editingExpense,
        userId: user.id,
      });
  
      setExpenses(expenses.map((expense) => (expense.id === expenseId ? res.data : expense)));
      setEditingExpense(null);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };
  
  // Delete an expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) {
      alert("User not found!");
      return;
    }
  
    try {
      await axios.delete(`/api/expenses/${expenseId}`, {
        headers: { "X-User-Id": user.id },
      });
  
      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };
  const handleRemoveClick = () => {
    setIsModalOpen(true);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const confirmRemoval = async () => {
    try {
      if (!user || !user.id) {
        alert("Error: User not found in localStorage.");
        return;
      }
  
      const response = await axios.post(`/api/groups/${groupId}/members`, {
        memberIds: selectedMembers,
        userId: user.id,
      });
  
      alert(response.data.message);
      setMembers((prev) => prev.filter((m) => !selectedMembers.includes(m.id)));
      setSelectedMembers([]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      console.error("Error removing members:", error);
      alert(error.response?.data?.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-6 w-9/12">
      <h1 className="text-2xl font-bold text-center mb-4">Group Expenses</h1>
      <button onClick={handleRemoveClick} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
        Remove Members
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Select Members to Remove</h2>
            {members.map((member) => (
              <div key={member.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMemberSelection(member.id)}
                  className="mr-2"
                />
                <span>{member.name} ({member.email})</span>
              </div>
            ))}
            <div className="flex justify-end mt-4">
              <button onClick={() => {setIsModalOpen(false); setEditingExpense(null)}
                
              } className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
                Cancel
              </button>
              <button onClick={confirmRemoval} className="bg-red-500 text-white px-4 py-2 rounded">
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 mx-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2 text-center">Description</th>
              <th className="border p-2 text-center">Amount in ($)</th>
              <th className="border p-2 text-center">Category</th>
              <th className="border p-2 text-center">Date</th>
              <th className="border p-2 text-center">Created By</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border text-center">
                {editingExpense?.id === expense.id ? (
                  <>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={editingExpense.description}
                        onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                        className="border p-2 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                        className="border p-2 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={editingExpense.category}
                        onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                        className="border p-2 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="date"
                        value={editingExpense.date}
                        onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                        className="border p-2 w-full"
                      />
                    </td>
                    <td className="border p-2">{expense.created_by_name}</td>
                    <td className="border p-2">
                      <button onClick={() => handleSaveExpense(expense.id)} className="bg-green-500 text-white px-2 py-1 rounded">
                        Save
                      </button>
                      <button onClick={() => setEditingExpense(null)} className="bg-gray-500 text-white px-2 py-1 rounded ml-2">
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{expense.description}</td>
                    <td className="border p-2">{expense.amount}</td>
                    <td className="border p-2">{expense.category}</td>
                    <td className="border p-2">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="border p-2">{expense.created_by_name}</td>
                    <td className="border p-2">
                      {user?.id === expense.created_by && (
                        <>
                          <button onClick={() => setEditingExpense({ ...expense })} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add Expense Row */}
            <tr className="border bg-gray-100 text-center">
              <td className="border p-2">
                <input type="text" placeholder="Description" value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="border p-2 w-full" />
              </td>
              <td className="border p-2">
                <input type="number" placeholder="Amount" value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="border p-2 w-full" />
              </td>
              <td className="border p-2">
                <input type="text" placeholder="Category" value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="border p-2 w-full" />
              </td>
              <td className="border p-2">
                <input type="date" value={newExpense.date}
                  onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="border p-2 w-full" />
              </td>
              <td className="border p-2">{user?.username}</td>
              <td className="border p-2">
                <button onClick={handleAddExpense} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <div className="font-bold text-lg flex justify-end items-center mt-5 gap-x-2">
        {/* Currency Selector */}
        <div className="flex justify-end">
          <label className="mr-2 font-bold flex items-center">Currency:</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border p-2"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
        Total: ${(expenses.reduce((total, exp) => total + exp.amount, 0) * exchangeRate).toFixed(2)} {currency}
      </div>

    </div>

  );
}
