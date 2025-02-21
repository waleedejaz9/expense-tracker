"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchGroups: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, fetchGroups }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");

  if (!isOpen) return null;

  async function handleCreateGroup() {
    if (!groupName.trim()) return;

    const { data, error } = await supabase.from("group").insert([{ name: groupName }]).select().single();

    if (!error) {
      fetchGroups();
      setGroupName("");
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create Group</h2>
        
        <input
          type="text"
          className="border p-2 w-full rounded mb-4"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={handleCreateGroup}>
          Create
        </button>

        <button className="mt-4 bg-gray-500 text-white px-4 py-2 rounded w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
