"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    FaPlus,
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaHeadphones,
    FaBook,
    FaPen,
    FaToggleOn,
    FaToggleOff,
    FaClone,
    FaMicrophone,
} from "react-icons/fa";
import { questionSetsAPI } from "@/lib/api";

export default function QuestionSetsPage() {
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get("type");

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        setType: typeFromUrl || "",
        difficulty: "",
        isActive: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [stats, setStats] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, set: null });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (typeFromUrl) {
            setFilters(prev => ({ ...prev, setType: typeFromUrl }));
        }
    }, [typeFromUrl]);

    useEffect(() => {
        fetchQuestionSets();
        fetchStats();
    }, [pagination.page, filters]);

    const fetchQuestionSets = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(searchTerm && { searchTerm }),
                ...(filters.setType && { setType: filters.setType }),
                ...(filters.difficulty && { difficulty: filters.difficulty }),
                ...(filters.isActive !== "" && { isActive: filters.isActive }),
            };

            const response = await questionSetsAPI.getAll(params);

            if (response.success && response.data) {
                setSets(response.data.sets);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch question sets:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await questionSetsAPI.getStatistics();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchQuestionSets();
    };

    const handleToggleActive = async (set) => {
        try {
            await questionSetsAPI.toggleActive(set._id);
            fetchQuestionSets();
        } catch (error) {
            alert("Failed to toggle status: " + error.message);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.set) return;

        try {
            setActionLoading(true);
            await questionSetsAPI.delete(deleteModal.set._id);
            setDeleteModal({ show: false, set: null });
            fetchQuestionSets();
        } catch (error) {
            alert("Failed to delete: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "LISTENING":
                return <FaHeadphones className="text-purple-600" />;
            case "READING":
                return <FaBook className="text-blue-600" />;
            case "WRITING":
                return <FaPen className="text-green-600" />;
            case "SPEAKING":
                return <FaMicrophone className="text-orange-600" />;
            default:
                return null;
        }
    };

    const getTypeBg = (type) => {
        switch (type) {
            case "LISTENING":
                return "bg-purple-100";
            case "READING":
                return "bg-blue-100";
            case "WRITING":
                return "bg-green-100";
            case "SPEAKING":
                return "bg-orange-100";
            default:
                return "bg-gray-100";
        }
    };

    const difficultyColors = {
        easy: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        hard: "bg-red-100 text-red-700",
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Question Sets</h1>
                    <p className="text-gray-500 mt-1">Manage listening, reading, writing, and speaking question sets</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/question-sets/create?type=LISTENING"
                        className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all flex items-center gap-2"
                    >
                        <FaHeadphones />
                        Listening
                    </Link>
                    <Link
                        href="/dashboard/admin/question-sets/create?type=READING"
                        className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                        <FaBook />
                        Reading
                    </Link>
                    <Link
                        href="/dashboard/admin/question-sets/create?type=WRITING"
                        className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all flex items-center gap-2"
                    >
                        <FaPen />
                        Writing
                    </Link>
                    {/* Speaking button hidden */}
                    {false && (
                        <Link
                            href="/dashboard/admin/question-sets/create?type=SPEAKING"
                            className="px-4 py-2.5 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-all flex items-center gap-2"
                        >
                            <FaMicrophone />
                            Speaking
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FaHeadphones className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Listening</p>
                            <p className="text-xl font-bold text-gray-800">{stats?.listening || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FaBook className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Reading</p>
                            <p className="text-xl font-bold text-gray-800">{stats?.reading || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FaPen className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Writing</p>
                            <p className="text-xl font-bold text-gray-800">{stats?.writing || 0}</p>
                        </div>
                    </div>
                </div>
                {/* Speaking stat card hidden */}
                {false && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <FaMicrophone className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Speaking</p>
                                <p className="text-xl font-bold text-gray-800">{stats?.speaking || 0}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <FaClone className="text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Usage</p>
                            <p className="text-xl font-bold text-gray-800">{stats?.totalUsage || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title or set ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </form>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${showFilters ? "bg-cyan-50 border-cyan-500 text-cyan-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <FaFilter />
                        Filters
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Set Type</label>
                            <select
                                value={filters.setType}
                                onChange={(e) => setFilters(prev => ({ ...prev, setType: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Types</option>
                                <option value="LISTENING">Listening</option>
                                <option value="READING">Reading</option>
                                <option value="WRITING">Writing</option>
                                {/* <option value="SPEAKING">Speaking</option> */}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                            <select
                                value={filters.difficulty}
                                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Difficulty</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.isActive}
                                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ setType: "", difficulty: "", isActive: "" })}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Question Sets Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Set
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Questions
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Difficulty
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usage
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <FaSpinner className="animate-spin text-3xl text-cyan-500 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading question sets...</p>
                                    </td>
                                </tr>
                            ) : sets.length > 0 ? (
                                sets.map((set) => (
                                    <tr key={set._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-800">{set.title}</p>
                                                {/* Hidden setId to remove branding like 'Cambridge' */}
                                                {/* <code className="text-xs text-gray-500 font-mono">{set.setId}</code> */}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getTypeBg(set.setType)}`}>
                                                {getTypeIcon(set.setType)}
                                                <span className="text-sm font-medium">{set.setType}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {set.totalQuestions} questions
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {set.duration} mins
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${difficultyColors[set.difficulty]}`}>
                                                {set.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {set.usageCount || 0} times
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => handleToggleActive(set)}
                                                className={`p-2 rounded-lg transition-colors ${set.isActive
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-gray-400 hover:bg-gray-50"
                                                    }`}
                                                title={set.isActive ? "Active - Click to deactivate" : "Inactive - Click to activate"}
                                            >
                                                {set.isActive ? (
                                                    <FaToggleOn className="text-2xl" />
                                                ) : (
                                                    <FaToggleOff className="text-2xl" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/dashboard/admin/question-sets/${set._id}`}
                                                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/admin/question-sets/${set._id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, set })}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 text-5xl mb-4">📚</div>
                                        <p className="text-gray-500">No question sets found</p>
                                        <div className="flex justify-center gap-3 mt-4">
                                            <Link
                                                href="/dashboard/admin/question-sets/create?type=LISTENING"
                                                className="text-purple-600 hover:underline"
                                            >
                                                Create Listening Set
                                            </Link>
                                            <span className="text-gray-300">|</span>
                                            <Link
                                                href="/dashboard/admin/question-sets/create?type=READING"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Create Reading Set
                                            </Link>
                                            <span className="text-gray-300">|</span>
                                            <Link
                                                href="/dashboard/admin/question-sets/create?type=WRITING"
                                                className="text-green-600 hover:underline"
                                            >
                                                Create Writing Set
                                            </Link>
                                            {/* <span className="text-gray-300">|</span>
                                            <Link
                                                href="/dashboard/admin/question-sets/create?type=SPEAKING"
                                                className="text-orange-600 hover:underline"
                                            >
                                                Create Speaking Set
                                            </Link> */}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                            {pagination.total} sets
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <FaChevronLeft className="text-sm" />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <FaChevronRight className="text-sm" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Question Set</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{deleteModal.set?.title}</strong>?
                            This will <strong>permanently delete</strong> the set from the database. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, set: null })}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading && <FaSpinner className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
