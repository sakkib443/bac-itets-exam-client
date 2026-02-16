"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaPlay,
    FaClock,
    FaQuestionCircle,
    FaArrowRight,
    FaLayerGroup,
    FaSpinner,
    FaUser,
    FaCheckCircle,
    FaLock
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ExamSelectionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.examId;

    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [completedModules, setCompletedModules] = useState([]);
    const [moduleScores, setModuleScores] = useState(null);

    useEffect(() => {
        const loadSessionAndVerify = async () => {
            // Load session from localStorage
            const storedSession = localStorage.getItem("examSession");
            if (!storedSession) {
                setError("No exam session found. Please start from the exam entry page.");
                setIsLoading(false);
                return;
            }

            try {
                const parsed = JSON.parse(storedSession);

                // Verify session ID matches
                // The URL can contain either:
                // 1. sessionId (e.g., SESSION-EXAMID-TIMESTAMP) - from start-exam page
                // 2. examId (e.g., BACIELTS2500001) - from dashboard
                const isValidSession =
                    parsed.sessionId === sessionId ||
                    parsed.examId === sessionId ||
                    (parsed.sessionId && parsed.sessionId.includes(sessionId)) ||
                    (sessionId && sessionId.includes(parsed.examId));

                if (!isValidSession) {
                    setError("Invalid session. Please start again.");
                    setIsLoading(false);
                    return;
                }

                // Normalize the session object
                if (!parsed.studentName && parsed.name) {
                    parsed.studentName = parsed.name;
                }

                setSession(parsed);

                // IMPORTANT: Fetch completedModules from DATABASE (not just localStorage)
                // This prevents students from bypassing by clearing localStorage
                try {
                    const verifyResponse = await studentsAPI.verifyExamId(parsed.examId);
                    if (verifyResponse.success && verifyResponse.data) {
                        // Even if valid is false, it might be because it's already completed
                        // in which case we still want to show the completion screen
                        const dbCompletedModules = verifyResponse.data.completedModules || [];
                        const dbScores = verifyResponse.data.scores || null;

                        // Check if exam is completed (at least 3 modules done)
                        // If invalid but all 3 modules done, we should NOT show error, but show completion screen
                        if (!verifyResponse.data.valid && dbCompletedModules.length < 3) {
                            setError(verifyResponse.data.message || "Invalid session. Please start again.");
                            setIsLoading(false);
                            return;
                        }

                        // Update state with database values (source of truth)
                        setCompletedModules(dbCompletedModules);
                        if (dbScores) setModuleScores(dbScores);

                        // Also update localStorage to keep in sync
                        parsed.completedModules = dbCompletedModules;
                        parsed.scores = dbScores;
                        localStorage.setItem("examSession", JSON.stringify(parsed));
                    }
                } catch (apiError) {
                    console.error("Failed to verify from database, using localStorage:", apiError);
                    // Fallback to localStorage if API fails
                    if (parsed.completedModules && Array.isArray(parsed.completedModules)) {
                        setCompletedModules(parsed.completedModules);
                    }
                    if (parsed.scores) {
                        setModuleScores(parsed.scores);
                    }
                }
            } catch (err) {
                setError("Session data corrupted. Please start again.");
            }

            setIsLoading(false);
        };

        loadSessionAndVerify();
    }, [sessionId]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-cyan-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/start-exam")}
                        className="bg-cyan-600 text-white px-6 py-2 rounded hover:bg-cyan-700"
                    >
                        Go to Exam Entry
                    </button>
                </div>
            </div>
        );
    }

    // Exam modules configuration
    const examModules = [
        {
            id: "listening",
            name: "Listening",
            icon: <FaHeadphones className="text-2xl" />,
            duration: 40,
            questions: 40,
            sections: 4,
            description: "Audio-based comprehension",
            details: "4 recordings: conversations & lectures",
            color: "cyan",
            setNumber: session?.assignedSets?.listeningSetNumber
        },
        {
            id: "reading",
            name: "Reading",
            icon: <FaBook className="text-2xl" />,
            duration: 60,
            questions: 40,
            sections: 3,
            description: "Academic passage analysis",
            details: "3 passages with increasing difficulty",
            color: "blue",
            setNumber: session?.assignedSets?.readingSetNumber
        },
        {
            id: "writing",
            name: "Writing",
            icon: <FaPen className="text-2xl" />,
            duration: 60,
            questions: 2,
            sections: 2,
            description: "Academic writing tasks",
            details: "Task 1: 150 words • Task 2: 250 words",
            color: "green",
            setNumber: session?.assignedSets?.writingSetNumber
        }
    ];

    const handleStartModule = (moduleId) => {
        router.push(`/exam/${sessionId}/${moduleId}`);
    };

    const handleStartFullExam = () => {
        router.push(`/exam/${sessionId}/full`);
    };

    const totalTime = examModules.reduce((sum, m) => sum + m.duration, 0);
    const totalQuestions = examModules.reduce((sum, m) => sum + m.questions, 0);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaUser className="text-cyan-600" />
                            <span>{session?.studentName || "Student"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded">
                            <span>ID: <span className="font-mono font-semibold text-gray-700">{session?.examId}</span></span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* Check if all modules are completed */}
                {completedModules.length >= 3 ? (
                    <div className="max-w-2xl mx-auto text-center py-10 px-6 bg-white rounded-md border border-gray-200 shadow-sm relative">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
                                <FaCheckCircle className="text-3xl" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Congratulations!
                            </h1>
                            <h2 className="text-lg font-medium text-green-600 mb-6">
                                Examination Completed Successfully
                            </h2>

                            <div className="max-w-xl mx-auto space-y-4">
                                <p className="text-gray-600 text-base">
                                    Thank you, <span className="font-semibold text-gray-800">{session?.studentName}</span>! You have successfully finished all modules.
                                </p>

                                <div className="bg-gray-50 border border-gray-200 rounded-md p-6 my-6 text-left">
                                    <p className="text-gray-800 text-sm font-semibold mb-4 tracking-tight uppercase">
                                        SUBMISSION CONFIRMED
                                    </p>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <FaUser className="text-xs text-cyan-600" />
                                            <p className="text-sm text-gray-700 font-medium">Login with Exam ID & Password for results</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FaQuestionCircle className="text-xs text-green-600" />
                                            <p className="text-sm text-gray-700 font-medium">Contact support team for assistance</p>
                                        </div>
                                    </div>

                                    <p className="text-amber-600 text-[11px] border-t border-gray-200 pt-3 italic">
                                        * Writing results available in 24-48 hours.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("examSession");
                                        router.push("/");
                                    }}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-gray-900 text-white rounded-md font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    Go to Home
                                    <FaArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Student Login
                                </button>
                            </div>

                            <p className="mt-8 text-gray-400 text-xs uppercase tracking-widest font-mono">
                                ID: {session?.examId}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                IELTS Academic Test
                            </h1>
                            <p className="text-gray-500">
                                Welcome, {session?.studentName}! Select a module to start your exam.
                            </p>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-cyan-600">{totalQuestions}</p>
                                <p className="text-gray-500 text-sm">Total Questions</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-amber-500">{totalTime}</p>
                                <p className="text-gray-500 text-sm">Minutes</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">9.0</p>
                                <p className="text-gray-500 text-sm">Max Band</p>
                            </div>
                        </div>

                        {/* Full Exam Card */}
                        <div
                            onClick={handleStartFullExam}
                            className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-6 mb-8 cursor-pointer hover:border-cyan-400 transition-colors"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-cyan-600 rounded-xl flex items-center justify-center text-white">
                                        <FaLayerGroup className="text-2xl" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-bold text-gray-800">Complete IELTS Exam</h2>
                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">Recommended</span>
                                        </div>
                                        <p className="text-gray-500 mb-3">Take all three sections: Listening → Reading → Writing</p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                            <span className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200">
                                                <FaClock className="text-cyan-600" />
                                                {totalTime} minutes
                                            </span>
                                            <span className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200">
                                                <FaQuestionCircle className="text-cyan-600" />
                                                {totalQuestions} questions
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors cursor-pointer">
                                    <FaPlay />
                                    Start Full Exam
                                    <FaArrowRight className="text-sm" />
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-sm">OR PRACTICE INDIVIDUAL SECTIONS</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* Individual Module Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {examModules.map((module) => {
                                const hasSet = module.setNumber != null;
                                const isCompleted = completedModules.includes(module.id);

                                // Get score for completed module
                                const getModuleScore = () => {
                                    if (!moduleScores) return null;
                                    if (module.id === "listening") return moduleScores.listening?.band;
                                    if (module.id === "reading") return moduleScores.reading?.band;
                                    if (module.id === "writing") return moduleScores.writing?.overallBand;
                                    if (module.id === "speaking") return moduleScores.speaking?.band;
                                    return null;
                                };
                                const score = getModuleScore();

                                return (
                                    <div
                                        key={module.id}
                                        onClick={() => hasSet && !isCompleted && handleStartModule(module.id)}
                                        className={`bg-white border-2 rounded-lg p-5 transition-all relative ${isCompleted
                                            ? "border-green-400 bg-green-50 cursor-not-allowed"
                                            : hasSet
                                                ? "border-gray-200 cursor-pointer hover:border-cyan-400 hover:shadow-md"
                                                : "border-gray-100 opacity-60 cursor-not-allowed"
                                            }`}
                                    >
                                        {/* Completed Badge */}
                                        {isCompleted && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                <FaCheckCircle className="text-xs" />
                                                Completed
                                            </div>
                                        )}

                                        <div className={`w-14 h-14 ${isCompleted
                                            ? 'bg-green-100 text-green-600'
                                            : module.color === 'cyan'
                                                ? 'bg-cyan-100 text-cyan-600'
                                                : module.color === 'blue'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : module.color === 'orange'
                                                        ? 'bg-orange-100 text-orange-600'
                                                        : 'bg-green-100 text-green-600'
                                            } rounded-xl flex items-center justify-center mb-4`}>
                                            {isCompleted ? <FaCheckCircle className="text-2xl" /> : module.icon}
                                        </div>

                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800">{module.name}</h3>
                                            {hasSet && !isCompleted && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                                                    Set #{module.setNumber}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm mb-1">{module.description}</p>
                                        <p className="text-gray-400 text-xs mb-4">{module.details}</p>

                                        {!isCompleted && (
                                            <div className="space-y-2 mb-4 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Duration</span>
                                                    <span className="text-gray-800 font-medium">{module.duration} mins</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Questions</span>
                                                    <span className="text-gray-800 font-medium">{module.questions}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Sections</span>
                                                    <span className="text-gray-800 font-medium">{module.sections}</span>
                                                </div>
                                            </div>
                                        )}

                                        {isCompleted ? (
                                            <div className="w-full flex items-center justify-center gap-2 bg-green-200 text-green-700 py-2.5 rounded-lg font-medium">
                                                <FaLock className="text-sm" />
                                                Already Completed
                                            </div>
                                        ) : hasSet ? (
                                            <button className={`w-full flex items-center justify-center gap-3 ${module.color === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-700' : module.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : module.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg cursor-pointer group`}>
                                                <FaPlay className="text-sm transition-transform group-hover:scale-110" />
                                                <span>Start {module.name}</span>
                                                <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
                                            </button>
                                        ) : (
                                            <div className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-2.5 rounded-lg font-medium">
                                                Not Assigned
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info Banner */}
                        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaQuestionCircle className="text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-gray-800 font-semibold mb-1">IELTS Band Score Information</h4>
                                    <p className="text-gray-600 text-sm">
                                        Most universities require Band 6.0-6.5 for undergraduate and 6.5-7.0 for graduate programs.
                                        Practice regularly to improve your score!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-4 mt-auto">
                <div className="max-w-5xl mx-auto text-center text-gray-400 text-sm">
                    © 2024 IELTS Exam - Mizan's Care. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
