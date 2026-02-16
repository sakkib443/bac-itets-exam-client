"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaUser,
    FaArrowLeft,
    FaEye,
    FaEdit,
    FaTimes,
    FaSpinner,
    FaSave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaCheckCircle,
    FaExclamationTriangle,
    FaGlobe,
    FaClipboardCheck,
    FaUnlock,
    FaLock,
    FaStar,
    FaAward,
    FaRedo,
    FaVideo
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

// ==================== COMPONENTS ====================

// Band Score Display Component
const BandScoreCircle = ({ score, size = "normal", label }) => {
    const sizeClasses = {
        small: "w-14 h-14 text-xl",
        normal: "w-20 h-20 text-3xl",
        large: "w-28 h-28 text-5xl"
    };

    const getBandColor = (band) => {
        if (band >= 8) return "from-emerald-500 to-teal-600";
        if (band >= 7) return "from-blue-500 to-indigo-600";
        if (band >= 6) return "from-cyan-500 to-blue-600";
        if (band >= 5) return "from-amber-500 to-orange-600";
        return "from-slate-400 to-slate-500";
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getBandColor(score)} flex items-center justify-center text-white font-black shadow-lg`}>
                {score || "-"}
            </div>
            {label && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>}
        </div>
    );
};

// Module Score Card Component
const ModuleScoreCard = ({
    icon: Icon,
    title,
    band,
    subInfo,
    color,
    isCompleted,
    onView,
    onEdit,
    onReset,
    resetting
}) => {
    const colorClasses = {
        blue: "bg-blue-50 border-blue-100 hover:border-blue-200",
        green: "bg-emerald-50 border-emerald-100 hover:border-emerald-200",
        purple: "bg-violet-50 border-violet-100 hover:border-violet-200",
        orange: "bg-orange-50 border-orange-100 hover:border-orange-200",
    };

    const iconColorClasses = {
        blue: "bg-blue-500 text-white",
        green: "bg-emerald-500 text-white",
        purple: "bg-violet-500 text-white",
        orange: "bg-orange-500 text-white",
    };

    return (
        <div className={`relative p-6 rounded-2xl border-2 ${colorClasses[color]} transition-all duration-300 hover:shadow-lg group`}>
            {/* Completion Badge */}
            {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <FaCheckCircle className="text-white text-xs" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl ${iconColorClasses[color]} flex items-center justify-center shadow-md`}>
                    <Icon className="text-xl" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subInfo}</p>
                </div>
                <BandScoreCircle score={band} size="small" />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onView}
                    className="flex-1 h-10 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                    <FaEye className="text-slate-400" /> View
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 h-10 flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 shadow-md hover:shadow-lg transition-all"
                >
                    <FaEdit /> Edit
                </button>
                {isCompleted && (
                    <button
                        onClick={onReset}
                        disabled={resetting}
                        className="h-10 px-3 flex items-center justify-center gap-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 shadow-md transition-all disabled:opacity-50"
                        title="Reset this module - Student can retake"
                    >
                        {resetting ? <FaSpinner className="animate-spin" /> : <FaRedo />}
                    </button>
                )}
            </div>
        </div>
    );
};

