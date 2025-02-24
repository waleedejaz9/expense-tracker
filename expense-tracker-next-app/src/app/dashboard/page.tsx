"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import debounce from "lodash.debounce";
interface Group {
  id: string;
  name: string;
  adminId: string;
  memberCount: number;
}

interface User {
  id: string;
  email: string;
}

export default function Dashboard() {
  const { setUser, user, signOut } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  useEffect(() => {
    fetchGroups();


  }, []);
  const ShimmerLoader = () => (
    <div className="animate-pulse">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="h-16 bg-gray-300 rounded-lg mb-4"></div>
      ))}
    </div>
  );
  async function fetchGroups() {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("group")
      .select("*, memberships(count)")
      .order("id", { ascending: false });

    if (!error) {
      setGroups(data.map(g => ({ ...g, memberCount: g.memberships[0]?.count || 0 })));
    }
    setLoading(false);
  }

  function openGroupModal() {
    setIsGroupModalOpen(true);
    setIsInviteModalOpen(false);
  }

  function closeGroupModal() {
    setIsGroupModalOpen(false);
    setGroupName("");
  }

  function openInviteModal(groupId: string) {
    setSelectedGroup(groupId);
    setIsInviteModalOpen(true);
    setIsGroupModalOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  function closeInviteModal() {
    setIsInviteModalOpen(false);
    setInviteError(null);
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) {
      alert("Group name cannot be empty!");
      return;
    }
    if (!user) return;

    // Create the group
    const { data, error } = await supabase
      .from("group")
      .insert([{ name: groupName, adminId: user.id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating group:", error);
      return;
    }

    // Insert the user as a member of the new group
    const { error: membershipError } = await supabase
      .from("memberships")
      .insert([{ userId: user.id, groupId: data.id }]);  // Assumes 'memberships' table has userId and groupId

    if (membershipError) {
      console.error("Error adding user to memberships:", membershipError);
      return;
    }

    // Update the local state (or do any other post-insertion tasks)
    setGroups([{ ...data, memberCount: 1 }, ...groups]);
    closeGroupModal();
  }


  async function handleDeleteGroup(groupId: string) {
    if (!confirm("Are you sure you want to delete this group?")) return;

    // First, delete all memberships related to this group
    const { error: membershipsError } = await supabase
        .from("memberships")
        .delete()
        .eq("groupId", groupId);

    if (membershipsError) {
        console.error("Error deleting memberships:", membershipsError);
        return;
    }

    // Now delete the group
    const { error: groupError } = await supabase
        .from("group")
        .delete()
        .eq("id", groupId)
        .eq("adminId", user?.id);

    if (groupError) {
        console.error("Error deleting group:", groupError);
        return;
    }

    // Update state
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
}


  // Debounced user search function
  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, email")
        .ilike("email", `%${query}%`) // Case-insensitive search
        .limit(5);

      if (!error) {
        setSearchResults(data);
      } else {
        console.error("Error searching users:", error);
      }
      setSearchLoading(false);
    }, 300), // 300ms delay
    []
  );
  async function handleInviteUser(invitedUserId: string) {
    if (!selectedGroup) return;

    // Check if the user is already in the group
    const { data: existingMember, error: checkError } = await supabase
      .from("memberships")
      .select("id")
      .eq("groupId", selectedGroup)
      .eq("userId", invitedUserId)
      .single();

    if (existingMember) {
      setInviteError("User is already a member of this group!");
      return;
    }

    // Proceed with invitation
    const { error } = await supabase
      .from("memberships")
      .insert([{ groupId: selectedGroup, userId: invitedUserId }]);

    if (error) {
      console.error("Error inviting user:", error);
      setInviteError("Failed to invite user. Please try again.");
      return;
    }

    // Update member count locally
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === selectedGroup
          ? { ...group, memberCount: group.memberCount + 1 }
          : group
      )
    );

    alert("User invited successfully!");
    closeInviteModal();
  }

  useEffect(() => {
    searchUsers(searchQuery);
  }, [searchQuery]);
  function openUsernameModal() {
    setNewUsername("")
    setIsUsernameModalOpen(true);
  }

  function closeUsernameModal() {
    setIsUsernameModalOpen(false);
  }

  async function handleUpdateUsername() {
    if (!newUsername.trim()) {
      alert("Username cannot be empty!");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ username: newUsername })
      .eq("id", user?.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating username:", error);
      return;
    }

    if (user) {
      const updatedUser = { ...user, username: data?.username };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser); // ✅ Update context safely
      closeUsernameModal();
    }
  }



  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {loading ? (
              <div className="h-6 w-40 bg-gray-300 rounded-md animate-pulse"></div>
            ) : (
              `Welcome, ${user?.username}`
            )}
          </h2>
          <div>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={openUsernameModal}
              disabled={loading}
            >
              Edit Username
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={signOut}
              disabled={loading}
            >
              {loading ? <div className="h-6 w-16 bg-gray-300 rounded-md animate-pulse"></div> : "Logout"}
            </button>
          </div>


        </div>
        {isUsernameModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={closeUsernameModal}
          >
            <div
              className="bg-white p-6 rounded-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-lg font-bold"
                onClick={closeUsernameModal}
              >
                ×
              </button>
              <h2 className="text-xl font-bold">Edit Username</h2>
              <input
                type="text"
                className="border p-2 w-full mt-2"
                placeholder="New username..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
                onClick={handleUpdateUsername}
              >
                Update
              </button>
            </div>
          </div>
        )}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600"
          onClick={openGroupModal}
          disabled={loading}
        >
          {loading ? <div className="h-6 w-24 bg-gray-300 rounded-md animate-pulse"></div> : "+ Create Group"}
        </button>

        <h1 className="text-2xl font-bold mt-6">Your Groups</h1>
        {loading ? (
          <div className="mt-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg flex justify-between items-center animate-pulse">
                <div className="h-6 w-32 bg-gray-300 rounded-md"></div>
                <div className="h-6 w-20 bg-gray-300 rounded-md"></div>
                <div className="flex space-x-2">
                  <div className="h-8 w-16 bg-gray-300 rounded-md"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded-md"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : groups.length > 0 ? (
          <ul className="mt-6">
            {groups.map((group) => (
              <li key={group.id} className="border p-4 rounded-lg mb-2 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {group.name} ({group.memberCount} members)
                </h3>
                <h2 className="text-sm text-gray-600">
                  Admin: {group.adminId === user?.id ? "Yes" : "No"}
                </h2>
                <div>
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    View
                  </button>
                  {user?.id === group.adminId && (
                    <button
                      className="bg-purple-500 text-white px-3 py-1 rounded mr-2"
                      onClick={() => openInviteModal(group.id)}
                    >
                      Invite
                    </button>
                  )}

                  {user?.id === group.adminId && (
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-500">No groups found. Create one to get started!</p>
        )}
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={closeGroupModal}>
          <div className="bg-white p-6 rounded-lg relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-lg font-bold" onClick={closeGroupModal}>×</button>
            <h2 className="text-xl font-bold">Create Group</h2>
            <input
              type="text"
              className="border p-2 w-full mt-2"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded" onClick={handleCreateGroup}>
              Create
            </button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={closeInviteModal}>
          <div className="bg-white p-6 rounded-lg relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-lg font-bold" onClick={closeInviteModal}>×</button>
            <h2 className="text-xl font-bold">Invite User</h2>
            <input
              type="text"
              className="border p-2 w-full mt-2"
              placeholder="Search email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchLoading ? (
              <p>Searching...</p>
            ) : searchQuery && searchResults.length === 0 ? (
              <p>No user found for this search</p>
            ) : (
              <ul>
                {searchResults
                  .filter((searchUser) => searchUser.id !== user?.id) // Exclude logged-in user
                  .map((searchUser, index) => (
                    <li
                      key={searchUser.id}
                      className={`p-2 cursor-pointer ${hoveredIndex === index ? "bg-gray-200" : ""}`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => handleInviteUser(searchUser.id)}
                    >
                      {searchUser.email}
                    </li>
                  ))}
              </ul>
            )}
            {inviteError && <p className="text-red-500">{inviteError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
