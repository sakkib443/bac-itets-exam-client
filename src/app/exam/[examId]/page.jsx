"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaPlay,
    FaClock,
    FaQuestionCircle,
    FaArrowRight,
    FaLayerGroup,
    FaSpinner,
    FaUser,
    FaCheckCircle,
    FaLock,
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
            const storedSession = localStorage.getItem("examSession");
            if (!storedSession) {
                setError("No exam session found. Please start from the exam entry page.");
                setIsLoading(false);
                return;
            }

            try {
                const parsed = JSON.parse(storedSession);
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

                if (!parsed.studentName && parsed.name) {
                    parsed.studentName = parsed.name;
                }

                setSession(parsed);

                try {
                    const verifyResponse = await studentsAPI.verifyExamId(parsed.examId);
                    if (verifyResponse.success && verifyResponse.data) {
                        const dbCompletedModules = verifyResponse.data.completedModules || [];
                        const dbScores = verifyResponse.data.scores || null;

                        if (!verifyResponse.data.valid && dbCompletedModules.length < 3) {
                            setError(verifyResponse.data.message || "Invalid session. Please start again.");
                            setIsLoading(false);
                            return;
                        }

                        setCompletedModules(dbCompletedModules);
                        if (dbScores) setModuleScores(dbScores);

                        parsed.completedModules = dbCompletedModules;
                        parsed.scores = dbScores;
                        localStorage.setItem("examSession", JSON.stringify(parsed));
                    }
                } catch (apiError) {
                    console.error("Failed to verify from database, using localStorage:", apiError);
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

    // Support multi-set: assignedSets can have arrays (new) or single values (old format)
    const getSetsForModule = (moduleName) => {
        const sets = session?.assignedSets;
        if (!sets) return [];
        const key = `${moduleName}SetNumber`;
        const keysArr = `${moduleName}SetNumbers`;
        // Check for array format first (new multi-set)
        if (sets[keysArr] && Array.isArray(sets[keysArr]) && sets[keysArr].length > 0) {
            return sets[keysArr];
        }
        // Fallback to single value (old format)
        if (sets[key] != null) {
            return [sets[key]];
        }
        return [];
    };

    // Exam modules configuration
    const examModules = [
        {
            id: "listening",
            name: "Listening",
            icon: <FaHeadphones />,
            duration: 40,
            questions: 40,
            sections: 4,
            description: "Audio-based comprehension",
            details: "4 recordings",
            color: "cyan",
            sets: getSetsForModule("listening"),
        },
        {
            id: "reading",
            name: "Reading",
            icon: <FaBook />,
            duration: 60,
            questions: 40,
            sections: 3,
            description: "Academic passage analysis",
            details: "3 passages",
            color: "blue",
            sets: getSetsForModule("reading"),
        },
        {
            id: "writing",
            name: "Writing",
            icon: <FaPen />,
            duration: 60,
            questions: 2,
            sections: 2,
            description: "Academic writing tasks",
            details: "Task 1 & 2",
            color: "green",
            sets: getSetsForModule("writing"),
        },
    ];

    const totalTime = examModules.reduce((sum, m) => sum + m.duration, 0);
    const totalQuestions = examModules.reduce((sum, m) => sum + m.questions, 0);



    const handleStartModule = (moduleId, setNumber) => {
        // Store which set number to use
        if (setNumber != null) {
            const sessionData = JSON.parse(localStorage.getItem("examSession") || "{}");
            sessionData.currentSetNumber = setNumber;
            sessionData.currentModule = moduleId;
            localStorage.setItem("examSession", JSON.stringify(sessionData));
        }
        router.push(`/exam/${sessionId}/${moduleId}`);
    };

    const handleStartFullExam = () => {
        router.push(`/exam/${sessionId}/full`);
    };

    return (
        <div className="min-h-screen bg-white transition-colors duration-300">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-3 px-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <FaUser className="text-cyan-600 text-xs" />
                            <span>{session?.studentName || "Student"}</span>
                        </div>
                        <div className="text-gray-500 text-xs bg-gray-100 px-3 py-1.5 rounded font-mono">
                            {session?.examId}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {(() => {
                    // Calculate total expected exams (multi-set aware)
                    const totalExpected = examModules.reduce((sum, m) => sum + Math.max(m.sets.length, 1), 0);
                    const allDone = completedModules.length >= totalExpected;
                    return allDone;
                })() ? (
                    /* ═══ All Done ═══ */
                    <div className="max-w-xl mx-auto text-center py-8 px-6 bg-white rounded-md border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-2xl" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h1>
                        <h2 className="text-sm font-medium text-green-600 mb-4">Examination Completed Successfully</h2>

                        <p className="text-gray-600 text-sm mb-4">
                            Thank you, <span className="font-semibold text-gray-800">{session?.studentName}</span>!
                            You have finished all modules.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5 text-left text-sm">
                            <p className="text-gray-800 font-semibold mb-2 text-xs uppercase tracking-tight">SUBMISSION CONFIRMED</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <FaUser className="text-xs text-cyan-600" />
                                    Login with Exam ID & Password for results
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <FaQuestionCircle className="text-xs text-green-600" />
                                    Contact support team for assistance
                                </div>
                            </div>
                            <p className="text-amber-600 text-[10px] border-t border-gray-200 pt-2 mt-3 italic">
                                * Writing results available in 24-48 hours.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem("examSession");
                                    localStorage.removeItem("systemCheckDone");
                                    router.push("/");
                                }}
                                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black flex items-center gap-2 cursor-pointer"
                            >
                                Go to Home <FaArrowRight className="text-xs" />
                            </button>
                            <button
                                onClick={() => router.push("/login")}
                                className="px-5 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer"
                            >
                                Student Login
                            </button>
                        </div>

                        <p className="mt-5 text-gray-400 text-[10px] uppercase tracking-widest font-mono">
                            ID: {session?.examId}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">IELTS Academic Test</h1>
                            <p className="text-gray-500 text-sm">
                                Welcome, {session?.studentName}! Select a module to begin.
                            </p>
                        </div>

                        {/* Stats Row — compact */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-cyan-600">{totalQuestions}</p>
                                <p className="text-gray-500 text-[10px]">Questions</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-amber-500">{totalTime}</p>
                                <p className="text-gray-500 text-[10px]">Minutes</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-green-600">9.0</p>
                                <p className="text-gray-500 text-[10px]">Max Band</p>
                            </div>
                        </div>

                        {/* Full Exam Button — compact */}
                        <div
                            onClick={handleStartFullExam}
                            className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4 mb-5 cursor-pointer hover:border-cyan-400 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white">
                                        <FaLayerGroup className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-gray-800">Complete IELTS Exam</h2>
                                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Recommended</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Listening → Reading → Writing</p>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 cursor-pointer">
                                    <FaPlay className="text-xs" /> Start <FaArrowRight className="text-xs" />
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider">OR INDIVIDUAL SECTIONS</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* ═══ Module Cards — One per Set ═══ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {examModules.flatMap((module) => {
                                const isFullyCompleted = completedModules.includes(module.id);
                                const colorMap = {
                                    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700', border: 'border-cyan-300', light: 'bg-cyan-50' },
                                    blue: { bg: 'bg-blue-100', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700', border: 'border-blue-300', light: 'bg-blue-50' },
                                    green: { bg: 'bg-green-100', text: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700', border: 'border-green-300', light: 'bg-green-50' },
                                };
                                const c = colorMap[module.color] || colorMap.cyan;

                                // If no sets assigned, show single disabled card
                                if (module.sets.length === 0) {
                                    return [(
                                        <div key={module.id} className="bg-white border border-gray-100 rounded-xl p-4 opacity-50">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-lg flex items-center justify-center text-lg`}>
                                                    {module.icon}
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-800">{module.name}</h3>
                                            </div>
                                            <div className="w-full flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-medium">
                                                Not Assigned
                                            </div>
                                        </div>
                                    )];
                                }

                                // If module fully completed (old format), show single done card
                                if (isFullyCompleted && module.sets.length <= 1) {
                                    return [(
                                        <div key={module.id} className="bg-green-50/60 border border-green-200 rounded-xl p-4 relative">
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                <FaCheckCircle className="text-[8px]" /> Done
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg">
                                                    <FaCheckCircle />
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-800">{module.name} Exam</h3>
                                            </div>
                                            <div className="w-full flex items-center justify-center gap-1.5 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-medium">
                                                <FaLock className="text-[9px]" /> Completed
                                            </div>
                                        </div>
                                    )];
                                }

                                // Generate one card per set
                                return module.sets.map((setNum, idx) => {
                                    const examLabel = module.sets.length > 1
                                        ? `${module.name} Exam ${idx + 1}`
                                        : `${module.name} Exam`;
                                    const isSetCompleted = completedModules.includes(`${module.id}:${setNum}`) || (module.sets.length === 1 && isFullyCompleted);

                                    return (
                                        <div
                                            key={`${module.id}-${idx}`}
                                            className={`bg-white border rounded-xl p-4 transition-all ${isSetCompleted
                                                ? "border-green-200 bg-green-50/50"
                                                : `border-gray-200 hover:border-gray-300 hover:shadow-md`
                                                }`}
                                        >
                                            {/* Completed badge */}
                                            {isSetCompleted && (
                                                <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium w-fit mb-2 ml-auto">
                                                    <FaCheckCircle className="text-[8px]" /> Done
                                                </div>
                                            )}

                                            {/* Icon + Label */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 ${isSetCompleted ? 'bg-green-100 text-green-600' : `${c.bg} ${c.text}`} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                                                    {isSetCompleted ? <FaCheckCircle /> : module.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-800 leading-tight">{examLabel}</h3>
                                                    <p className="text-gray-400 text-xs">{module.details}</p>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            {!isSetCompleted && (
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                                    <span className="flex items-center gap-1"><FaClock className="text-gray-400" /> {module.duration} min</span>
                                                    <span className="flex items-center gap-1"><FaQuestionCircle className="text-gray-400" /> {module.questions}Q</span>
                                                </div>
                                            )}

                                            {/* Action */}
                                            {isSetCompleted ? (
                                                <div className="w-full flex items-center justify-center gap-1.5 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-medium">
                                                    <FaLock className="text-[9px]" /> Completed
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartModule(module.id, setNum)}
                                                    className={`w-full flex items-center justify-center gap-2 ${c.btn} text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer group`}
                                                >
                                                    <FaPlay className="text-[9px] group-hover:scale-110 transition-transform" />
                                                    Start {module.name}
                                                    <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </>
                )}
            </div>

            <footer className="bg-white border-t border-gray-200 py-3 px-4 mt-auto">
                <div className="max-w-4xl mx-auto text-center text-gray-400 text-xs">
                    © 2024 BAC IELTS ACADEMY • OFFICIAL EXAMINATION PORTAL
                </div>
            </footer>
        </div>
    );
}
