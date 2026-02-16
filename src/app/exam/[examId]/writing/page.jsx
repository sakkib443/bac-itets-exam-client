"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaPen,
    FaClock,
    FaCheck,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaPlay,
    FaArrowRight
} from "react-icons/fa";
import { questionSetsAPI, studentsAPI } from "@/lib/api";
import ExamSecurity from "@/components/ExamSecurity";
import TextHighlighter from "@/components/TextHighlighter";

export default function WritingExamPage() {
    const params = useParams();
    const router = useRouter();

    const [currentTask, setCurrentTask] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);


    // Data loading states
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [questionSet, setQuestionSet] = useState(null);
    const [session, setSession] = useState(null);

    // Load session and question set
    useEffect(() => {
        const loadData = async () => {
            try {
                // Get session from localStorage
                const storedSession = localStorage.getItem("examSession");
                if (!storedSession) {
                    setLoadError("No exam session found. Please start from the home page.");
                    setIsLoading(false);
                    return;
                }

                const parsed = JSON.parse(storedSession);
                setSession(parsed);

                // IMPORTANT: Fetch fresh completion status from DATABASE
                try {
                    const verifyResponse = await studentsAPI.verifyExamId(parsed.examId);
                    if (verifyResponse.success && verifyResponse.data) {
                        const dbCompletedModules = verifyResponse.data.completedModules || [];
                        const isFinished = dbCompletedModules.length >= 3;

                        // Security check: If writing is already completed OR all 3 are done, redirect back
                        if (dbCompletedModules.includes("writing") || isFinished) {
                            // Update localStorage to keep in sync
                            parsed.completedModules = dbCompletedModules;
                            localStorage.setItem("examSession", JSON.stringify(parsed));

                            router.push(`/exam/${params.examId}`);
                            return;
                        }
                    }
                } catch (apiError) {
                    console.error("Failed to verify completion from DB, using localStorage:", apiError);
                    // Fallback to localStorage check
                    if (parsed.completedModules && (parsed.completedModules.includes("writing") || parsed.completedModules.length >= 3)) {
                        router.push(`/exam/${params.examId}`);
                        return;
                    }
                }

                // Check if writing set is assigned
                const writingSetNumber = parsed.assignedSets?.writingSetNumber;
                if (!writingSetNumber) {
                    setLoadError("No writing test assigned for this exam.");
                    setIsLoading(false);
                    return;
                }

                // Fetch question set from backend
                const response = await questionSetsAPI.getForExam("WRITING", writingSetNumber);

                if (response.success && response.data) {
                    setQuestionSet(response.data);
                    // Initialize answers for each task
                    const initialAnswers = {};
                    (response.data.writingTasks || []).forEach((task, index) => {
                        initialAnswers[`task${index + 1}`] = "";
                    });
                    setAnswers(initialAnswers);
                } else {
                    setLoadError("Failed to load writing test questions.");
                }
            } catch (err) {
                console.error("Load error:", err);
                setLoadError(err.message || "Failed to load exam data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [params.examId]);

    // Build tasks from question set
    const tasks = (questionSet?.writingTasks || []).map((task, index) => {
        // Determine if this is Task 1 (can be task1-academic, task1-gt, or taskNumber===1)
        const isTask1 = task.taskNumber === 1 || task.taskType?.startsWith("task1");

        return {
            id: `task${index + 1}`,
            taskNumber: task.taskNumber || index + 1,
            title: `Task ${task.taskNumber || index + 1}`,
            subtitle: isTask1 ? "Academic Report" : "Essay",
            timeRecommend: isTask1 ? 20 : 40, // Task 1 = 20 mins, Task 2 = 40 mins
            instruction: task.prompt || "",
            imageUrl: task.imageUrl || null,
            minWords: task.minWords || (isTask1 ? 150 : 250)
        };
    });

    // Fallback if no tasks from backend
    const displayTasks = tasks.length > 0 ? tasks : [
        { id: "task1", title: "Task 1", subtitle: "Academic Report", timeRecommend: 20, instruction: "Loading...", minWords: 150 },
        { id: "task2", title: "Task 2", subtitle: "Essay", timeRecommend: 40, instruction: "Loading...", minWords: 250 }
    ];

    const currentTaskData = displayTasks[currentTask] || displayTasks[0];
    const currentAnswer = answers[currentTaskData?.id] || "";
    const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

    const getWritingBandScore = (task1Words, task2Words) => {
        let task1Score = 0;
        let task2Score = 0;

        if (task1Words >= 150) task1Score = 6.5;
        else if (task1Words >= 120) task1Score = 5.5;
        else if (task1Words >= 80) task1Score = 4.5;
        else if (task1Words >= 40) task1Score = 3.5;
        else task1Score = 2.5;

        if (task2Words >= 250) task2Score = 6.5;
        else if (task2Words >= 200) task2Score = 5.5;
        else if (task2Words >= 150) task2Score = 4.5;
        else if (task2Words >= 80) task2Score = 3.5;
        else task2Score = 2.5;

        const overallBand = (task1Score + task2Score * 2) / 3;
        return Math.round(overallBand * 2) / 2;
    };

    // Timer
    useEffect(() => {
        if (showInstructions || isLoading) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [showInstructions, isLoading]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };


    const handleTextChange = (value) => {
        setAnswers((prev) => ({ ...prev, [currentTaskData.id]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const task1Words = answers.task1?.trim().split(/\s+/).filter(Boolean).length || 0;
        const task2Words = answers.task2?.trim().split(/\s+/).filter(Boolean).length || 0;

        const bandScore = getWritingBandScore(task1Words, task2Words);
        const totalScore = Math.round(bandScore * 2);

        // Get exam ID from session
        const storedSession = localStorage.getItem("examSession");
        const sessionData = storedSession ? JSON.parse(storedSession) : null;
        const examId = sessionData?.examId;

        // Save to backend with task responses
        try {
            console.log("Saving writing with data:", {
                examId,
                module: "writing",
                scoreData: {
                    band: bandScore,
                    task1Words: task1Words,
                    task2Words: task2Words,
                    answers: {
                        task1: answers.task1,
                        task2: answers.task2
                    }
                }
            });

            const response = await studentsAPI.saveModuleScore(examId, "writing", {
                band: bandScore,
                task1Words: task1Words,
                task2Words: task2Words,
                answers: {
                    task1: answers.task1,
                    task2: answers.task2
                }
            });

            console.log("Writing save response:", response);

            // Update localStorage
            if (response.success && sessionData) {
                sessionData.completedModules = response.data?.completedModules || [...(sessionData.completedModules || []), "writing"];
                sessionData.scores = response.data?.scores || {
                    ...(sessionData.scores || {}),
                    writing: { overallBand: bandScore, task1Band: bandScore, task2Band: bandScore }
                };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error("Failed to save writing score:", error);
            // Still update localStorage even if backend fails
            if (sessionData) {
                sessionData.completedModules = [...(sessionData.completedModules || []), "writing"];
                sessionData.scores = {
                    ...(sessionData.scores || {}),
                    writing: { overallBand: bandScore, task1Band: bandScore, task2Band: bandScore }
                };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        }

        // Go back to exam selection page
        router.push(`/exam/${params.examId}`);
    };

    const meetsMinWords = wordCount >= (currentTaskData?.minWords || 150);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading writing test...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTimes className="text-2xl text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Cannot Load Test</h2>
                    <p className="text-gray-600 mb-4">{loadError}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // Instructions Screen
    if (showInstructions) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-600">
                        <span className="text-green-600 font-bold text-2xl">IELTS</span>
                        <span className="text-gray-600">| Writing Test</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Writing Test Instructions</h1>

                    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                            <strong>Set:</strong> {questionSet?.title || `Writing Set #${questionSet?.setNumber}`}
                        </p>
                        <p className="text-gray-700 mb-3">
                            <strong>Time:</strong> {questionSet?.duration || 60} minutes (for both tasks)
                        </p>
                        <p className="text-gray-700 mb-3">
                            <strong>Tasks:</strong> {displayTasks.length} writing tasks
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {displayTasks.map((task, index) => (
                            <div key={task.id} className="bg-green-50 border border-green-200 rounded p-4">
                                <h4 className="font-semibold text-green-800">{task.title}</h4>
                                <p className="text-green-700 text-sm">{task.subtitle}</p>
                                <p className="text-green-600 text-sm mt-2">Min. {task.minWords} words • {task.timeRecommend} mins</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
                        <h3 className="font-semibold text-amber-800 mb-2">Important Notes:</h3>
                        <ul className="text-amber-700 text-sm space-y-1">
                            <li>• Task 2 contributes <strong>twice as much</strong> as Task 1 to your score</li>
                            <li>• Writing below the minimum word count will lose marks</li>
                            <li>• Write in complete sentences and paragraphs</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setShowInstructions(false)}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
                    >
                        <FaPlay className="text-sm transition-transform group-hover:scale-110" />
                        <span>Start Writing Test</span>
                        <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">

            {/* Exam Security - Tab Switch & Fullscreen Detection */}
            {!showInstructions && (
                <ExamSecurity
                    examId={session?.examId}
                    onViolationLimit={() => {
                        handleSubmit();
                    }}
                />
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-green-600 font-bold text-xl">IELTS</span>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaPen className="text-green-600" />
                                <span>Writing Test - {currentTaskData?.title} (Set #{questionSet?.setNumber})</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded ${timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"}`}>
                                <FaClock />
                                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                            </div>

                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="bg-green-600 text-white px-4 py-1.5 rounded font-medium hover:bg-green-700 cursor-pointer"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Task Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="max-w-7xl mx-auto flex gap-4">
                    {displayTasks.map((task, index) => {
                        const taskWordCount = answers[task.id]?.trim().split(/\s+/).filter(Boolean).length || 0;
                        const taskMeetsMin = taskWordCount >= task.minWords;

                        return (
                            <button
                                key={task.id}
                                onClick={() => setCurrentTask(index)}
                                className={`flex-1 p-4 rounded border-2 cursor-pointer transition-colors ${currentTask === index
                                    ? "border-green-600 bg-white"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-800">{task.title}</span>
                                    {answers[task.id] && (
                                        <span className={`text-sm ${taskMeetsMin ? "text-green-600" : "text-amber-600"}`}>
                                            {taskWordCount} words
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm text-left">{task.subtitle}</p>
                                <p className="text-gray-400 text-xs text-left mt-1">
                                    Min. {task.minWords} words • {task.timeRecommend} mins
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Instructions Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded p-5">
                            <TextHighlighter passageId={`writing_task_${currentTask}`}>
                                <div className="mb-4">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium">
                                        {currentTaskData?.title}
                                    </span>
                                </div>

                                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-4">
                                    {currentTaskData?.instruction}
                                </div>

                                {currentTaskData?.imageUrl && (
                                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-gray-600 text-sm font-medium">📊 Reference Image:</p>
                                            <button
                                                onClick={() => window.open(currentTaskData.imageUrl, '_blank')}
                                                className="text-xs text-green-600 hover:underline cursor-pointer"
                                            >
                                                View Full Size ↗
                                            </button>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-gray-100">
                                            <img
                                                src={currentTaskData.imageUrl}
                                                alt="Task reference - Map/Graph/Chart"
                                                className="w-full rounded cursor-zoom-in hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                onClick={() => window.open(currentTaskData.imageUrl, '_blank')}
                                            />
                                        </div>
                                        <p className="text-gray-400 text-xs mt-2 text-center">
                                            Click image to view in full size
                                        </p>
                                    </div>
                                )}
                            </TextHighlighter>
                        </div>
                    </div>

                    {/* Writing Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-gray-200 rounded overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                            {/* Writing Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <span className="text-gray-700 font-medium">Your Response</span>
                                <div className="flex items-center gap-2">
                                    <span className={`flex items-center gap-1 text-sm ${meetsMinWords ? "text-green-600" : "text-amber-600"}`}>
                                        {meetsMinWords && <FaCheck className="text-xs" />}
                                        {wordCount} / {currentTaskData?.minWords || 150} words
                                    </span>
                                </div>
                            </div>

                            {/* Word count progress bar */}
                            <div className="h-1 bg-gray-100">
                                <div
                                    className={`h-full ${meetsMinWords ? "bg-green-500" : "bg-amber-500"}`}
                                    style={{ width: `${Math.min((wordCount / (currentTaskData?.minWords || 150)) * 100, 100)}%` }}
                                ></div>
                            </div>

                            {/* Text Area */}
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleTextChange(e.target.value)}
                                placeholder={`Start writing your ${currentTaskData?.subtitle?.toLowerCase() || "response"} here...`}
                                className="flex-1 p-5 resize-none focus:outline-none text-gray-800 leading-relaxed"
                                style={{ fontFamily: 'Georgia, serif', fontSize: '17px', lineHeight: '1.8' }}
                            />
                        </div>

                        {/* Task Navigation */}
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setCurrentTask(0)}
                                disabled={currentTask === 0}
                                className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer ${currentTask === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <FaChevronLeft />
                                Task 1
                            </button>

                            {currentTask === 0 ? (
                                <button
                                    onClick={() => setCurrentTask(1)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 cursor-pointer"
                                >
                                    Continue to Task 2
                                    <FaChevronRight />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 cursor-pointer"
                                >
                                    Submit Writing Test
                                    <FaCheck />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Submit Writing Test?</h3>
                            <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-3 mb-4">
                            {displayTasks.map((task) => {
                                const taskWordCount = answers[task.id]?.trim().split(/\s+/).filter(Boolean).length || 0;
                                const taskMeetsMin = taskWordCount >= task.minWords;

                                return (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                            <span className="font-medium text-gray-800">{task.title}</span>
                                            <p className="text-gray-500 text-sm">{task.subtitle}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`${taskMeetsMin ? "text-green-600" : "text-amber-600"}`}>
                                                {taskWordCount} words
                                            </span>
                                            <p className="text-gray-400 text-xs">min. {task.minWords}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                            >
                                Continue Writing
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
