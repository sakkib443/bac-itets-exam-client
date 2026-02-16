"use client";

import React, { useState, useEffect } from "react";
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaIdCard,
    FaCalendarAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaClock,
    FaArrowRight,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaClipboardCheck,
    FaClipboardList,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { studentsAPI } from "@/lib/api";

export default function StudentDashboard() {
    const router = useRouter();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await studentsAPI.getMyProfile();
                if (response.success) {
                    setStudentData(response.data);
                } else {
                    setError("Failed to fetch student data");
                }
            } catch (err) {
                console.error("Dashboard error:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full mb-3"></div>
                <p className="text-gray-500 text-sm">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-lg mx-auto mt-16">
                <div className="bg-red-50 border border-red-200 rounded-md p-5 flex items-start gap-3">
                    <FaExclamationCircle className="text-red-500 mt-0.5" />
                    <div>
                        <h3 className="text-red-800 font-medium text-sm mb-1">Error</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const {
        nameEnglish,
        email,
        phone,
        examId,
        examStatus,
        examDate,
        paymentStatus,
        scores,
        resultsPublished,
        completedModules = [],
    } = studentData;

    const isAllCompleted = completedModules.length >= 3;

    // Check if today is exam day
    const isExamDay = () => {
        if (!examDate) return false;
        const today = new Date();
        const exam = new Date(examDate);
        return (
            today.getFullYear() === exam.getFullYear() &&
            today.getMonth() === exam.getMonth() &&
            today.getDate() === exam.getDate()
        );
    };

    const formatExamDate = (date) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleStartExam = () => {
        if (!isExamDay()) {
            alert(`Your exam is scheduled for ${formatExamDate(examDate)}. Please come back on that day.`);
            return;
        }
        localStorage.setItem(
            "examSession",
            JSON.stringify({
                examId: studentData.examId,
                sessionId: studentData.examId, // For compatibility
                studentName: studentData.nameEnglish,
                name: studentData.nameEnglish,
                email: studentData.email,
            })
        );
        router.push(`/exam/${examId}`);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Welcome, {nameEnglish?.split(" ")[0]}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Here's your exam overview
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="Exam Status"
                    value={examStatus}
                    type="badge"
                />
                <StatCard
                    label="Completed"
                    value={`${completedModules.length}/3 Modules`}
                />
                <StatCard
                    label="Exam Date"
                    value={examDate ? new Date(examDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not set"}
                />
                <StatCard
                    label="Payment"
                    value={paymentStatus}
                    type="badge"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profile Card */}
                <div className="bg-white border border-gray-200 rounded-md p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-700 font-semibold text-lg">
                            {nameEnglish?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-800">{nameEnglish}</h3>
                            <p className="text-xs text-gray-500">IELTS Candidate</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <InfoRow icon={FaIdCard} label="Exam ID" value={examId} />
                        <InfoRow icon={FaEnvelope} label="Email" value={email} />
                        <InfoRow icon={FaPhone} label="Phone" value={phone} />
                        <InfoRow icon={FaCalendarAlt} label="Exam Date" value={examDate ? new Date(examDate).toLocaleDateString() : "N/A"} />
                    </div>
                </div>

                {/* Exam Progress */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-medium text-gray-800">Exam Progress</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Track your module completion</p>
                        </div>
                        {!isAllCompleted && paymentStatus === "paid" ? (
                            <button
                                onClick={handleStartExam}
                                className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2"
                            >
                                Continue Exam <FaArrowRight size={12} />
                            </button>
                        ) : isAllCompleted ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5">
                                <FaCheckCircle size={12} /> Completed
                            </span>
                        ) : null}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Progress</span>
                            <span>{completedModules.length}/3 completed</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-600 rounded-full transition-all duration-500"
                                style={{ width: `${(completedModules.length / 3) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Module Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <ModuleCard
                            title="Listening"
                            icon={FaHeadphones}
                            completed={completedModules.includes("listening")}
                        />
                        <ModuleCard
                            title="Reading"
                            icon={FaBook}
                            completed={completedModules.includes("reading")}
                        />
                        <ModuleCard
                            title="Writing"
                            icon={FaPen}
                            completed={completedModules.includes("writing")}
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="mt-4">
                {resultsPublished ? (
                    /* Results Published - Show Scores */
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-medium text-gray-800">Your Results</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Official band scores</p>
                            </div>
                            <div className="bg-cyan-600 text-white px-5 py-3 rounded-md text-center">
                                <p className="text-[10px] uppercase tracking-wide opacity-80">Overall Band</p>
                                <p className="text-2xl font-bold">{scores?.overall || "—"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <ScoreCard
                                title="Listening"
                                icon={FaHeadphones}
                                band={scores?.listening?.band}
                                raw={scores?.listening?.raw}
                                total={40}
                            />
                            <ScoreCard
                                title="Reading"
                                icon={FaBook}
                                band={scores?.reading?.band}
                                raw={scores?.reading?.raw}
                                total={40}
                            />
                            <ScoreCard
                                title="Writing"
                                icon={FaPen}
                                band={scores?.writing?.overallBand}
                            />
                        </div>
                    </div>
                ) : isAllCompleted ? (
                    /* Exam Completed but Results Not Published - Pending */
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-md flex items-center justify-center">
                                <FaClock className="text-amber-600 text-lg" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-800">Results Under Review</h3>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Your exam has been submitted. Admin will publish your results soon.
                                </p>
                            </div>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-medium">
                                Pending
                            </span>
                        </div>
                    </div>
                ) : completedModules.length > 0 ? (
                    /* Exam In Progress */
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center">
                                <FaClipboardCheck className="text-blue-600 text-lg" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-800">Exam In Progress</h3>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Complete all modules to get your results.
                                </p>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-medium">
                                {completedModules.length}/3 Done
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Exam Not Started */
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                <FaClipboardList className="text-gray-500 text-lg" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-800">Start Your Exam</h3>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Your exam is scheduled for {formatExamDate(examDate)}.
                                </p>
                            </div>
                            <button
                                onClick={handleStartExam}
                                className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors"
                            >
                                Start Exam
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// === Components ===

const StatCard = ({ label, value, type }) => {
    const getBadgeStyle = (val) => {
        const v = val?.toLowerCase();
        if (v === "completed" || v === "paid") return "bg-green-100 text-green-700";
        if (v === "in-progress" || v === "pending") return "bg-amber-100 text-amber-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            {type === "badge" ? (
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getBadgeStyle(value)}`}>
                    {value}
                </span>
            ) : (
                <p className="text-sm font-medium text-gray-800">{value}</p>
            )}
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
            <Icon size={12} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 truncate">{value || "N/A"}</p>
        </div>
    </div>
);

const ModuleCard = ({ title, icon: Icon, completed }) => (
    <div className={`p-4 rounded-md border ${completed ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${completed ? "bg-green-200 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                {completed ? <FaCheckCircle size={12} /> : <Icon size={12} />}
            </div>
            <span className={`text-sm font-medium ${completed ? "text-green-700" : "text-gray-600"}`}>
                {title}
            </span>
        </div>
        <p className={`text-xs ${completed ? "text-green-600" : "text-gray-400"}`}>
            {completed ? "Completed" : "Pending"}
        </p>
    </div>
);

const ScoreCard = ({ title, icon: Icon, band, raw, total }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-600">
                <Icon size={12} />
            </div>
            <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <div className="text-center py-2 bg-white rounded-md border border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Band</p>
            <p className="text-xl font-bold text-gray-800">
                {band !== undefined ? band.toFixed(1) : "—"}
            </p>
        </div>
        {raw !== undefined && (
            <div className="mt-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Correct</span>
                    <span>{raw}/{total}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-600 rounded-full"
                        style={{ width: `${(raw / total) * 100}%` }}
                    />
                </div>
            </div>
        )}
    </div>
);
