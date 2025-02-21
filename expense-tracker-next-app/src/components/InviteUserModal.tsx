"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: { id: string; name: string }[];
  fetchGroups: () => void;
  selectedGroup: string | null; // Add this property
}

export default function InviteUserModal({ isOpen, onClose, groups, fetchGroups }: InviteUserModalProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; email: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSearchUsers() {
    if (!selectedGroup) {
      alert("Please select a group first!");
      setSearchEmail("");
      setSearchResults([]);
      return;
    }

    if (!searchEmail.trim()) return;

    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .ilike("email", `%${searchEmail}%`);

    if (!error) {
      setSearchResults(data);
    }
  }

  async function handleAddUserToGroup(userId: string) {
    if (!selectedGroup) return;

    const { error } = await supabase.from("memberships").insert([{ userId, groupId: selectedGroup }]);

    if (!error) {
      alert("User added successfully!");
      setSearchEmail("");
      setSearchResults([]);
      fetchGroups();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Invite Users</h2>

        {/* Group Selection */}
        <label className="block text-sm font-semibold mb-2">Select Group:</label>
        <select
          className="border p-2 rounded w-full mb-4"
          value={selectedGroup ?? ""}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="" disabled>Select a group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        {/* Search Input */}
        <input
          type="text"
          className="border p-2 w-full rounded mb-2"
          placeholder="Search by email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={handleSearchUsers}>
          Search
        </button>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ul className="mt-4">
            {searchResults.map((user) => (
              <li key={user.id} className="flex justify-between items-center p-2 border-b">
                {user.email}
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded"
                  onClick={() => handleAddUserToGroup(user.id)}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}

        <button className="mt-4 bg-gray-500 text-white px-4 py-2 rounded w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
