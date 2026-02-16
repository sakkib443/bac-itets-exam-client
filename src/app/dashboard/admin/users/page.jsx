"use client";

import React, { useState, useEffect } from "react";
import {
    FaUsers,
    FaSearch,
    FaSpinner,
    FaUserShield,
    FaUser,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Simulated data - will connect to actual API later
        setTimeout(() => {
            setUsers([
                {
                    _id: "1",
                    name: "Admin User",
                    email: "admin@bdcalling.com",
                    phone: "01712345678",
                    role: "admin",
                    createdAt: new Date().toISOString(),
                },
                {
                    _id: "2",
                    name: "IELTS Admin",
                    email: "ielts@bdcalling.com",
                    phone: "01700000003",
                    role: "admin",
                    createdAt: new Date().toISOString(),
                },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const roleColors = {
        admin: "bg-purple-100 text-purple-700",
        user: "bg-blue-100 text-blue-700",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Users</h1>
                    <p className="text-gray-500 mt-1">Manage admin and user accounts</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <FaUserShield className="text-blue-500 text-xl mt-0.5" />
                <div>
                    <p className="text-blue-800 font-medium">Admin Accounts</p>
                    <p className="text-blue-600 text-sm">
                        Any user with email ending in @bdcalling.com or @bdcalling.academy automatically gets admin role.
                        Students are managed separately in the Students section.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative max-w-md">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <FaSpinner className="animate-spin text-3xl text-cyan-500 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading users...</p>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users
                                    .filter(
                                        (u) =>
                                            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                                        <span className="text-white font-semibold">
                                                            {user.name?.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-gray-800">{user.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-4 py-4 text-gray-600">{user.phone}</td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                                                >
                                                    {user.role === "admin" ? <FaUserShield /> : <FaUser />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <FaUsers className="text-gray-300 text-5xl mx-auto mb-4" />
                                        <p className="text-gray-500">No users found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