// View Answers Modal Component
const ViewAnswersModal = ({ show, onClose, module, answers, loading, scores }) => {
    if (!show) return null;

    // Calculate stats and unique answers for Listening/Reading
    const getProcessedAnswers = () => {
        if (!answers || !Array.isArray(answers)) return { processed: [], stats: { correct: 0, incorrect: 0, total: 0 } };

        // Filter out any duplicates and ensure consistency
        const uniqueMap = new Map();
        answers.forEach(ans => {
            if (ans && ans.questionNumber && !uniqueMap.has(ans.questionNumber)) {
                uniqueMap.set(ans.questionNumber, ans);
            }
        });

        const processed = Array.from(uniqueMap.values()).sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
        const correct = processed.filter(a => a.isCorrect).length;
        const incorrect = processed.filter(a => !a.isCorrect).length;

        return { processed, stats: { correct, incorrect, total: processed.length } };
    };

    const { processed: processedAnswers, stats } = getProcessedAnswers();

    // Count words for writing
    const countWords = (text) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${module?.toLowerCase() === 'listening' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                    module?.toLowerCase() === 'reading' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                        module?.toLowerCase() === 'speaking' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                            'bg-gradient-to-r from-violet-500 to-purple-600'
                    } text-white`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                            {module?.toLowerCase() === 'listening' ? <FaHeadphones className="text-2xl" /> :
                                module?.toLowerCase() === 'reading' ? <FaBook className="text-2xl" /> :
                                    module?.toLowerCase() === 'speaking' ? <FaMicrophone className="text-2xl" /> :
                                        <FaPen className="text-2xl" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">{module} - Student Answers</h3>
                            <p className="text-white/80 text-sm">
                                {module?.toLowerCase() === 'writing' ? 'Essay Submissions' :
                                    module?.toLowerCase() === 'speaking' ? 'Speaking Test Questions' :
                                        'Question-wise Answer Review'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Stats Bar for Listening/Reading */}
                {module?.toLowerCase() !== 'writing' && module?.toLowerCase() !== 'speaking' && !loading && answers?.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                                {stats.correct}
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500 uppercase font-semibold">Correct</span>
                                <span className="text-emerald-600 font-bold text-sm">✓ Answers</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                                {stats.incorrect}
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500 uppercase font-semibold">Incorrect</span>
                                <span className="text-rose-600 font-bold text-sm">✗ Answers</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold">
                                {stats.total}
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500 uppercase font-semibold">Total</span>
                                <span className="text-slate-700 font-bold text-sm">Questions</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-16 text-center">
                            <FaSpinner className="animate-spin text-slate-400 text-3xl mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Loading answers...</p>
                        </div>
                    ) : module?.toLowerCase() === 'speaking' ? (
                        /* Speaking Module - Show Speaking Questions */
                        <div className="space-y-6">
                            {/* Recordings Section */}
                            {answers?.recordings && answers.recordings.length > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                    <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <FaVideo className="text-orange-500" />
                                        Recorded Video Responses
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {answers.recordings.map((rec, idx) => (
                                            <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                                    <p className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">{rec.questionLabel || `Recording ${idx + 1}`}</p>
                                                    <p className="text-sm text-slate-800 font-medium line-clamp-1">{rec.questionText}</p>
                                                </div>
                                                <div className="aspect-video bg-black flex items-center justify-center">
                                                    <video
                                                        src={rec.videoUrl}
                                                        controls
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                {rec.duration && (
                                                    <div className="p-2 text-right">
                                                        <span className="text-[10px] font-bold text-slate-400">Duration: {Math.round(rec.duration)}s</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Part 1 */}
                            {answers?.part1 && (
                                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                                    <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm">1</span>
                                        Part 1 — Introduction & Interview
                                    </h4>
                                    {answers.part1.topics?.map((topic, tIdx) => (
                                        <div key={tIdx} className="mb-4">
                                            <p className="font-semibold text-orange-700 mb-2">{topic.topicName || topic.topic}</p>
                                            <ul className="space-y-1">
                                                {topic.questions?.map((q, qIdx) => (
                                                    <li key={qIdx} className="text-slate-700 text-sm pl-4 border-l-2 border-orange-200 py-1">
                                                        {typeof q === 'string' ? q : q.question || q.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Part 2 */}
                            {answers?.part2 && (
                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                                    <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">2</span>
                                        Part 2 — Cue Card
                                    </h4>
                                    <p className="font-semibold text-amber-800 mb-2">{answers.part2.topic}</p>
                                    {answers.part2.cueCard && <p className="text-slate-600 mb-3">{answers.part2.cueCard}</p>}
                                    {answers.part2.bulletPoints && (
                                        <ul className="space-y-1 mb-3">
                                            {answers.part2.bulletPoints.map((bp, idx) => (
                                                <li key={idx} className="text-slate-700 text-sm flex gap-2"><span className="text-amber-500">•</span>{typeof bp === 'string' ? bp : bp.text}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {answers.part2.followUpQuestion && (
                                        <p className="text-slate-600 italic text-sm border-t border-amber-200 pt-2 mt-2">{answers.part2.followUpQuestion}</p>
                                    )}
                                </div>
                            )}
                            {/* Part 3 */}
                            {answers?.part3 && (
                                <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                                    <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">3</span>
                                        Part 3 — Discussion
                                    </h4>
                                    {answers.part3.topic && <p className="font-semibold text-yellow-800 mb-3">{answers.part3.topic}</p>}
                                    <ul className="space-y-2">
                                        {answers.part3.questions?.map((q, idx) => (
                                            <li key={idx} className="text-slate-700 text-sm pl-4 border-l-2 border-yellow-300 py-1">
                                                {typeof q === 'string' ? q : q.question || q.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {!answers?.part1 && !answers?.part2 && !answers?.part3 && (!answers?.recordings || answers.recordings.length === 0) && (
                                <div className="py-16 text-center">
                                    <FaExclamationTriangle className="text-amber-400 text-5xl mx-auto mb-4" />
                                    <h4 className="text-slate-700 font-bold text-lg mb-2">No Answers Found</h4>
                                    <p className="text-slate-500">This student hasn't completed the Speaking module yet.</p>
                                </div>
                            )}
                        </div>
                    ) : module?.toLowerCase() === 'writing' ? (
                        /* Writing Module - Show Task 1 and Task 2 essays with Questions */
                        <div className="space-y-8">
                            {/* Task 1 */}
                            <div className="space-y-4">
                                <div className="bg-violet-50 rounded-2xl p-6 border border-violet-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-violet-200">1</span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg uppercase tracking-tight">Writing Task 1 - Question</h4>
                                            <span className="text-xs text-slate-500 font-medium">Academic/GT Task 1 Prompt</span>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-100 mb-4 prose prose-slate max-w-none">
                                        <div className="font-semibold text-slate-800 mb-3 text-lg leading-relaxed">
                                            {answers?.questions?.task1?.prompt || "Standard Task 1 Prompt"}
                                        </div>
                                        <div className="text-slate-600 text-[15px] italic border-l-4 border-violet-200 pl-4 py-1">
                                            {answers?.questions?.task1?.instructions || "Summarize the information by selecting and reporting the main features..."}
                                        </div>
                                    </div>

                                    {/* Question Images */}
                                    {answers?.questions?.task1?.images?.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {answers?.questions?.task1.images.map((img, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <img
                                                        src={img.url}
                                                        alt={img.description || `Task 1 Image ${idx + 1}`}
                                                        className="w-full h-auto object-contain rounded-lg"
                                                        style={{ maxHeight: '600px' }}
                                                    />
                                                    {img.description && <p className="text-center text-xs text-slate-500 mt-2 font-medium">{img.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Student Answer */}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                                                Student's Response
                                            </h5>
                                            <span className="bg-white px-3 py-1 rounded-full border border-violet-200 text-violet-700 font-bold text-sm shadow-sm">
                                                {countWords(answers?.task1)} words
                                            </span>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border-2 border-slate-100 text-slate-800 whitespace-pre-wrap font-serif leading-relaxed text-[17px] min-h-[200px] shadow-inner">
                                            {answers?.task1 || <span className="text-slate-400 italic">No submission for Task 1</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Task 2 */}
                            <div className="space-y-4">
                                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-200">2</span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg uppercase tracking-tight">Writing Task 2 - Question</h4>
                                            <span className="text-xs text-slate-500 font-medium">Essay Writing Prompt</span>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-100 mb-4 prose prose-slate max-w-none">
                                        <div className="font-semibold text-slate-800 mb-3 text-lg leading-relaxed">
                                            {answers?.questions?.task2?.prompt || "Standard Task 2 Prompt"}
                                        </div>
                                        <div className="text-slate-600 text-[15px] italic border-l-4 border-indigo-200 pl-4 py-1">
                                            {answers?.questions?.task2?.instructions || "Give reasons for your answer and include any relevant examples from your own knowledge or experience..."}
                                        </div>
                                    </div>

                                    {/* Task 2 Images (Rarely used in Task 2 but supported) */}
                                    {answers?.questions?.task2?.images?.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {answers?.questions?.task2.images.map((img, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <img
                                                        src={img.url}
                                                        alt={img.description || `Task 2 Image ${idx + 1}`}
                                                        className="w-full h-auto object-contain rounded-lg"
                                                        style={{ maxHeight: '600px' }}
                                                    />
                                                    {img.description && <p className="text-center text-xs text-slate-500 mt-2 font-medium">{img.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Student Answer */}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                Student's Response
                                            </h5>
                                            <span className="bg-white px-3 py-1 rounded-full border border-indigo-200 text-indigo-700 font-bold text-sm shadow-sm">
                                                {countWords(answers?.task2)} words
                                            </span>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border-2 border-slate-100 text-slate-800 whitespace-pre-wrap font-serif leading-relaxed text-[17px] min-h-[300px] shadow-inner">
                                            {answers?.task2 || <span className="text-slate-400 italic">No submission for Task 2</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Listening/Reading Module - Show Q&A table */
                        <div className="space-y-3">
                            {/* Answer Rows */}
                            {processedAnswers?.length > 0 ? processedAnswers.map((ans, i) => (
                                <div
                                    key={ans.questionNumber || i}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-sm ${ans.isCorrect
                                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                                        : 'bg-rose-50 border-rose-200 hover:border-rose-300'
                                        }`}
                                >
                                    {/* Question Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${ans.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}>
                                            {ans.questionNumber || i + 1}
                                        </span>
                                        <p className="text-slate-700 text-sm flex-1 font-medium">
                                            {ans.questionText || `Question ${ans.questionNumber || i + 1}`}
                                        </p>
                                        <div className="flex-shrink-0">
                                            {ans.isCorrect ? (
                                                <FaCheckCircle className="text-emerald-500 text-xl" />
                                            ) : (
                                                <FaTimes className="text-rose-500 text-xl" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Answers Grid */}
                                    <div className="grid grid-cols-2 gap-3 ml-11">
                                        {/* Student's Answer */}
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Student's Answer</span>
                                            <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${ans.isCorrect
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                }`}>
                                                {ans.studentAnswerFull || ans.studentAnswer || <span className="italic opacity-60">(No answer)</span>}
                                            </div>
                                        </div>

                                        {/* Correct Answer */}
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Correct Answer</span>
                                            <div className="px-3 py-2 rounded-lg font-semibold text-sm bg-white text-slate-700 border border-slate-200">
                                                {ans.correctAnswer || <span className="italic opacity-60">—</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-16 text-center">
                                    <FaExclamationTriangle className="text-amber-400 text-5xl mx-auto mb-4" />
                                    <h4 className="text-slate-700 font-bold text-lg mb-2">No Answers Found</h4>
                                    <p className="text-slate-500">This student hasn't submitted answers for {module} yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 h-11 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Comprehensive Score Edit Modal
const ScoreEditModal = ({ show, onClose, student, onSave, saving, editModule }) => {
    const [scores, setScores] = useState({
        listening: { band: 0, correctAnswers: 0 },
        reading: { band: 0, correctAnswers: 0 },
        writing: { task1Band: 0, task2Band: 0, overallBand: 0 },
        speaking: { band: 0 },
        adminRemarks: ""
    });

    useEffect(() => {
        if (student?.scores) {
            setScores({
                listening: {
                    band: student.scores.listening?.band || 0,
                    correctAnswers: student.scores.listening?.correctAnswers || 0
                },
                reading: {
                    band: student.scores.reading?.band || 0,
                    correctAnswers: student.scores.reading?.correctAnswers || 0
                },
                writing: {
                    task1Band: student.scores.writing?.task1Band || 0,
                    task2Band: student.scores.writing?.task2Band || 0,
                    overallBand: student.scores.writing?.overallBand || 0
                },
                speaking: {
                    band: student.scores.speaking?.band || 0
                },
                adminRemarks: student.adminRemarks || ""
            });
        }
    }, [student]);

    // Calculate overall band
    const calculateOverall = () => {
        // Filter out Speaking if it's 0 or not yet provided, to calculate average of 3 modules
        const bands = [scores.listening.band, scores.reading.band, scores.writing.overallBand].filter(b => b > 0);
        if (bands.length === 0) return 0;
        const sum = bands.reduce((a, b) => a + b, 0);
        return Math.round((sum / bands.length) * 2) / 2;
    };

    const handleSave = () => {
        onSave(scores);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FaAward className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">Edit Exam Scores</h3>
                                <p className="text-white/80 text-sm">{student?.nameEnglish} • {student?.examId}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {/* Overall Band Preview */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                                {editModule ? `Editing ${editModule.charAt(0).toUpperCase() + editModule.slice(1)} Score` : 'Calculated Overall Band'}
                            </span>
                            <p className="text-white/70 text-xs mt-1">
                                {editModule ? 'Only this module score will be updated' : 'Auto-calculated from module scores'}
                            </p>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-4xl shadow-lg shadow-amber-500/30">
                            {calculateOverall() || "-"}
                        </div>
                    </div>

                    {/* Listening Section */}
                    {(!editModule || editModule === 'listening') && (
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                                    <FaHeadphones />
                                </div>
                                <h4 className="font-bold text-slate-800">Listening Score</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Band Score (0-9)</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.listening.band}
                                        onChange={(e) => setScores(prev => ({ ...prev, listening: { ...prev.listening, band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correct Answers (/40)</label>
                                    <input
                                        type="number" min="0" max="40"
                                        value={scores.listening.correctAnswers}
                                        onChange={(e) => setScores(prev => ({ ...prev, listening: { ...prev.listening, correctAnswers: parseInt(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reading Section */}
                    {(!editModule || editModule === 'reading') && (
                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                    <FaBook />
                                </div>
                                <h4 className="font-bold text-slate-800">Reading Score</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Band Score (0-9)</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.reading.band}
                                        onChange={(e) => setScores(prev => ({ ...prev, reading: { ...prev.reading, band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correct Answers (/40)</label>
                                    <input
                                        type="number" min="0" max="40"
                                        value={scores.reading.correctAnswers}
                                        onChange={(e) => setScores(prev => ({ ...prev, reading: { ...prev.reading, correctAnswers: parseInt(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Writing Section */}
                    {(!editModule || editModule === 'writing') && (
                        <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center">
                                    <FaPen />
                                </div>
                                <h4 className="font-bold text-slate-800">Writing Score</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Task 1 Band</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.task1Band}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, task1Band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Task 2 Band</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.task2Band}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, task2Band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Overall Band</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.overallBand}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, overallBand: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-12 px-4 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Speaking Section - Hidden for now */}
                    {false && (!editModule || editModule === 'speaking') && (
                        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                                    <FaMicrophone />
                                </div>
                                <h4 className="font-bold text-slate-800">Speaking Score</h4>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Band Score (0-9)</label>
                                <input
                                    type="number" step="0.5" min="0" max="9"
                                    value={scores.speaking.band}
                                    onChange={(e) => setScores(prev => ({ ...prev, speaking: { ...prev.speaking, band: parseFloat(e.target.value) || 0 } }))}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* Admin Remarks */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Admin Remarks (Optional)</label>
                        <textarea
                            value={scores.adminRemarks}
                            onChange={(e) => setScores(prev => ({ ...prev, adminRemarks: e.target.value }))}
                            placeholder="Add any notes or feedback for internal reference..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:ring-0 outline-none bg-white text-slate-800 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 h-11 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {saving ? "Saving..." : "Save All Scores"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================

function StudentContent() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Modal states
    const [viewModal, setViewModal] = useState({ show: false, module: '', answers: null, loading: false });
    const [editModal, setEditModal] = useState({ show: false });

    // Fetch student data
    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await studentsAPI.getById(params.id);
                console.log("=== Student Data Fetched ===");
                console.log("Full response:", response);
                console.log("Student examAnswers:", response?.data?.examAnswers);
                console.log("Student writing:", response?.data?.examAnswers?.writing);
                if (response.success) setStudent(response.data);
            } catch (error) {
                console.error("Failed to fetch student:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [params.id]);

    // View answers handler
    const handleViewAnswers = async (module) => {
        console.log("=== View Answers Debug ===");
        console.log("Module:", module);
        console.log("Student ID:", params.id);
        console.log("Student examAnswers from state:", student?.examAnswers);

        setViewModal({ show: true, module, answers: null, loading: true });
        try {
            console.log("Calling API: getAnswerSheet for", module);
            const response = await studentsAPI.getAnswerSheet(params.id, module);
            console.log("API Response:", response);
            console.log("Answers from response:", response?.data?.answers);

            if (response.success) {
                setViewModal(prev => ({ ...prev, answers: response.data.answers, loading: false }));
            } else {
                console.error("API returned success: false", response);
                setViewModal(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error("Failed to fetch answers:", error);
            setViewModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Update all scores handler
    const handleSaveAllScores = async (scoresData) => {
        setSaving(true);
        try {
            const response = await studentsAPI.updateAllScores(params.id, scoresData);
            if (response.success) {
                setStudent(response.data);
                setEditModal({ show: false });
                alert("✅ All scores updated successfully!");
            }
        } catch (error) {
            alert("❌ Failed to update scores: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Publish results handler
    const handlePublishResults = async () => {
        const confirmMsg = student.resultsPublished
            ? "Are you sure you want to UNPUBLISH results? Students will no longer see their scores."
            : "Are you sure you want to PUBLISH results? Students will be able to see their final scores.";

        if (!confirm(confirmMsg)) return;

        setPublishing(true);
        try {
            const response = await studentsAPI.publishResults(params.id, !student.resultsPublished);
            if (response.success) {
                setStudent(prev => ({ ...prev, resultsPublished: response.data.resultsPublished }));
                alert(response.data.message);
            }
        } catch (error) {
            alert("❌ Failed to publish results: " + error.message);
        } finally {
            setPublishing(false);
        }
    };

    // Reset module handler
    const [resetting, setResetting] = useState(null); // which module is being reset

    const handleResetModule = async (module) => {
        const confirmMsg = `Are you sure you want to RESET the ${module.toUpperCase()} module?\n\n⚠️ This will:\n- Delete all answers for this module\n- Delete the score for this module\n- Allow the student to retake this module\n\nThis action cannot be undone!`;

        if (!confirm(confirmMsg)) return;

        setResetting(module);
        try {
            const response = await studentsAPI.resetModule(params.id, module);
            if (response.success) {
                setStudent(response.data);
                alert(`✅ ${module} module reset successfully! The student can now retake this module.`);
            }
        } catch (error) {
            alert("❌ Failed to reset module: " + error.message);
        } finally {
            setResetting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading student data...</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <FaExclamationTriangle className="text-5xl text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Student Not Found</h2>
                    <p className="text-slate-500 mb-6">The student you're looking for doesn't exist.</p>
                    <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const completedModules = student.completedModules || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 lg:p-8">
            {/* Back Button */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold mb-6 transition-colors group">
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Students List
            </button>

            {/* Profile Header */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 mb-6 shadow-lg shadow-slate-200/50 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/50 to-violet-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-indigo-300/50">
                        <FaUser />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{student.nameEnglish}</h1>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm">
                            <span className="bg-indigo-100 px-4 py-1.5 rounded-full text-indigo-700 font-semibold border border-indigo-200">{student.examId}</span>
                            <span className={`px-4 py-1.5 rounded-full font-semibold border ${student.examStatus === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {student.examStatus?.replace('-', ' ').toUpperCase() || 'ACTIVE'}
                            </span>
                            {student.resultsPublished && (
                                <span className="bg-green-100 px-4 py-1.5 rounded-full text-green-700 font-semibold border border-green-200 flex items-center gap-2">
                                    <FaGlobe className="text-xs" /> Published
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Overall Band Score */}
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-6 rounded-3xl text-center min-w-[160px] text-white shadow-2xl shadow-indigo-400/40">
                        <span className="block text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Overall Band</span>
                        <span className="block text-5xl font-black">{student.scores?.overall || "-"}</span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 shadow-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FaStar className="text-amber-400 text-xl" />
                    <div>
                        <h3 className="font-bold text-slate-800">Score Management</h3>
                        <p className="text-xs text-slate-500">Edit all module scores and publish results</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setEditModal({ show: true })}
                        className="px-6 h-11 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <FaEdit /> Edit All Scores
                    </button>
                    <button
                        onClick={handlePublishResults}
                        disabled={publishing}
                        className={`px-6 h-11 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${student.resultsPublished
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-300/50'
                            }`}
                    >
                        {publishing ? <FaSpinner className="animate-spin" /> : student.resultsPublished ? <FaLock /> : <FaUnlock />}
                        {student.resultsPublished ? "Unpublish" : "Publish for Student"}
                    </button>
                </div>
            </div>

            {/* Module Score Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <ModuleScoreCard
                    icon={FaHeadphones}
                    title="Listening"
                    band={student.scores?.listening?.band}
                    subInfo={`Correct: ${student.scores?.listening?.correctAnswers || 0}/40`}
                    color="blue"
                    isCompleted={completedModules.some(m => m.toLowerCase() === 'listening')}
                    onView={() => handleViewAnswers('Listening')}
                    onEdit={() => setEditModal({ show: true, module: 'listening' })}
                    onReset={() => handleResetModule('listening')}
                    resetting={resetting === 'listening'}
                />
                <ModuleScoreCard
                    icon={FaBook}
                    title="Reading"
                    band={student.scores?.reading?.band}
                    subInfo={`Correct: ${student.scores?.reading?.correctAnswers || 0}/40`}
                    color="green"
                    isCompleted={completedModules.some(m => m.toLowerCase() === 'reading')}
                    onView={() => handleViewAnswers('Reading')}
                    onEdit={() => setEditModal({ show: true, module: 'reading' })}
                    onReset={() => handleResetModule('reading')}
                    resetting={resetting === 'reading'}
                />
                <ModuleScoreCard
                    icon={FaPen}
                    title="Writing"
                    band={student.scores?.writing?.overallBand}
                    subInfo={`Task 1: ${student.scores?.writing?.task1Band || 0} | Task 2: ${student.scores?.writing?.task2Band || 0}`}
                    color="purple"
                    isCompleted={completedModules.some(m => m.toLowerCase() === 'writing')}
                    onView={() => handleViewAnswers('Writing')}
                    onEdit={() => setEditModal({ show: true, module: 'writing' })}
                    onReset={() => handleResetModule('writing')}
                    resetting={resetting === 'writing'}
                />
                {/* Speaking card hidden */}
                {false && (
                    <ModuleScoreCard
                        icon={FaMicrophone}
                        title="Speaking"
                        band={student.scores?.speaking?.band}
                        subInfo="Examiner graded"
                        color="orange"
                        isCompleted={completedModules.some(m => m.toLowerCase() === 'speaking')}
                        onView={() => handleViewAnswers('Speaking')}
                        onEdit={() => setEditModal({ show: true, module: 'speaking' })}
                        onReset={() => handleResetModule('speaking')}
                        resetting={resetting === 'speaking'}
                    />
                )}
            </div>

            {/* Student Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-md">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <FaUser className="text-indigo-400" /> Personal Information
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: "Email Address", value: student.email },
                            { label: "Phone Number", value: student.phone },
                            { label: "NID Number", value: student.nidNumber },
                            { label: "Payment Status", value: student.paymentStatus, badge: true, badgeColor: student.paymentStatus === 'paid' ? 'emerald' : 'amber' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <span className="text-slate-500 font-medium text-sm">{item.label}</span>
                                {item.badge ? (
                                    <span className={`bg-${item.badgeColor}-100 text-${item.badgeColor}-700 px-3 py-1 rounded-lg text-sm font-bold border border-${item.badgeColor}-200 capitalize`}>
                                        {item.value}
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-semibold text-sm">{item.value || '-'}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Exam Metadata */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-md">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <FaClipboardCheck className="text-indigo-400" /> Exam Metadata
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: "Exam Date", value: student.examDate ? new Date(student.examDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : '-' },
                            { label: "Completed At", value: student.examCompletedAt ? new Date(student.examCompletedAt).toLocaleString() : '-' },
                            { label: "Violations", value: student.totalViolations, warning: student.totalViolations > 0 },
                            { label: "Results Published", value: student.resultsPublished ? 'Yes' : 'No', badge: true, badgeColor: student.resultsPublished ? 'emerald' : 'slate' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <span className="text-slate-500 font-medium text-sm">{item.label}</span>
                                {item.warning ? (
                                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-sm font-bold border border-rose-200">
                                        {item.value}
                                    </span>
                                ) : item.badge ? (
                                    <span className={`bg-${item.badgeColor}-100 text-${item.badgeColor}-700 px-3 py-1 rounded-lg text-sm font-bold border border-${item.badgeColor}-200`}>
                                        {item.value}
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-semibold text-sm">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Admin Remarks */}
            {student.adminRemarks && (
                <div className="mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5">
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Admin Remarks</h3>
                    <p className="text-slate-700 text-sm">{student.adminRemarks}</p>
                </div>
            )}

            {/* Modals */}
            <ViewAnswersModal
                show={viewModal.show}
                onClose={() => setViewModal({ show: false, module: '', answers: null, loading: false })}
                module={viewModal.module}
                answers={viewModal.answers}
                loading={viewModal.loading}
            />

            <ScoreEditModal
                show={editModal.show}
                onClose={() => setEditModal({ show: false })}
                student={student}
                onSave={handleSaveAllScores}
                saving={saving}
                editModule={editModal.module || null}
            />
        </div>
    );
}

export default function StudentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-indigo-500" />
            </div>
        }>
            <StudentContent />
        </Suspense>
    );
}
