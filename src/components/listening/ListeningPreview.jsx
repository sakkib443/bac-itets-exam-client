"use client";
import React, { useState } from "react";
import { FaHeadphones, FaVolumeUp, FaCheck } from "react-icons/fa";

// ══════════════════════════════════════════════════════════
// Renders one question block in IELTS exam style
// ══════════════════════════════════════════════════════════
function PreviewQuestion({ block }) {
    const isTextInput = [
        "note-completion", "form-completion", "table-completion",
        "sentence-completion", "summary-completion", "short-answer",
        "map-labelling",
    ].includes(block.questionType);

    const isMultipleChoice = block.questionType === "multiple-choice";
    const isMatching = block.questionType === "matching";

    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
            {/* Question Number badge */}
            <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded flex items-center justify-center mt-0.5">
                {block.questionNumber}
            </span>

            <div className="flex-1 min-w-0">
                {/* Question text */}
                {block.questionText && (
                    <p className="text-gray-800 text-sm leading-relaxed mb-2">
                        {block.questionText}
                    </p>
                )}

                {/* ── Note/Table/Short-answer: text input ── */}
                {isTextInput && (
                    <div className="flex items-center gap-2">
                        <span className="border border-gray-300 rounded bg-gray-50 px-3 py-1.5 text-xs text-gray-400 w-40 h-8 leading-5">
                            {block.correctAnswer
                                ? <span className="text-green-600 font-semibold">{block.correctAnswer}</span>
                                : "answer here"}
                        </span>
                        {block.correctAnswer && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <FaCheck size={8} /> Correct
                            </span>
                        )}
                    </div>
                )}

                {/* ── Multiple Choice: radio buttons ── */}
                {isMultipleChoice && (
                    <div className="space-y-1.5">
                        {(block.options || []).map((opt, oIdx) => {
                            const letter = opt.match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + oIdx);
                            const text = opt.replace(/^[A-Z]\.\s*/, "");
                            const isCorrect = block.correctAnswer === letter || block.correctAnswer === opt;
                            return (
                                <div key={oIdx} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100"}`}>
                                    <span className={`font-bold text-sm flex-shrink-0 mt-0.5 ${isCorrect ? "text-green-700" : "text-gray-600"}`}>{letter}</span>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? "border-green-600 bg-green-600" : "border-gray-400"}`}>
                                        {isCorrect && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className={`text-sm flex-1 ${isCorrect ? "text-green-800 font-medium" : "text-gray-700"}`}>{text}</span>
                                    {isCorrect && (
                                        <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">✓</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Matching: dropdown ── */}
                {isMatching && (
                    <div className="flex items-center gap-2 mt-1">
                        <select
                            disabled
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                            defaultValue={block.correctAnswer || ""}
                        >
                            <option value="">Select...</option>
                            {(block.options || []).map((opt, i) => (
                                <option key={i} value={opt.match(/^([A-Z])\./)?.[1] || opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {block.correctAnswer && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                                ✓ {block.correctAnswer}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// MAIN LISTENING PREVIEW COMPONENT
// ══════════════════════════════════════════════════════════
export default function ListeningPreview({ sections, title, mainAudioUrl }) {
    const [activePart, setActivePart] = useState(0);
    const currentSection = sections[activePart] || {};
    const blocks = currentSection.questions || [];

    const questionBlocks = blocks.filter(b => b.blockType === "question");
    const qCount = questionBlocks.length;
    const answered = questionBlocks.filter(b => b.correctAnswer).length;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* ══ Header ══ */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3.5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <FaHeadphones size={14} />
                        👁️ Live Preview — {title || "Untitled Listening Test"}
                    </h3>
                    <div className="text-indigo-200 text-[11px] bg-indigo-500/40 px-2 py-0.5 rounded-full">
                        {answered}/{qCount} answers set
                    </div>
                </div>
                {/* Part Tabs */}
                <div className="flex gap-1">
                    {sections.map((s, idx) => {
                        const pqCount = (s.questions || []).filter(b => b.blockType === "question").length;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActivePart(idx)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex-1 ${activePart === idx
                                    ? "bg-white text-indigo-700 shadow"
                                    : "bg-indigo-500/40 text-indigo-100 hover:bg-indigo-500/60"
                                    }`}
                            >
                                Part {idx + 1}
                                <span className={`ml-1 text-[10px] ${activePart === idx ? "text-indigo-400" : "text-indigo-300"}`}>
                                    ({pqCount}Q)
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ══ Content ══ */}
            <div className="overflow-y-auto max-h-[72vh]">

                {/* Part info bar */}
                <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                    <div>
                        <span className="font-semibold text-indigo-800 text-sm">{currentSection.title || `Part ${activePart + 1}`}</span>
                        {currentSection.instructions && (
                            <span className="ml-2 text-xs text-indigo-500">{currentSection.instructions}</span>
                        )}
                    </div>
                    {currentSection.audioUrl && (
                        <span className="text-xs text-indigo-600 flex items-center gap-1 bg-white border border-indigo-200 px-2 py-1 rounded-full">
                            <FaVolumeUp size={9} /> Part audio set
                        </span>
                    )}
                </div>

                {/* Context */}
                {currentSection.context && (
                    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100">
                        <p className="text-xs text-amber-800 italic">{currentSection.context}</p>
                    </div>
                )}

                {/* Main Audio */}
                {mainAudioUrl && (
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <FaVolumeUp className="text-indigo-400" size={11} />
                        <span className="text-xs text-gray-500 font-mono truncate">{mainAudioUrl}</span>
                    </div>
                )}

                {/* Blocks */}
                <div className="p-5 space-y-4">
                    {blocks.length === 0 && (
                        <div className="text-center py-10">
                            <FaHeadphones className="text-gray-200 mx-auto mb-3" size={36} />
                            <p className="text-gray-400 text-sm italic">No questions added to Part {activePart + 1} yet</p>
                        </div>
                    )}

                    {blocks.map((block, idx) => {
                        if (block.blockType === "instruction") {
                            return (
                                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                    <div
                                        className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: block.content || "<em>Empty instruction</em>" }}
                                    />
                                </div>
                            );
                        }

                        if (block.blockType === "question") {
                            return <PreviewQuestion key={idx} block={block} />;
                        }

                        return null;
                    })}
                </div>

                {/* Answer Summary */}
                {qCount > 0 && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Part {activePart + 1} summary</span>
                            <span className={`font-semibold ${answered === qCount ? "text-green-600" : "text-amber-600"}`}>
                                {answered}/{qCount} answers filled
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {questionBlocks.map(b => (
                                <span
                                    key={b.questionNumber}
                                    className={`w-7 h-7 text-[10px] font-bold rounded flex items-center justify-center border ${b.correctAnswer
                                        ? "bg-green-50 text-green-700 border-green-300"
                                        : "bg-red-50 text-red-400 border-red-200"
                                        }`}
                                >
                                    {b.questionNumber}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
