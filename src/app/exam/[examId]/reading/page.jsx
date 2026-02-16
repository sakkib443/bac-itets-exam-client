"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaBook,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaCheck,
    FaTimes,
    FaSpinner,
    FaPlay,
    FaArrowRight
} from "react-icons/fa";
import { questionSetsAPI, studentsAPI } from "@/lib/api";
import ExamSecurity from "@/components/ExamSecurity";
import TextHighlighter from "@/components/TextHighlighter";

export default function ReadingExamPage() {
    const params = useParams();
    const router = useRouter();

    const [currentPassage, setCurrentPassage] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [fontSize, setFontSize] = useState(16);


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

                        // Security check: If reading is already completed OR all 3 are done, redirect back
                        if (dbCompletedModules.includes("reading") || isFinished) {
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
                    if (parsed.completedModules && (parsed.completedModules.includes("reading") || parsed.completedModules.length >= 3)) {
                        router.push(`/exam/${params.examId}`);
                        return;
                    }
                }

                // Check if reading set is assigned
                const readingSetNumber = parsed.assignedSets?.readingSetNumber;
                if (!readingSetNumber) {
                    setLoadError("No reading test assigned for this exam.");
                    setIsLoading(false);
                    return;
                }

                // Fetch question set from backend
                const response = await questionSetsAPI.getForExam("READING", readingSetNumber);
                console.log("Reading API Response:", response);

                if (response.success && response.data) {
                    const data = response.data;
                    console.log("Original Reading Data:", data);

                    // Support both 'sections' and 'passages' format from backend
                    const sectionsData = data.sections || data.passages || (Array.isArray(data) ? data : []);
                    console.log("Sections to process:", sectionsData);

                    // Remove auto-numbering to trust DB provided numbers
                    // Normalize data structure for frontend
                    data.sections = sectionsData;
                    console.log("Final Processed Data:", data);
                    setQuestionSet(data);
                } else {
                    setLoadError("Failed to load reading test questions.");
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

    // Build passages from question set sections
    const passages = (questionSet?.sections || questionSet?.passages || []).map((section, index) => {
        // Create a map to store unique questions by their number
        const questionMap = new Map();

        // Calculate the question range for this section based on its groups to avoid duplicates from other sections
        const sectionRange = (section.questionGroups || []).reduce((acc, g) => ({
            min: Math.min(acc.min, g.startQuestion || Infinity),
            max: Math.max(acc.max, g.endQuestion || -Infinity)
        }), { min: Infinity, max: -Infinity });

        // 1. Collect direct questions (these usually have correct answers and metadata)
        if (section.questions) {
            section.questions.forEach(q => {
                const isInRange = sectionRange.min <= sectionRange.max ?
                    (q.questionNumber >= sectionRange.min && q.questionNumber <= sectionRange.max) :
                    true;

                if (isInRange) {
                    questionMap.set(q.questionNumber, {
                        id: q.questionNumber,
                        questionNumber: q.questionNumber,
                        type: q.questionType,
                        text: q.questionText,
                        options: q.options || [],
                        marks: q.marks || 1,
                        correctAnswer: q.correctAnswer
                    });
                }
            });
        }

        // 2. Questions inside questionGroups (these are used for display)
        if (section.questionGroups) {
            section.questionGroups.forEach(group => {
                const qType = group.questionType || group.groupType;

                const processItem = (item) => {
                    if (item && item.questionNumber) {
                        const existing = questionMap.get(item.questionNumber) || {};
                        questionMap.set(item.questionNumber, {
                            ...existing,
                            id: item.questionNumber,
                            questionNumber: item.questionNumber,
                            type: existing.type || qType,
                            text: existing.text || item.text || item.questionText || "",
                            options: existing.options?.length ? existing.options : (item.options || []),
                            marks: existing.marks || item.marks || 1
                        });
                    }
                };

                group.questions?.forEach(processItem);
                group.mcQuestions?.forEach(processItem);
                group.statements?.forEach(processItem);
                group.matchingItems?.forEach(processItem);

                group.notesSections?.forEach(s => {
                    s.bullets?.forEach(b => {
                        if (b.questionNumber) processItem(b);
                    });
                });

                group.summarySegments?.forEach(s => {
                    if (s.questionNumber) {
                        const existing = questionMap.get(s.questionNumber) || {};
                        questionMap.set(s.questionNumber, {
                            ...existing,
                            id: s.questionNumber,
                            questionNumber: s.questionNumber,
                            type: existing.type || qType,
                            text: existing.text || `Blank ${s.questionNumber}`,
                            marks: existing.marks || 1
                        });
                    }
                });

                if (group.questionSets) {
                    group.questionSets.forEach(qs => {
                        qs.questionNumbers?.forEach(num => {
                            const existing = questionMap.get(num) || {};
                            questionMap.set(num, {
                                ...existing,
                                id: num,
                                questionNumber: num,
                                type: existing.type || qType,
                                text: existing.text || `Multiple Question ${num}`,
                                marks: 1
                            });
                        });
                    });
                }
            });
        }

        // Convert Map back to array and sort
        const allSectionQuestions = Array.from(questionMap.values()).sort((a, b) => a.questionNumber - b.questionNumber);

        return {
            id: section.sectionNumber || index + 1,
            title: section.title || `Passage ${index + 1}`,
            source: section.source || "",
            content: section.content || section.passage || "",
            questionGroups: section.questionGroups || [],
            questions: allSectionQuestions
        };
    });

    const currentPass = passages[currentPassage] || { questions: [], content: "" };
    const allQuestions = passages.flatMap(p => p.questions);

    // Show all questions for the current passage (usually 13-14)
    const currentQuestions = currentPass.questions || [];

    const totalQuestions = allQuestions.length;
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // Official IELTS Academic Reading Band Score Conversion
    const getBandScore = (rawScore) => {
        if (rawScore >= 39) return 9.0;
        if (rawScore >= 37) return 8.5;
        if (rawScore >= 35) return 8.0;
        if (rawScore >= 33) return 7.5;
        if (rawScore >= 30) return 7.0;
        if (rawScore >= 27) return 6.5;
        if (rawScore >= 23) return 6.0;
        if (rawScore >= 19) return 5.5;
        if (rawScore >= 15) return 5.0;
        if (rawScore >= 13) return 4.5;
        if (rawScore >= 10) return 4.0;
        if (rawScore >= 8) return 3.5;
        if (rawScore >= 6) return 3.0;
        if (rawScore >= 4) return 2.5;
        return 2.0;
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




    const handleAnswer = (qId, value) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    const goNext = () => {
        if (currentPassage < passages.length - 1) {
            setCurrentPassage((prev) => prev + 1);
            setCurrentQuestion(0);
        } else {
            setShowSubmitModal(true);
        }
    };

    const goPrev = () => {
        if (currentPassage > 0) {
            setCurrentPassage((prev) => prev - 1);
            setCurrentQuestion(0);
        }
    };

    const calculateScore = () => {
        let score = 0;
        allQuestions.forEach(q => {
            const userAnswer = answers[q.questionNumber];
            if (userAnswer) {
                const normalizedUser = userAnswer.toString().trim().toLowerCase();
                const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                if (normalizedUser === normalizedCorrect) {
                    score += q.marks || 1;
                }
            }
        });
        return score;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const score = calculateScore();
        const bandScore = getBandScore(score);

        // Prepare detailed answers for admin review
        const detailedAnswers = allQuestions.map(q => {
            const userAnswer = answers[q.questionNumber] || "";

            // For MCQ/TFNG/matching, extract the letter or answer from selected option
            let studentAnswerForComparison = userAnswer.toString().trim();
            const qType = q.type || q.questionType || "";

            if ((qType === "multiple-choice" || qType === "mcq" || qType === "matching") && userAnswer) {
                // Extract the first letter if it's like "A. Some text" or "B. Some text"
                const letterMatch = userAnswer.toString().match(/^([A-Za-z])\./);
                if (letterMatch) {
                    studentAnswerForComparison = letterMatch[1].toUpperCase();
                }
            }

            return {
                questionNumber: q.questionNumber,
                questionText: q.text || q.questionText || "", // Include question text
                questionType: qType || "fill-in-blank",
                studentAnswer: studentAnswerForComparison, // Store extracted answer
                studentAnswerFull: userAnswer, // Store full answer text for reference
                correctAnswer: q.correctAnswer,
                isCorrect: false // Will be recalculated on backend
            };
        });

        // Get session data from localStorage or state
        const storedSession = localStorage.getItem("examSession");
        let sessionData = storedSession ? JSON.parse(storedSession) : session;
        const examId = sessionData?.examId || session?.examId;

        // Save to backend
        try {
            const response = await studentsAPI.saveModuleScore(examId, "reading", {
                score: score,
                total: totalMarks,
                band: bandScore,
                answers: detailedAnswers // Send answers to backend
            });
            console.log("Reading data saved with answers");

            // Update localStorage
            if (response.success && sessionData) {
                sessionData.completedModules = response.data?.completedModules || [...(sessionData.completedModules || []), "reading"];
                sessionData.scores = response.data?.scores || {
                    ...(sessionData.scores || {}),
                    reading: { band: bandScore, raw: score, correctAnswers: score, totalQuestions: totalMarks }
                };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error("Failed to save reading score:", error);
            // Still update localStorage even if backend fails
            if (sessionData) {
                sessionData.completedModules = [...(sessionData.completedModules || []), "reading"];
                sessionData.scores = {
                    ...(sessionData.scores || {}),
                    reading: { band: bandScore, raw: score, correctAnswers: score, totalQuestions: totalMarks }
                };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        }

        // Go back to exam selection page
        router.push(`/exam/${params.examId}`);
    };

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== "").length;

    // Get question type label
    const getQuestionTypeLabel = (type) => {
        switch (type) {
            case "true-false-not-given":
            case "tfng":
                return "True/False/Not Given";
            case "yes-no-not-given":
                return "Yes/No/Not Given";
            case "multiple-choice":
            case "mcq":
                return "Multiple Choice";
            case "fill-in-blank":
            case "fill":
            case "sentence-completion":
            case "summary-completion":
                return "Sentence Completion";
            case "matching":
                return "Matching";
            default:
                return type;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reading test...</p>
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
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
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
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-600">
                        <span className="text-blue-600 font-bold text-2xl">IELTS</span>
                        <span className="text-gray-600">| Reading Test</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Reading Test Instructions</h1>

                    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                            <strong>Set:</strong> {questionSet?.title || `Reading Set #${questionSet?.setNumber}`}
                        </p>
                        <p className="text-gray-700 mb-3">
                            <strong>Time:</strong> {questionSet?.duration || 60} minutes
                        </p>
                        <p className="text-gray-700 mb-3">
                            <strong>Questions:</strong> {totalQuestions} questions in {passages.length} passages
                        </p>
                        <p className="text-gray-700">
                            <strong>Instructions:</strong> Read the passages and answer the questions.
                            You can move between questions and passages freely.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                        <h3 className="font-semibold text-blue-800 mb-2">Question Types:</h3>
                        <ul className="text-blue-700 text-sm space-y-1">
                            <li>• True/False/Not Given</li>
                            <li>• Multiple Choice</li>
                            <li>• Sentence Completion</li>
                            <li>• Matching</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setShowInstructions(false)}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
                    >
                        <FaPlay className="text-sm transition-transform group-hover:scale-110" />
                        <span>Start Reading Test</span>
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
                <div className="w-full px-6 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-blue-600 font-bold text-xl">IELTS</span>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaBook className="text-blue-600" />
                                <span>Reading Test - Set #{questionSet?.setNumber}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                {passages.map((p, idx) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setCurrentPassage(idx); setCurrentQuestion(0); }}
                                        className={`px-3 py-1 rounded text-sm font-medium cursor-pointer ${currentPassage === idx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        P{idx + 1}
                                    </button>
                                ))}
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-1 rounded ${timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"}`}>
                                <FaClock />
                                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="w-full px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Passage Panel */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                            <h3 className="font-semibold text-gray-800">{currentPass.title}</h3>
                            {currentPass.source && (
                                <p className="text-xs text-gray-500">{currentPass.source}</p>
                            )}
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]" style={{ fontSize: `${fontSize}px` }}>
                            <TextHighlighter passageId={`reading_passage_${currentPassage}`}>
                                {currentPass.content.split('\n\n').map((para, index) => (
                                    <p key={index} className="text-gray-700 leading-relaxed mb-4">{para}</p>
                                ))}
                            </TextHighlighter>
                        </div>
                    </div>

                    {/* Question Panel */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded px-4 py-3">
                            <h3 className="font-semibold text-gray-800">Questions {passages.slice(0, currentPassage).reduce((acc, p) => acc + p.questions.length, 0) + 1}–{passages.slice(0, currentPassage + 1).reduce((acc, p) => acc + p.questions.length, 0)}</h3>
                        </div>

                        {/* Question */}
                        {/* Questions List - Using questionGroups if available */}
                        <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                            <TextHighlighter passageId={`reading_questions_${currentPassage}`}>
                                {currentPass.questionGroups && currentPass.questionGroups.length > 0 ? (
                                    // New format using questionGroups
                                    currentPass.questionGroups.map((group, gIdx) => (
                                        <div key={gIdx} className="mb-8">
                                            {/* Note Completion Format (Matches User's Image) */}
                                            {(group.questionType === "note-completion" || group.groupType === "note-completion") && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
                                                    {/* Range and Instructions */}
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                            Questions {group.startQuestion}-{group.endQuestion}
                                                        </h3>
                                                        <p className="text-gray-800 font-medium mb-1">{group.instructions || group.mainInstruction}</p>
                                                        <p className="text-gray-700 text-sm italic">
                                                            Choose <span className="font-bold">ONE WORD ONLY</span> from the passage for each answer.
                                                        </p>
                                                    </div>

                                                    {/* Main Heading from data */}
                                                    {group.mainHeading && (
                                                        <h3 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-100 pb-2">
                                                            {group.mainHeading}
                                                        </h3>
                                                    )}

                                                    {/* Render passage with headings and bullets */}
                                                    {(group.passage || "").split('\n').map((line, lineIdx) => {
                                                        const trimmedLine = line.trim();
                                                        if (!trimmedLine) return <div key={lineIdx} className="h-3" />;

                                                        // Identify Heading (No bullet, no blank, short)
                                                        const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
                                                        const hasBlank = trimmedLine.includes('__________');
                                                        const isHeading = !isBullet && !hasBlank && trimmedLine.length < 100;

                                                        const renderLine = (text) => {
                                                            const parts = text.split(/(\d+\s*__________)/g);
                                                            return parts.map((part, pIdx) => {
                                                                const match = part.match(/(\d+)\s*__________/);
                                                                if (match) {
                                                                    const qNum = parseInt(match[1]);
                                                                    return (
                                                                        <span key={pIdx} id={`q-${qNum}`} className="inline-flex items-center gap-1 mx-1 align-baseline">
                                                                            <span className="bg-white border border-gray-400 text-gray-800 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                                                {qNum}
                                                                            </span>
                                                                            <input
                                                                                type="text"
                                                                                value={answers[qNum] || ""}
                                                                                onChange={(e) => handleAnswer(qNum, e.target.value)}
                                                                                className="border border-gray-300 rounded px-2 py-1 bg-white w-32 h-8 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all shadow-sm"
                                                                            />
                                                                        </span>
                                                                    );
                                                                }
                                                                return <span key={pIdx}>{part}</span>;
                                                            });
                                                        };

                                                        if (isHeading) {
                                                            return (
                                                                <h4 key={lineIdx} className="font-extrabold text-gray-900 text-base mt-5 mb-2 uppercase tracking-wide">
                                                                    {trimmedLine}
                                                                </h4>
                                                            );
                                                        }

                                                        if (isBullet) {
                                                            const bulletText = trimmedLine.replace(/^[•\-]\s*/, '');
                                                            return (
                                                                <div key={lineIdx} className="flex items-start gap-3 ml-6 mb-2">
                                                                    <span className="text-gray-400 mt-1.5 text-xs">•</span>
                                                                    <span className="flex-1 text-gray-700 leading-relaxed font-medium">
                                                                        {renderLine(bulletText)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <p key={lineIdx} className="text-gray-700 leading-relaxed mb-2 ml-2">
                                                                {renderLine(trimmedLine)}
                                                            </p>
                                                        );
                                                    })}

                                                    {/* Original format support for notesSections */}
                                                    {!group.passage && group.notesSections?.map((section, sIdx) => (
                                                        <div key={sIdx} className="mt-3">
                                                            <h4 className="font-bold text-gray-800 mb-2">{section.subHeading}</h4>
                                                            <ul className="space-y-2 pl-4">
                                                                {section.bullets?.map((bullet, bIdx) => (
                                                                    <li key={bIdx} className="flex items-start gap-2 text-gray-700">
                                                                        <span className="mt-0.5">•</span>
                                                                        {bullet.type === "context" ? (
                                                                            <span>{bullet.text}</span>
                                                                        ) : (
                                                                            <div id={`q-${bullet.questionNumber}`} className="flex items-center flex-wrap gap-1">
                                                                                <span>{bullet.textBefore}</span>
                                                                                <span className="inline-flex items-center gap-1">
                                                                                    <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">{bullet.questionNumber}</span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={answers[bullet.questionNumber] || ""}
                                                                                        onChange={(e) => handleAnswer(bullet.questionNumber, e.target.value)}
                                                                                        className="border border-gray-300 rounded px-2 py-1 bg-white w-32 h-8 focus:border-blue-500 outline-none"
                                                                                    />
                                                                                </span>
                                                                                {bullet.textAfter && <span>{bullet.textAfter}</span>}
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* TRUE/FALSE/NOT GIVEN Format (Matches User's Image) */}
                                            {(group.questionType === "true-false-not-given" || group.groupType === "true-false-not-given" || group.questionType === "true-false-ng") && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                            Questions {group.startQuestion}-{group.endQuestion}
                                                        </h3>
                                                        <p className="text-gray-800 font-medium mb-3">{group.instructions || group.mainInstruction}</p>

                                                        <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm border-l-4 border-gray-300">
                                                            <p><span className="font-bold w-24 inline-block">TRUE</span> if the statement agrees with the information</p>
                                                            <p><span className="font-bold w-24 inline-block">FALSE</span> if the statement contradicts the information</p>
                                                            <p><span className="font-bold w-24 inline-block">NOT GIVEN</span> if there is no information on this</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6 mt-6">
                                                        {(group.statements || group.questions)?.map((stmt) => (
                                                            <div key={stmt.questionNumber} id={`q-${stmt.questionNumber}`} className="pb-4 border-b border-gray-100 last:border-0">
                                                                <div className="flex items-start gap-3 mb-4">
                                                                    <span className="bg-gray-100 border border-gray-300 text-gray-800 text-sm font-bold px-2 py-0.5 rounded shadow-sm">
                                                                        {stmt.questionNumber}
                                                                    </span>
                                                                    <p className="text-gray-800 font-medium leading-relaxed">{stmt.text || stmt.questionText}</p>
                                                                </div>

                                                                <div className="flex flex-wrap gap-3 pl-10">
                                                                    {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
                                                                        <label
                                                                            key={opt}
                                                                            className={`flex items-center gap-2 px-5 py-2 border rounded-full cursor-pointer transition-all duration-200 ${answers[stmt.questionNumber] === opt
                                                                                ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-105"
                                                                                : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                                                                                }`}
                                                                            onClick={() => handleAnswer(stmt.questionNumber, opt)}
                                                                        >
                                                                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${answers[stmt.questionNumber] === opt ? "bg-white border-white" : "border-gray-400"}`}>
                                                                                {answers[stmt.questionNumber] === opt && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                                                            </div>
                                                                            <span className="text-xs font-black uppercase tracking-wider">{opt}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* MATCHING INFORMATION Format */}
                                            {group.groupType === "matching-information" && (
                                                <div className="space-y-3">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800">{group.mainInstruction}</p>

                                                    {/* Sub Instruction */}
                                                    <p className="text-gray-800">{group.subInstruction}</p>

                                                    {/* NB Note */}
                                                    {group.note && (
                                                        <p className="text-gray-700 text-sm">
                                                            <span className="font-bold">NB</span> <em>{group.note.replace('NB ', '')}</em>
                                                        </p>
                                                    )}

                                                    {/* Matching Items */}
                                                    <div className="space-y-3 mt-4">
                                                        {group.matchingItems?.map((item) => (
                                                            <div key={item.questionNumber} id={`q-${item.questionNumber}`} className="flex items-center gap-3">
                                                                <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5 flex-shrink-0">
                                                                    {item.questionNumber}
                                                                </span>
                                                                <span className="flex-1 text-gray-800">{item.text}</span>
                                                                <select
                                                                    value={answers[item.questionNumber] || ""}
                                                                    onChange={(e) => handleAnswer(item.questionNumber, e.target.value)}
                                                                    className="border border-gray-300 rounded px-3 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none min-w-[80px]"
                                                                >
                                                                    <option value="">--</option>
                                                                    {group.paragraphOptions?.map((opt) => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* SUMMARY COMPLETION Format */}
                                            {group.groupType === "summary-completion" && (
                                                <div className="space-y-3 mt-6 pt-4 border-t">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800 italic">{group.mainInstruction}</p>

                                                    {/* Sub Instruction */}
                                                    <p className="text-gray-800">
                                                        Choose <span className="font-bold">ONE WORD ONLY</span> from the passage for each answer.
                                                    </p>

                                                    {/* Main Heading */}
                                                    <h3 className="text-lg font-bold text-gray-900 mt-4">{group.mainHeading}</h3>

                                                    {/* Summary Paragraph with inline blanks */}
                                                    <div className="text-gray-700 leading-relaxed">
                                                        {group.summarySegments?.map((segment, sIdx) => (
                                                            segment.type === "text" ? (
                                                                <span key={sIdx}>{segment.content} </span>
                                                            ) : (
                                                                <span key={sIdx} id={`q-${segment.questionNumber}`} className="inline-flex items-center gap-1 mx-1">
                                                                    <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">{segment.questionNumber}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={answers[segment.questionNumber] || ""}
                                                                        onChange={(e) => handleAnswer(segment.questionNumber, e.target.value)}
                                                                        className="border-b border-gray-400 bg-white w-32 px-2 py-1 focus:border-blue-600 focus:outline-none"
                                                                    />
                                                                </span>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* CHOOSE TWO LETTERS Format */}
                                            {group.groupType === "choose-two-letters" && (
                                                <div className="space-y-4 mt-6 pt-4 border-t">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800 italic">{group.mainInstruction}</p>

                                                    {/* Question Sets */}
                                                    {group.questionSets?.map((qSet, qsIdx) => (
                                                        <div key={qsIdx} className="mt-4">
                                                            {/* Question Numbers and Text */}
                                                            <div className="flex items-start gap-2 mb-3">
                                                                <div className="flex gap-1">
                                                                    {qSet.questionNumbers?.map((qNum) => (
                                                                        <span key={qNum} id={`q-${qNum}`} className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">
                                                                            {qNum}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <p className="text-gray-800">
                                                                    {qSet.questionText?.replace('TWO', '')}
                                                                    <span className="font-bold">TWO</span>
                                                                    {qSet.questionText?.split('TWO')[1]}
                                                                </p>
                                                            </div>

                                                            {/* Options with Checkboxes */}
                                                            <div className="space-y-2 ml-6">
                                                                {qSet.options?.map((opt) => {
                                                                    const isSelected = qSet.questionNumbers?.some(qNum => answers[qNum] === opt.letter);
                                                                    return (
                                                                        <label
                                                                            key={opt.letter}
                                                                            onClick={() => {
                                                                                // Find which question number doesn't have this answer yet
                                                                                const firstEmpty = qSet.questionNumbers?.find(qNum => !answers[qNum] || answers[qNum] === opt.letter);
                                                                                if (firstEmpty) {
                                                                                    if (answers[firstEmpty] === opt.letter) {
                                                                                        handleAnswer(firstEmpty, ""); // Deselect
                                                                                    } else {
                                                                                        handleAnswer(firstEmpty, opt.letter);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-2 cursor-pointer"
                                                                        >
                                                                            <span className="font-bold text-gray-700">{opt.letter}</span>
                                                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"}`}>
                                                                                {isSelected && (
                                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-gray-700">{opt.text}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* SUMMARY WITH OPTIONS (Phrase List) Format */}
                                            {group.groupType === "summary-with-options" && (
                                                <div className="space-y-3">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800">{group.mainInstruction}</p>
                                                    <p className="text-gray-800">{group.subInstruction}</p>

                                                    {/* Phrase List - FIRST */}
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
                                                        {group.phraseList?.map((phrase) => (
                                                            <div key={phrase.letter} className="text-gray-700">
                                                                <span className="font-bold">{phrase.letter}</span> {phrase.text}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Main Heading */}
                                                    <h3 className="text-lg font-bold text-gray-900 mt-4">{group.mainHeading}</h3>

                                                    {/* Summary Paragraph with dropdowns */}
                                                    <div className="text-gray-700 leading-relaxed">
                                                        {group.summarySegments?.map((segment, sIdx) => (
                                                            segment.type === "text" ? (
                                                                <span key={sIdx}>{segment.content} </span>
                                                            ) : (
                                                                <span key={sIdx} id={`q-${segment.questionNumber}`} className="inline-flex items-center gap-1 mx-1">
                                                                    <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">{segment.questionNumber}</span>
                                                                    <select
                                                                        value={answers[segment.questionNumber] || ""}
                                                                        onChange={(e) => handleAnswer(segment.questionNumber, e.target.value)}
                                                                        className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:border-blue-500 focus:outline-none"
                                                                    >
                                                                        <option value="">--</option>
                                                                        {group.phraseList?.map((phrase) => (
                                                                            <option key={phrase.letter} value={phrase.letter}>{phrase.letter}</option>
                                                                        ))}
                                                                    </select>
                                                                </span>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* YES/NO/NOT GIVEN Format */}
                                            {group.groupType === "yes-no-not-given" && (
                                                <div className="space-y-3 mt-6 pt-4 border-t">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800">{group.mainInstruction}</p>
                                                    <p className="text-gray-800">{group.subInstruction}</p>

                                                    {/* Options Explanation */}
                                                    <div className="space-y-1 pl-4 text-sm">
                                                        {group.optionsExplanation?.map((opt) => (
                                                            <div key={opt.label} className="text-gray-700">
                                                                <span className="font-bold">{opt.label}</span> {opt.description}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Statements */}
                                                    <div className="space-y-4 mt-3">
                                                        {group.statements?.map((stmt) => (
                                                            <div key={stmt.questionNumber} id={`q-${stmt.questionNumber}`} className="py-2">
                                                                <div className="flex items-start gap-2 mb-2">
                                                                    <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">{stmt.questionNumber}</span>
                                                                    <span className="text-gray-800">{stmt.text}</span>
                                                                </div>
                                                                <div className="ml-8 space-y-1">
                                                                    {["YES", "NO", "NOT GIVEN"].map((opt) => (
                                                                        <label
                                                                            key={opt}
                                                                            onClick={() => handleAnswer(stmt.questionNumber, opt)}
                                                                            className="flex items-center gap-2 cursor-pointer"
                                                                        >
                                                                            <span className="text-gray-500">•</span>
                                                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${answers[stmt.questionNumber] === opt
                                                                                ? "bg-blue-600 border-blue-600"
                                                                                : "border-gray-400"
                                                                                }`}>
                                                                                {answers[stmt.questionNumber] === opt && (
                                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`${answers[stmt.questionNumber] === opt ? "font-bold text-blue-600" : "text-gray-700"}`}>{opt}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* MULTIPLE CHOICE FULL Format */}
                                            {group.groupType === "multiple-choice-full" && (
                                                <div className="space-y-3 mt-6 pt-4 border-t">
                                                    {/* Main Instruction */}
                                                    <p className="text-gray-800 italic">{group.mainInstruction}</p>
                                                    <p className="text-gray-800">{group.subInstruction}</p>

                                                    {/* Questions */}
                                                    <div className="space-y-6 mt-4">
                                                        {group.mcQuestions?.map((mcQ) => (
                                                            <div key={mcQ.questionNumber} id={`q-${mcQ.questionNumber}`} className="py-2">
                                                                <div className="flex items-start gap-2 mb-3">
                                                                    <span className="border border-gray-400 text-gray-700 text-sm font-bold px-1.5 py-0.5">{mcQ.questionNumber}</span>
                                                                    <span className="text-gray-800 font-medium">{mcQ.questionText}</span>
                                                                </div>
                                                                <div className="ml-8 space-y-2">
                                                                    {mcQ.options?.map((opt) => (
                                                                        <label
                                                                            key={opt.letter}
                                                                            onClick={() => handleAnswer(mcQ.questionNumber, opt.letter)}
                                                                            className="flex items-start gap-2 cursor-pointer"
                                                                        >
                                                                            <span className="font-bold text-gray-700 mt-0.5">{opt.letter}</span>
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${answers[mcQ.questionNumber] === opt.letter
                                                                                ? "border-blue-600 bg-blue-600"
                                                                                : "border-gray-400"
                                                                                }`}>
                                                                                {answers[mcQ.questionNumber] === opt.letter && (
                                                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                                )}
                                                                            </div>
                                                                            <span className={`${answers[mcQ.questionNumber] === opt.letter ? "text-blue-600" : "text-gray-700"}`}>
                                                                                {opt.text}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : null}


                            </TextHighlighter>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-4">
                            <button
                                onClick={goPrev}
                                disabled={currentPassage === 0}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${currentPassage === 0
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
                                    }`}
                            >
                                <FaChevronLeft />
                                Previous Passage
                            </button>

                            <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                                <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                    Passage {currentPassage + 1} of {passages.length}
                                </span>
                            </div>

                            <button
                                onClick={goNext}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all shadow-md shadow-blue-200"
                            >
                                {currentPassage === passages.length - 1 ? (
                                    "Finish Test"
                                ) : (
                                    <>Next Passage <FaChevronRight /></>
                                )}
                            </button>
                        </div>

                        {/* Question Navigator */}
                        <div className="bg-white border border-gray-200 rounded p-4">
                            <div className="flex flex-wrap gap-1 mb-3">
                                {currentPass.questions.map((q, idx) => {
                                    const isAnswered = answers[q.questionNumber] && answers[q.questionNumber] !== "";
                                    const scrollToIndex = () => {
                                        const element = document.getElementById(`q-${q.questionNumber}`);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    };

                                    return (
                                        <button
                                            key={q.questionNumber}
                                            onClick={scrollToIndex}
                                            className={`w-8 h-8 rounded text-sm font-medium cursor-pointer transition-all ${isAnswered
                                                ? "bg-green-600 text-white border border-green-700 shadow-md"
                                                : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 border border-gray-200 shadow-sm"
                                                }`}
                                        >
                                            {passages.slice(0, currentPassage).reduce((acc, p) => acc + p.questions.length, 0) + idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-gray-500 text-sm">
                                Answered: {answeredCount}/{totalQuestions}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Submit Reading Test?</h3>
                            <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Answered</span>
                                <span className="font-semibold text-blue-600">{answeredCount} / {totalQuestions}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}></div>
                            </div>
                        </div>

                        {totalQuestions - answeredCount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                                <p className="text-amber-700 text-sm">{totalQuestions - answeredCount} questions unanswered!</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                            >
                                Review
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer disabled:opacity-70"
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
