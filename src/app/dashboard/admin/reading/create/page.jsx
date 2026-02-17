"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaPlus,
    FaTrash,
    FaBook,
    FaTimes,
    FaChevronDown,
    FaChevronUp,
    FaCloudUploadAlt,
    FaCode,
    FaEye,
    FaCopy,
    FaCheck,
    FaClock,
    FaRobot,
    FaFilePdf,
    FaFileImage,
    FaMagic,
} from "react-icons/fa";
import { readingAPI, uploadAPI } from "@/lib/api";

// ========== QUESTION TYPES ==========
const QUESTION_TYPES = [
    { value: "multiple-choice", label: "Multiple Choice (Single)" },
    { value: "multiple-choice-multi", label: "Multiple Choice (Multi)" },
    { value: "true-false-not-given", label: "True / False / Not Given" },
    { value: "yes-no-not-given", label: "Yes / No / Not Given" },
    { value: "matching-information", label: "Matching Information" },
    { value: "matching-headings", label: "Matching Headings" },
    { value: "matching-features", label: "Matching Features" },
    { value: "matching-sentence-endings", label: "Matching Sentence Endings" },
    { value: "sentence-completion", label: "Sentence Completion" },
    { value: "summary-completion", label: "Summary Completion" },
    { value: "note-completion", label: "Note Completion" },
    { value: "table-completion", label: "Table Completion" },
    { value: "flow-chart-completion", label: "Flow Chart Completion" },
    { value: "diagram-labeling", label: "Diagram Labeling" },
    { value: "fill-in-blank", label: "Fill in the Blank" },
    { value: "short-answer", label: "Short Answer" },
    { value: "choose-two-letters", label: "Choose Two Letters" },
];

// ========== EMPTY TEMPLATES ==========
const emptyQuestion = () => ({
    questionNumber: 1,
    questionType: "multiple-choice",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    acceptableAnswers: [],
    wordLimit: null,
    marks: 1,
    instruction: "",
    explanation: "",
});

const emptySection = (num) => ({
    sectionNumber: num,
    title: "",
    passage: "",
    passageSource: "",
    paragraphs: [],
    instructions: "",
    imageUrl: "",
    questions: [],
    questionGroups: [],
});

// ========== QUESTION GROUP TEMPLATES ==========
const QG_TEMPLATES = {
    "note-completion": {
        label: "Note Completion",
        template: {
            questionType: "note-completion",
            groupType: "note-completion",
            startQuestion: 1,
            endQuestion: 4,
            instructions: "Complete the notes below.",
            mainHeading: "Main Topic Title",
            passage: `Sub Heading

• the first item has 1 __________ feature
• the 2 __________ is used for something
• it produces a type of 3 __________
• the result is known as 4 __________`
        }
    },
    "true-false-not-given": {
        label: "True / False / Not Given",
        template: {
            questionType: "true-false-not-given",
            groupType: "true-false-not-given",
            startQuestion: 5,
            endQuestion: 7,
            instructions: "Do the following statements agree with the information given in the Reading Passage?",
            statements: [
                { questionNumber: 5, text: "Statement text for question 5." },
                { questionNumber: 6, text: "Statement text for question 6." },
                { questionNumber: 7, text: "Statement text for question 7." },
            ]
        }
    },
    "yes-no-not-given": {
        label: "Yes / No / Not Given",
        template: {
            questionType: "yes-no-not-given",
            groupType: "yes-no-not-given",
            startQuestion: 5,
            endQuestion: 7,
            instructions: "Do the following statements agree with the claims of the writer?",
            statements: [
                { questionNumber: 5, text: "Statement text for question 5." },
                { questionNumber: 6, text: "Statement text for question 6." },
                { questionNumber: 7, text: "Statement text for question 7." },
            ]
        }
    },
    "matching-information": {
        label: "Matching Information",
        template: {
            groupType: "matching-information",
            startQuestion: 14,
            endQuestion: 18,
            mainInstruction: "Which paragraph contains the following information?",
            subInstruction: "Write the correct letter, A-F, in boxes on your answer sheet.",
            note: "NB You may use any letter more than once.",
            paragraphOptions: ["A", "B", "C", "D", "E", "F"],
            matchingItems: [
                { questionNumber: 14, text: "a description of..." },
                { questionNumber: 15, text: "an explanation of..." },
                { questionNumber: 16, text: "a reference to..." },
                { questionNumber: 17, text: "details about..." },
                { questionNumber: 18, text: "a comparison of..." },
            ]
        }
    },
    "summary-completion": {
        label: "Summary Completion",
        template: {
            groupType: "summary-completion",
            startQuestion: 8,
            endQuestion: 13,
            mainInstruction: "Complete the table below.",
            mainHeading: "Timeline Summary",
            summarySegments: [
                { type: "text", content: "In the early period, the main activity was" },
                { type: "blank", questionNumber: 8 },
                { type: "text", content: ". Later, people began to" },
                { type: "blank", questionNumber: 9 },
                { type: "text", content: " which led to significant changes." },
            ]
        }
    },
    "summary-with-options": {
        label: "Summary with Options",
        template: {
            groupType: "summary-with-options",
            startQuestion: 8,
            endQuestion: 10,
            mainInstruction: "Complete the summary below.",
            subInstruction: "Choose your answers from the box below.",
            phraseList: [
                { letter: "A", text: "option one" },
                { letter: "B", text: "option two" },
                { letter: "C", text: "option three" },
                { letter: "D", text: "option four" },
                { letter: "E", text: "option five" },
            ],
            summarySegments: [
                { type: "text", content: "The process begins with" },
                { type: "blank", questionNumber: 8 },
                { type: "text", content: ". Then" },
                { type: "blank", questionNumber: 9 },
                { type: "text", content: " occurs, followed by" },
                { type: "blank", questionNumber: 10 },
            ]
        }
    },
    "choose-two-letters": {
        label: "Choose Two Letters",
        template: {
            groupType: "choose-two-letters",
            startQuestion: 20,
            endQuestion: 21,
            mainInstruction: "Choose TWO letters, A-E.",
            questionSets: [
                {
                    questionNumbers: [20, 21],
                    questionText: "Which TWO benefits are mentioned by the writer?",
                    options: [
                        { letter: "A", text: "First option" },
                        { letter: "B", text: "Second option" },
                        { letter: "C", text: "Third option" },
                        { letter: "D", text: "Fourth option" },
                        { letter: "E", text: "Fifth option" },
                    ]
                }
            ]
        }
    },
};

// ========== QUESTION GROUP EDITOR COMPONENT ==========
function QuestionGroupEditor({ group, index, onUpdate, onRemove }) {
    const [expanded, setExpanded] = useState(true);

    const updateGroup = (field, value) => {
        onUpdate(index, { ...group, [field]: value });
    };

    const gType = group.questionType || group.groupType || "";

    // ─── Shared header for all types ───
    const renderHeader = () => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
                <span className="text-xs font-bold text-purple-700">
                    {expanded ? "▼" : "▶"} {QG_TEMPLATES[gType]?.label || gType} — Q{group.startQuestion}-Q{group.endQuestion}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] text-purple-600 hover:underline cursor-pointer">
                    {expanded ? "Collapse" : "Expand"}
                </button>
                <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 cursor-pointer">
                    <FaTimes className="text-[10px]" />
                </button>
            </div>
        </div>
    );

    // ─── Shared Q range + instruction fields ───
    const renderCommonFields = () => (
        <div className="space-y-2 mt-2">
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-[10px] text-gray-500 block">Start Q</label>
                    <input type="number" value={group.startQuestion || ""} onChange={e => updateGroup("startQuestion", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block">End Q</label>
                    <input type="number" value={group.endQuestion || ""} onChange={e => updateGroup("endQuestion", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block">Type</label>
                    <select value={gType} onChange={e => { updateGroup("groupType", e.target.value); updateGroup("questionType", e.target.value); }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400">
                        {Object.entries(QG_TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] text-gray-500 block">Instruction</label>
                <input value={group.instructions || group.mainInstruction || ""} onChange={e => {
                    if ("instructions" in group) updateGroup("instructions", e.target.value);
                    else updateGroup("mainInstruction", e.target.value);
                }} className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400"
                    placeholder="e.g. Complete the notes below." />
            </div>
        </div>
    );

    // ─── Note Completion fields ───
    const renderNoteCompletion = () => (
        <div className="space-y-2 mt-2">
            <div>
                <label className="text-[10px] text-gray-500 block">Main Heading</label>
                <input value={group.mainHeading || ""} onChange={e => updateGroup("mainHeading", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" placeholder="Main Topic Title" />
            </div>
            <div>
                <label className="text-[10px] text-gray-500 block">Passage (use • for bullets, use number + __________ for blanks)</label>
                <textarea value={group.passage || ""} onChange={e => updateGroup("passage", e.target.value)} rows={6}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400 resize-y font-mono leading-relaxed"
                    placeholder={"Sub Heading\n\n• the first item has 1 __________ feature\n• the 2 __________ is used for something"} />
            </div>
        </div>
    );

    // ─── T/F/NG or Y/N/NG fields ───
    const renderTFNG = () => {
        const statements = group.statements || [];
        return (
            <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-500">Statements ({statements.length})</label>
                    <button type="button" onClick={() => {
                        const maxQ = statements.reduce((max, s) => Math.max(max, s.questionNumber || 0), group.startQuestion - 1);
                        updateGroup("statements", [...statements, { questionNumber: maxQ + 1, text: "" }]);
                        updateGroup("endQuestion", maxQ + 1);
                    }} className="text-[10px] text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5">
                        <FaPlus className="text-[8px]" /> Add Statement
                    </button>
                </div>
                {statements.map((stmt, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-1.5">
                        <input type="number" value={stmt.questionNumber} onChange={e => {
                            const s = [...statements]; s[sIdx] = { ...s[sIdx], questionNumber: parseInt(e.target.value) || 1 };
                            updateGroup("statements", s);
                        }} className="w-10 px-1 py-1 border border-gray-200 rounded text-xs text-center outline-none" />
                        <input value={stmt.text} onChange={e => {
                            const s = [...statements]; s[sIdx] = { ...s[sIdx], text: e.target.value };
                            updateGroup("statements", s);
                        }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400"
                            placeholder="Statement text..." />
                        <button type="button" onClick={() => {
                            updateGroup("statements", statements.filter((_, i) => i !== sIdx));
                        }} className="text-red-400 hover:text-red-600 mt-1 cursor-pointer">
                            <FaTimes className="text-[9px]" />
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // ─── Matching Information fields ───
    const renderMatchingInfo = () => {
        const items = group.matchingItems || [];
        const opts = group.paragraphOptions || [];
        return (
            <div className="space-y-2 mt-2">
                <div>
                    <label className="text-[10px] text-gray-500 block">Sub Instruction</label>
                    <input value={group.subInstruction || ""} onChange={e => updateGroup("subInstruction", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block">Note</label>
                    <input value={group.note || ""} onChange={e => updateGroup("note", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" placeholder="NB You may use any letter more than once." />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block">Paragraph Options (comma separated)</label>
                    <input value={opts.join(", ")} onChange={e => updateGroup("paragraphOptions", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" placeholder="A, B, C, D, E, F" />
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-500">Matching Items ({items.length})</label>
                    <button type="button" onClick={() => {
                        const maxQ = items.reduce((max, it) => Math.max(max, it.questionNumber || 0), group.startQuestion - 1);
                        updateGroup("matchingItems", [...items, { questionNumber: maxQ + 1, text: "" }]);
                        updateGroup("endQuestion", maxQ + 1);
                    }} className="text-[10px] text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5">
                        <FaPlus className="text-[8px]" /> Add Item
                    </button>
                </div>
                {items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-start gap-1.5">
                        <input type="number" value={item.questionNumber} onChange={e => {
                            const m = [...items]; m[iIdx] = { ...m[iIdx], questionNumber: parseInt(e.target.value) || 1 };
                            updateGroup("matchingItems", m);
                        }} className="w-10 px-1 py-1 border border-gray-200 rounded text-xs text-center outline-none" />
                        <input value={item.text} onChange={e => {
                            const m = [...items]; m[iIdx] = { ...m[iIdx], text: e.target.value };
                            updateGroup("matchingItems", m);
                        }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400"
                            placeholder="a description of..." />
                        <button type="button" onClick={() => {
                            updateGroup("matchingItems", items.filter((_, i) => i !== iIdx));
                        }} className="text-red-400 hover:text-red-600 mt-1 cursor-pointer">
                            <FaTimes className="text-[9px]" />
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // ─── Summary Completion / Summary with Options fields ───
    const renderSummary = () => {
        const segments = group.summarySegments || [];
        const isWithOptions = gType === "summary-with-options";
        const phraseList = group.phraseList || [];

        return (
            <div className="space-y-2 mt-2">
                {group.mainHeading !== undefined && (
                    <div>
                        <label className="text-[10px] text-gray-500 block">Main Heading</label>
                        <input value={group.mainHeading || ""} onChange={e => updateGroup("mainHeading", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" />
                    </div>
                )}
                {group.subInstruction !== undefined && (
                    <div>
                        <label className="text-[10px] text-gray-500 block">Sub Instruction</label>
                        <input value={group.subInstruction || ""} onChange={e => updateGroup("subInstruction", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" />
                    </div>
                )}

                {/* Phrase List for summary-with-options */}
                {isWithOptions && (
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-gray-500">Options / Phrase List ({phraseList.length})</label>
                            <button type="button" onClick={() => {
                                const nextLetter = String.fromCharCode(65 + phraseList.length);
                                updateGroup("phraseList", [...phraseList, { letter: nextLetter, text: "" }]);
                            }} className="text-[10px] text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5">
                                <FaPlus className="text-[8px]" /> Add Option
                            </button>
                        </div>
                        {phraseList.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-1.5 mt-1">
                                <input value={p.letter} onChange={e => {
                                    const pl = [...phraseList]; pl[pIdx] = { ...pl[pIdx], letter: e.target.value };
                                    updateGroup("phraseList", pl);
                                }} className="w-8 px-1 py-1 border border-gray-200 rounded text-xs text-center outline-none font-bold" />
                                <input value={p.text} onChange={e => {
                                    const pl = [...phraseList]; pl[pIdx] = { ...pl[pIdx], text: e.target.value };
                                    updateGroup("phraseList", pl);
                                }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400" placeholder="option text" />
                                <button type="button" onClick={() => updateGroup("phraseList", phraseList.filter((_, i) => i !== pIdx))}
                                    className="text-red-400 hover:text-red-600 cursor-pointer"><FaTimes className="text-[9px]" /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Segments */}
                <div>
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500">Summary Segments ({segments.length})</label>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => updateGroup("summarySegments", [...segments, { type: "text", content: "" }])}
                                className="text-[10px] text-blue-600 hover:underline cursor-pointer">+ Text</button>
                            <button type="button" onClick={() => {
                                const maxQ = segments.filter(s => s.type === "blank").reduce((max, s) => Math.max(max, s.questionNumber || 0), group.startQuestion - 1);
                                updateGroup("summarySegments", [...segments, { type: "blank", questionNumber: maxQ + 1 }]);
                            }} className="text-[10px] text-purple-600 hover:underline cursor-pointer">+ Blank</button>
                        </div>
                    </div>
                    {segments.map((seg, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5 mt-1">
                            {seg.type === "text" ? (
                                <>
                                    <span className="text-[9px] text-blue-500 font-bold w-8 text-center">TXT</span>
                                    <input value={seg.content || ""} onChange={e => {
                                        const s = [...segments]; s[sIdx] = { ...s[sIdx], content: e.target.value };
                                        updateGroup("summarySegments", s);
                                    }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-blue-400"
                                        placeholder="Text content..." />
                                </>
                            ) : (
                                <>
                                    <span className="text-[9px] text-purple-600 font-bold w-8 text-center">Q#</span>
                                    <input type="number" value={seg.questionNumber || ""} onChange={e => {
                                        const s = [...segments]; s[sIdx] = { ...s[sIdx], questionNumber: parseInt(e.target.value) || 1 };
                                        updateGroup("summarySegments", s);
                                    }} className="w-14 px-2 py-1 border border-purple-200 rounded text-xs outline-none focus:border-purple-400 text-center bg-purple-50" />
                                    <span className="text-[9px] text-gray-400 flex-1">← blank input will appear here</span>
                                </>
                            )}
                            <button type="button" onClick={() => updateGroup("summarySegments", segments.filter((_, i) => i !== sIdx))}
                                className="text-red-400 hover:text-red-600 cursor-pointer"><FaTimes className="text-[9px]" /></button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ─── Choose Two Letters fields ───
    const renderChooseTwoLetters = () => {
        const sets = group.questionSets || [];
        return (
            <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-500">Question Sets ({sets.length})</label>
                    <button type="button" onClick={() => {
                        updateGroup("questionSets", [...sets, {
                            questionNumbers: [group.startQuestion, group.startQuestion + 1],
                            questionText: "",
                            options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }, { letter: "E", text: "" }]
                        }]);
                    }} className="text-[10px] text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5">
                        <FaPlus className="text-[8px]" /> Add Question Set
                    </button>
                </div>
                {sets.map((qSet, qsIdx) => (
                    <div key={qsIdx} className="border border-gray-200 rounded p-2 bg-white">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-gray-500">Set {qsIdx + 1}</span>
                            <button type="button" onClick={() => updateGroup("questionSets", sets.filter((_, i) => i !== qsIdx))}
                                className="text-red-400 hover:text-red-600 cursor-pointer"><FaTimes className="text-[9px]" /></button>
                        </div>
                        <input value={qSet.questionText || ""} onChange={e => {
                            const s = [...sets]; s[qsIdx] = { ...s[qsIdx], questionText: e.target.value };
                            updateGroup("questionSets", s);
                        }} className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-purple-400 mb-1"
                            placeholder="Which TWO benefits are mentioned?" />
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-gray-400">Options</span>
                            <button type="button" onClick={() => {
                                const s = [...sets];
                                const nextLetter = String.fromCharCode(65 + (qSet.options?.length || 0));
                                s[qsIdx] = { ...s[qsIdx], options: [...(qSet.options || []), { letter: nextLetter, text: "" }] };
                                updateGroup("questionSets", s);
                            }} className="text-[9px] text-purple-600 hover:underline cursor-pointer">+ Option</button>
                        </div>
                        {(qSet.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1 mt-0.5">
                                <input value={opt.letter} onChange={e => {
                                    const s = [...sets]; const o = [...s[qsIdx].options]; o[oIdx] = { ...o[oIdx], letter: e.target.value };
                                    s[qsIdx] = { ...s[qsIdx], options: o }; updateGroup("questionSets", s);
                                }} className="w-7 px-1 py-0.5 border border-gray-200 rounded text-[10px] text-center outline-none font-bold" />
                                <input value={opt.text} onChange={e => {
                                    const s = [...sets]; const o = [...s[qsIdx].options]; o[oIdx] = { ...o[oIdx], text: e.target.value };
                                    s[qsIdx] = { ...s[qsIdx], options: o }; updateGroup("questionSets", s);
                                }} className="flex-1 px-2 py-0.5 border border-gray-200 rounded text-[10px] outline-none focus:border-purple-400" placeholder="Option text" />
                                <button type="button" onClick={() => {
                                    const s = [...sets]; s[qsIdx] = { ...s[qsIdx], options: (qSet.options || []).filter((_, i) => i !== oIdx) };
                                    updateGroup("questionSets", s);
                                }} className="text-red-400 hover:text-red-600 cursor-pointer"><FaTimes className="text-[8px]" /></button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    // ─── Render type-specific fields ───
    const renderTypeFields = () => {
        switch (gType) {
            case "note-completion": return renderNoteCompletion();
            case "true-false-not-given":
            case "yes-no-not-given":
            case "true-false-ng": return renderTFNG();
            case "matching-information":
            case "matching-headings":
            case "matching-features":
            case "matching-sentence-endings": return renderMatchingInfo();
            case "summary-completion": return renderSummary();
            case "summary-with-options": return renderSummary();
            case "choose-two-letters": return renderChooseTwoLetters();
            default: return (
                <div className="mt-2 text-[10px] text-gray-500 italic">
                    No specific editor for this type. Use JSON editor instead.
                </div>
            );
        }
    };

    return (
        <div className="border border-purple-200 rounded-md bg-purple-50/50 p-3 mb-2">
            {renderHeader()}
            {expanded && (
                <>
                    {renderCommonFields()}
                    {renderTypeFields()}
                </>
            )}
        </div>
    );
}

// ========== QUICK ANSWER TABLE COMPONENT ==========
function QuickAnswerTable({ questions, onChange, onBulkAdd }) {
    const [bulkStart, setBulkStart] = useState(1);
    const [bulkEnd, setBulkEnd] = useState(13);
    const [bulkType, setBulkType] = useState("note-completion");

    const updateQuestion = (idx, field, value) => {
        const updated = [...questions];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    const removeQuestion = (idx) => {
        onChange(questions.filter((_, i) => i !== idx));
    };

    const addRow = () => {
        const maxQ = questions.reduce((max, q) => Math.max(max, q.questionNumber || 0), 0);
        onChange([...questions, {
            questionNumber: maxQ + 1,
            questionType: "note-completion",
            correctAnswer: "",
            acceptableAnswers: [],
            marks: 1,
        }]);
    };

    const handleBulkAdd = () => {
        const newQs = [];
        for (let i = bulkStart; i <= bulkEnd; i++) {
            if (!questions.find(q => q.questionNumber === i)) {
                newQs.push({
                    questionNumber: i,
                    questionType: bulkType,
                    correctAnswer: "",
                    acceptableAnswers: [],
                    marks: 1,
                });
            }
        }
        if (newQs.length > 0) {
            onChange([...questions, ...newQs].sort((a, b) => a.questionNumber - b.questionNumber));
        }
    };

    return (
        <div>
            {/* Bulk Add */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] text-gray-500 font-medium">Quick Add:</span>
                <span className="text-[10px] text-gray-400">Q</span>
                <input
                    type="number"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(parseInt(e.target.value) || 1)}
                    className="w-12 px-1.5 py-1 border border-gray-200 rounded text-xs text-center outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-gray-400">to</span>
                <input
                    type="number"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(parseInt(e.target.value) || 1)}
                    className="w-12 px-1.5 py-1 border border-gray-200 rounded text-xs text-center outline-none focus:border-blue-500"
                />
                <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value)}
                    className="px-1.5 py-1 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                >
                    {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleBulkAdd}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded cursor-pointer hover:bg-blue-700"
                >
                    Add Q{bulkStart}-Q{bulkEnd}
                </button>
            </div>

            {/* Table */}
            {questions.length > 0 && (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-12">Q#</th>
                                <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-36">Type</th>
                                <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Correct Answer</th>
                                <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Alt. Answers</th>
                                <th className="px-2 py-1.5 text-center text-gray-500 font-medium w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-2 py-1">
                                        <input
                                            type="number"
                                            value={q.questionNumber}
                                            onChange={(e) => updateQuestion(idx, "questionNumber", parseInt(e.target.value) || 1)}
                                            className="w-10 px-1 py-0.5 border border-gray-200 rounded text-center text-xs outline-none focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <select
                                            value={q.questionType || "note-completion"}
                                            onChange={(e) => updateQuestion(idx, "questionType", e.target.value)}
                                            className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                                        >
                                            {QUESTION_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1">
                                        {["true-false-not-given", "yes-no-not-given"].includes(q.questionType) ? (
                                            <select
                                                value={q.correctAnswer || ""}
                                                onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                                            >
                                                <option value="">Select...</option>
                                                {q.questionType === "true-false-not-given" ? (
                                                    <>
                                                        <option value="TRUE">TRUE</option>
                                                        <option value="FALSE">FALSE</option>
                                                        <option value="NOT GIVEN">NOT GIVEN</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="YES">YES</option>
                                                        <option value="NO">NO</option>
                                                        <option value="NOT GIVEN">NOT GIVEN</option>
                                                    </>
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                value={typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer || "")}
                                                onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                                                placeholder="Answer..."
                                            />
                                        )}
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            value={(q.acceptableAnswers || []).join(", ")}
                                            onChange={(e) => updateQuestion(idx, "acceptableAnswers", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                                            placeholder="Alt answers..."
                                        />
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(idx)}
                                            className="text-red-400 hover:text-red-600 cursor-pointer"
                                        >
                                            <FaTimes className="text-[10px]" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {questions.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs border border-dashed border-gray-200 rounded-md">
                    No answers yet. Use Quick Add above or add one by one.
                </div>
            )}

            <button
                type="button"
                onClick={addRow}
                className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
                <FaPlus className="text-[10px]" /> Add Single Row
            </button>
        </div>
    );
}

// ========== SECTION EDITOR COMPONENT ==========
function SectionEditor({ section, sectionIndex, onChange, imageUploading, setImageUploading }) {
    const [collapsed, setCollapsed] = useState(false);
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [showQuestionGroups, setShowQuestionGroups] = useState(false);
    const [qgJsonText, setQgJsonText] = useState("");
    const [qgJsonError, setQgJsonError] = useState("");

    const updateField = (field, value) => {
        onChange(sectionIndex, { ...section, [field]: value });
    };

    // Image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(prev => ({ ...prev, [sectionIndex]: true }));
        try {
            const result = await uploadAPI.uploadImage(file);
            if (result?.success && result?.data?.url) {
                updateField("imageUrl", result.data.url);
            }
        } catch (err) {
            console.error("Image upload failed:", err);
        } finally {
            setImageUploading(prev => ({ ...prev, [sectionIndex]: false }));
        }
    };

    // JSON import for questions
    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) throw new Error("Must be an array of questions");
            updateField("questions", parsed);
            setShowJsonEditor(false);
            setJsonError("");
        } catch (err) {
            setJsonError(err.message);
        }
    };

    // JSON export questions
    const handleJsonExport = () => {
        setJsonText(JSON.stringify(section.questions, null, 2));
        setShowJsonEditor(true);
    };

    // QuestionGroups JSON import
    const handleQgJsonImport = () => {
        try {
            const parsed = JSON.parse(qgJsonText);
            if (!Array.isArray(parsed)) throw new Error("Must be an array of questionGroups");
            updateField("questionGroups", parsed);
            setShowQuestionGroups(false);
            setQgJsonError("");
        } catch (err) {
            setQgJsonError(err.message);
        }
    };

    const handleQgJsonExport = () => {
        setQgJsonText(JSON.stringify(section.questionGroups || [], null, 2));
        setShowQuestionGroups(true);
    };

    // Paragraph management
    const addParagraph = () => {
        const paras = [...(section.paragraphs || [])];
        const nextLabel = String.fromCharCode(65 + paras.length); // A, B, C...
        paras.push({ label: nextLabel, text: "" });
        updateField("paragraphs", paras);
    };

    const updateParagraph = (pIdx, field, value) => {
        const paras = [...(section.paragraphs || [])];
        paras[pIdx] = { ...paras[pIdx], [field]: value };
        updateField("paragraphs", paras);
    };

    const removeParagraph = (pIdx) => {
        updateField("paragraphs", (section.paragraphs || []).filter((_, i) => i !== pIdx));
    };

    return (
        <div className="border border-gray-200 rounded-md bg-white mb-4">
            {/* Section Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                        Section {section.sectionNumber}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                        {section.title || `Passage ${section.sectionNumber}`}
                    </span>
                    <span className="text-xs text-gray-400">
                        ({section.questions.length} questions)
                    </span>
                </div>
                {collapsed ? <FaChevronDown className="text-gray-400" /> : <FaChevronUp className="text-gray-400" />}
            </div>

            {/* Section Body */}
            {!collapsed && (
                <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Section Title *</label>
                            <input
                                value={section.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                placeholder="e.g. The Impact of Technology on Education"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Passage Source</label>
                            <input
                                value={section.passageSource || ""}
                                onChange={(e) => updateField("passageSource", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                placeholder="e.g. Cambridge IELTS 17"
                            />
                        </div>
                    </div>

                    {/* Passage */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Reading Passage *</label>
                        <textarea
                            value={section.passage}
                            onChange={(e) => updateField("passage", e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 resize-y leading-relaxed"
                            placeholder="Paste the full reading passage here..."
                        />
                    </div>

                    {/* Paragraphs */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-500">Paragraphs (Optional — labeled A, B, C...)</label>
                            <button type="button" onClick={addParagraph} className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                                <FaPlus className="text-[10px]" /> Add Paragraph
                            </button>
                        </div>
                        {(section.paragraphs || []).map((para, pIdx) => (
                            <div key={pIdx} className="flex gap-2 mb-2">
                                <input
                                    value={para.label}
                                    onChange={(e) => updateParagraph(pIdx, "label", e.target.value)}
                                    className="w-12 px-2 py-1.5 border border-gray-200 rounded text-sm text-center font-bold outline-none"
                                    placeholder="A"
                                />
                                <textarea
                                    value={para.text}
                                    onChange={(e) => updateParagraph(pIdx, "text", e.target.value)}
                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-blue-500 resize-none"
                                    rows={2}
                                    placeholder="Paragraph text..."
                                />
                                <button type="button" onClick={() => removeParagraph(pIdx)} className="text-red-400 hover:text-red-600 self-start mt-1 cursor-pointer">
                                    <FaTrash className="text-xs" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Section Instructions</label>
                        <textarea
                            value={section.instructions || ""}
                            onChange={(e) => updateField("instructions", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 resize-none"
                            placeholder="e.g. Read the passage and answer questions 1-13"
                        />
                    </div>

                    {/* Image */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Section Image (Optional)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={section.imageUrl || ""}
                                onChange={(e) => updateField("imageUrl", e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                placeholder="Image URL or upload →"
                            />
                            <label className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm cursor-pointer hover:bg-gray-200 flex items-center gap-1.5">
                                {imageUploading[sectionIndex] ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />}
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                        {section.imageUrl && (
                            <div className="mt-2 border border-gray-200 rounded-md overflow-hidden inline-block">
                                <img src={section.imageUrl} alt="Section" className="max-h-32 object-contain" />
                            </div>
                        )}
                    </div>

                    {/* ─── Answers (Quick Entry Table) ─── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-500">
                                Answers ({section.questions.length}) — for grading
                            </label>
                            <button type="button" onClick={handleJsonExport} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer" title="Edit as JSON">
                                <FaCode /> JSON
                            </button>
                        </div>

                        {/* JSON Editor */}
                        {showJsonEditor && (
                            <div className="border border-blue-200 rounded-md bg-blue-50 p-3 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-blue-700">Questions JSON Editor</span>
                                    <button type="button" onClick={() => setShowJsonEditor(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes /></button>
                                </div>
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    rows={12}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono outline-none focus:border-blue-500 resize-y"
                                />
                                {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
                                <button type="button" onClick={handleJsonImport} className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium cursor-pointer hover:bg-blue-700">
                                    Import JSON
                                </button>
                            </div>
                        )}

                        {/* Quick Answer Table */}
                        <QuickAnswerTable
                            questions={section.questions}
                            onChange={(updatedQuestions) => updateField("questions", updatedQuestions)}
                        />
                    </div>

                    {/* ─── Question Groups (Display Layout) ─── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-500">
                                Question Groups ({(section.questionGroups || []).length}) — for display layout
                            </label>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={handleQgJsonExport} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer">
                                    <FaCode /> Edit JSON
                                </button>
                            </div>
                        </div>

                        {/* Template Buttons */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="text-[10px] text-gray-400 self-center mr-1">Add Template:</span>
                            {Object.entries(QG_TEMPLATES).map(([key, { label, template }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        const existing = section.questionGroups || [];
                                        updateField("questionGroups", [...existing, { ...template }]);
                                    }}
                                    className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 cursor-pointer transition-colors"
                                >
                                    + {label}
                                </button>
                            ))}
                        </div>

                        {/* Existing Question Groups — inline editor */}
                        {(section.questionGroups || []).map((group, gIdx) => (
                            <QuestionGroupEditor
                                key={gIdx}
                                group={group}
                                index={gIdx}
                                onUpdate={(idx, updated) => {
                                    const qg = [...(section.questionGroups || [])];
                                    qg[idx] = updated;
                                    updateField("questionGroups", qg);
                                }}
                                onRemove={(idx) => {
                                    const qg = (section.questionGroups || []).filter((_, i) => i !== idx);
                                    updateField("questionGroups", qg);
                                }}
                            />
                        ))}

                        {/* QuestionGroups JSON Editor */}
                        {showQuestionGroups && (
                            <div className="border border-purple-200 rounded-md bg-purple-50 p-3 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-purple-700">Question Groups JSON Editor</span>
                                    <button type="button" onClick={() => setShowQuestionGroups(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes /></button>
                                </div>
                                <textarea
                                    value={qgJsonText}
                                    onChange={(e) => setQgJsonText(e.target.value)}
                                    rows={14}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono outline-none focus:border-purple-500 resize-y"
                                />
                                {qgJsonError && <p className="text-xs text-red-600 mt-1">{qgJsonError}</p>}
                                <button type="button" onClick={handleQgJsonImport} className="mt-2 px-4 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium cursor-pointer hover:bg-purple-700">
                                    Import JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== LIVE PREVIEW — matches actual exam page design ==========
function LivePreview({ formData, sections, onUpdateSection }) {
    const [activeSection, setActiveSection] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const currentSection = sections[activeSection];

    if (!currentSection) return null;

    // Helper to update a question group field from preview
    const updateGroupField = (gIdx, field, value) => {
        if (!onUpdateSection) return;
        const qg = [...(currentSection.questionGroups || [])];
        qg[gIdx] = { ...qg[gIdx], [field]: value };
        onUpdateSection(activeSection, "questionGroups", qg);
    };

    // Helper to update nested array item in a question group
    const updateGroupArrayItem = (gIdx, arrayField, itemIdx, itemField, value) => {
        if (!onUpdateSection) return;
        const qg = [...(currentSection.questionGroups || [])];
        const arr = [...(qg[gIdx][arrayField] || [])];
        arr[itemIdx] = { ...arr[itemIdx], [itemField]: value };
        qg[gIdx] = { ...qg[gIdx], [arrayField]: arr };
        onUpdateSection(activeSection, "questionGroups", qg);
    };

    const renderQuestionInput = (q) => {
        const qType = q.questionType;
        const isTFNG = ["true-false-not-given", "yes-no-not-given"].includes(qType);
        const isMCQ = ["multiple-choice", "multiple-choice-multi", "multiple-choice-full"].includes(qType);
        const isCompletion = ["sentence-completion", "summary-completion", "note-completion", "table-completion", "flow-chart-completion", "fill-in-blank", "short-answer", "diagram-labeling"].includes(qType);
        const isMatching = ["matching", "matching-information", "matching-headings", "matching-features", "matching-sentence-endings"].includes(qType);

        if (isTFNG) {
            const opts = qType === "true-false-not-given" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"];
            return (
                <div className="flex gap-2 mt-1">
                    {opts.map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                            <input type="radio" name={`preview-q-${q.questionNumber}`} disabled className="accent-blue-600" />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (isMCQ) {
            return (
                <div className="mt-1 space-y-1">
                    {(q.options || []).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-[11px] cursor-pointer">
                            <input type="radio" name={`preview-q-${q.questionNumber}`} disabled className="accent-blue-600" />
                            <span className="text-gray-700"><strong>{String.fromCharCode(65 + i)}.</strong> {opt || '...'}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (isCompletion || isMatching) {
            return (
                <input
                    type="text"
                    disabled
                    placeholder="Type answer..."
                    className="mt-1 w-full max-w-[200px] px-2 py-1 border-b-2 border-gray-300 bg-transparent text-[11px] outline-none"
                />
            );
        }

        return (
            <input
                type="text"
                disabled
                placeholder="Type answer..."
                className="mt-1 w-full max-w-[200px] px-2 py-1 border-b-2 border-gray-300 bg-transparent text-[11px] outline-none"
            />
        );
    };

    // Group questions by type for display
    const questionsCount = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const qsBefore = sections.slice(0, activeSection).reduce((sum, s) => sum + s.questions.length, 0);
    const qsEnd = qsBefore + currentSection.questions.length;

    // ─── Render question group in preview ───
    const renderGroupPreview = (group, gIdx) => {
        const gType = group.questionType || group.groupType;

        // Note Completion
        if (gType === "note-completion") {
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.instructions || ""} onChange={e => updateGroupField(gIdx, "instructions", e.target.value)}
                            className="w-full text-[10px] text-gray-600 mb-1 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 mb-1">{group.instructions}</p>
                    )}
                    <p className="text-[10px] text-gray-500 italic mb-2">
                        Choose <strong>ONE WORD ONLY</strong> from the passage.
                    </p>
                    {editMode ? (
                        <input value={group.mainHeading || ""} onChange={e => updateGroupField(gIdx, "mainHeading", e.target.value)}
                            className="w-full text-xs font-bold text-blue-900 mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        group.mainHeading && <h5 className="text-xs font-bold text-blue-900 mb-2">{group.mainHeading}</h5>
                    )}
                    {editMode ? (
                        <textarea value={group.passage || ""} onChange={e => updateGroupField(gIdx, "passage", e.target.value)} rows={5}
                            className="w-full text-[10px] font-mono px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50 resize-y leading-relaxed" />
                    ) : (
                        (group.passage || "").split('\n').map((line, lIdx) => {
                            const trimmed = line.trim();
                            if (!trimmed) return <div key={lIdx} className="h-2" />;
                            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                            const hasBlank = trimmed.includes('__________');

                            const renderLine = (text) => {
                                const parts = text.split(/(\d+\s*__________)/g);
                                return parts.map((part, pIdx) => {
                                    const match = part.match(/(\d+)\s*__________/);
                                    if (match) {
                                        return (
                                            <span key={pIdx} className="inline-flex items-center gap-0.5 mx-0.5">
                                                <span className="bg-gray-100 border border-gray-300 text-gray-700 text-[9px] font-bold px-1 py-0 rounded">{match[1]}</span>
                                                <input type="text" disabled className="w-20 px-1 py-0.5 border border-gray-300 rounded text-[10px] bg-gray-50" />
                                            </span>
                                        );
                                    }
                                    return <span key={pIdx}>{part}</span>;
                                });
                            };

                            if (isBullet) {
                                const bulletText = trimmed.replace(/^[•\-]\s*/, '');
                                return (
                                    <div key={lIdx} className="flex items-start gap-1.5 ml-3 mb-1">
                                        <span className="text-gray-400 text-[10px] mt-0.5">•</span>
                                        <span className="text-[10px] text-gray-700">{renderLine(bulletText)}</span>
                                    </div>
                                );
                            }

                            if (!hasBlank && trimmed.length < 80) {
                                return <h5 key={lIdx} className="text-[10px] font-bold text-gray-800 mt-2 mb-1">{trimmed}</h5>;
                            }

                            return <p key={lIdx} className="text-[10px] text-gray-700 mb-1">{renderLine(trimmed)}</p>;
                        })
                    )}
                </div>
            );
        }

        // True/False/Not Given or Yes/No/Not Given
        if (gType === "true-false-not-given" || gType === "yes-no-not-given" || gType === "true-false-ng") {
            const options = gType === "yes-no-not-given" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.instructions || group.mainInstruction || ""} onChange={e => {
                            if ("instructions" in group) updateGroupField(gIdx, "instructions", e.target.value);
                            else updateGroupField(gIdx, "mainInstruction", e.target.value);
                        }} className="w-full text-[10px] text-gray-600 mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 mb-2">{group.instructions || group.mainInstruction}</p>
                    )}
                    <div className="bg-gray-50 p-2 rounded text-[9px] text-gray-600 mb-3 border-l-2 border-gray-300 space-y-0.5">
                        {options.map(opt => (
                            <p key={opt}><strong>{opt}</strong> — {opt === "TRUE" || opt === "YES" ? "agrees with" : opt === "FALSE" || opt === "NO" ? "contradicts" : "no information"}</p>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {(group.statements || group.questions || []).map((stmt, sIdx) => (
                            <div key={stmt.questionNumber} className="pb-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-start gap-1.5 mb-1">
                                    <span className="bg-gray-100 border border-gray-300 text-[9px] font-bold px-1 rounded">{stmt.questionNumber}</span>
                                    {editMode ? (
                                        <input value={stmt.text || stmt.questionText || ""} onChange={e => updateGroupArrayItem(gIdx, "statements", sIdx, "text", e.target.value)}
                                            className="flex-1 text-[10px] px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                                    ) : (
                                        <p className="text-[10px] text-gray-800">{stmt.text || stmt.questionText}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-5">
                                    {options.map(opt => (
                                        <label key={opt} className="flex items-center gap-1 text-[9px] cursor-pointer">
                                            <input type="radio" disabled name={`prev-${stmt.questionNumber}`} className="accent-blue-600" style={{ width: 10, height: 10 }} />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Matching Information
        if (gType === "matching-information") {
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.mainInstruction || ""} onChange={e => updateGroupField(gIdx, "mainInstruction", e.target.value)}
                            className="w-full text-[10px] text-gray-600 mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 mb-2">{group.mainInstruction}</p>
                    )}
                    <div className="space-y-1.5">
                        {(group.matchingItems || []).map((item, iIdx) => (
                            <div key={item.questionNumber} className="flex items-center gap-1.5">
                                <span className="bg-gray-100 border border-gray-300 text-[9px] font-bold px-1 rounded">{item.questionNumber}</span>
                                {editMode ? (
                                    <input value={item.text || ""} onChange={e => updateGroupArrayItem(gIdx, "matchingItems", iIdx, "text", e.target.value)}
                                        className="flex-1 text-[10px] px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                                ) : (
                                    <span className="text-[10px] text-gray-700 flex-1">{item.text}</span>
                                )}
                                <select disabled className="w-10 text-[9px] border border-gray-300 rounded px-0.5 py-0.5">
                                    <option>--</option>
                                    {(group.paragraphOptions || []).map(opt => <option key={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Summary Completion
        if (gType === "summary-completion") {
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.mainInstruction || ""} onChange={e => updateGroupField(gIdx, "mainInstruction", e.target.value)}
                            className="w-full text-[10px] text-gray-600 mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 mb-2">{group.mainInstruction}</p>
                    )}
                    {group.mainHeading && (editMode ? (
                        <input value={group.mainHeading || ""} onChange={e => updateGroupField(gIdx, "mainHeading", e.target.value)}
                            className="w-full text-xs font-bold text-gray-800 mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <h5 className="text-xs font-bold text-gray-800 mb-2">{group.mainHeading}</h5>
                    ))}
                    {editMode ? (
                        <div className="space-y-1">
                            {(group.summarySegments || []).map((seg, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1">
                                    {seg.type === "text" ? (
                                        <input value={seg.content || ""} onChange={e => {
                                            const segs = [...(group.summarySegments || [])];
                                            segs[sIdx] = { ...segs[sIdx], content: e.target.value };
                                            updateGroupField(gIdx, "summarySegments", segs);
                                        }} className="flex-1 text-[10px] px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" placeholder="Text..." />
                                    ) : (
                                        <span className="text-[9px] text-purple-600 font-bold bg-purple-50 border border-purple-200 rounded px-2 py-0.5">
                                            Blank Q{seg.questionNumber}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[10px] text-gray-700 leading-relaxed">
                            {(group.summarySegments || []).map((seg, sIdx) => (
                                seg.type === "text" ? (
                                    <span key={sIdx}>{seg.content} </span>
                                ) : (
                                    <span key={sIdx} className="inline-flex items-center gap-0.5 mx-0.5">
                                        <span className="bg-gray-100 border border-gray-300 text-[9px] font-bold px-1 rounded">{seg.questionNumber}</span>
                                        <input type="text" disabled className="w-16 px-1 py-0.5 border-b border-gray-400 bg-transparent text-[10px]" />
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Summary with Options
        if (gType === "summary-with-options") {
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.mainInstruction || ""} onChange={e => updateGroupField(gIdx, "mainInstruction", e.target.value)}
                            className="w-full text-[10px] text-gray-600 mb-1 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 mb-1">{group.mainInstruction}</p>
                    )}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 mb-2 bg-gray-50 p-1.5 rounded text-[9px]">
                        {(group.phraseList || []).map((p, pIdx) => (
                            editMode ? (
                                <div key={p.letter} className="flex items-center gap-0.5">
                                    <strong>{p.letter}.</strong>
                                    <input value={p.text || ""} onChange={e => {
                                        const pl = [...(group.phraseList || [])];
                                        pl[pIdx] = { ...pl[pIdx], text: e.target.value };
                                        updateGroupField(gIdx, "phraseList", pl);
                                    }} className="flex-1 text-[9px] px-1 py-0 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                                </div>
                            ) : (
                                <div key={p.letter}><strong>{p.letter}.</strong> {p.text}</div>
                            )
                        ))}
                    </div>
                    {editMode ? (
                        <div className="space-y-1">
                            {(group.summarySegments || []).map((seg, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1">
                                    {seg.type === "text" ? (
                                        <input value={seg.content || ""} onChange={e => {
                                            const segs = [...(group.summarySegments || [])];
                                            segs[sIdx] = { ...segs[sIdx], content: e.target.value };
                                            updateGroupField(gIdx, "summarySegments", segs);
                                        }} className="flex-1 text-[10px] px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" placeholder="Text..." />
                                    ) : (
                                        <span className="text-[9px] text-purple-600 font-bold bg-purple-50 border border-purple-200 rounded px-2 py-0.5">
                                            Blank Q{seg.questionNumber}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[10px] text-gray-700 leading-relaxed">
                            {(group.summarySegments || []).map((seg, sIdx) => (
                                seg.type === "text" ? (
                                    <span key={sIdx}>{seg.content} </span>
                                ) : (
                                    <span key={sIdx} className="inline-flex items-center gap-0.5 mx-0.5">
                                        <span className="bg-gray-100 border border-gray-300 text-[9px] font-bold px-1 rounded">{seg.questionNumber}</span>
                                        <input type="text" disabled className="w-16 px-1 py-0.5 border-b border-gray-400 bg-transparent text-[10px]" />
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Choose Two Letters
        if (gType === "choose-two-letters") {
            return (
                <div key={gIdx} className="border border-gray-200 rounded p-3">
                    <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                        Questions {group.startQuestion}–{group.endQuestion}
                    </h4>
                    {editMode ? (
                        <input value={group.mainInstruction || ""} onChange={e => updateGroupField(gIdx, "mainInstruction", e.target.value)}
                            className="w-full text-[10px] text-gray-600 italic mb-2 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                    ) : (
                        <p className="text-[10px] text-gray-600 italic mb-2">{group.mainInstruction}</p>
                    )}
                    {(group.questionSets || []).map((qSet, qsIdx) => (
                        <div key={qsIdx} className="mb-2">
                            {editMode ? (
                                <input value={qSet.questionText || ""} onChange={e => {
                                    const sets = [...(group.questionSets || [])];
                                    sets[qsIdx] = { ...sets[qsIdx], questionText: e.target.value };
                                    updateGroupField(gIdx, "questionSets", sets);
                                }} className="w-full text-[10px] text-gray-800 font-medium mb-1 px-1 py-0.5 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                            ) : (
                                <p className="text-[10px] text-gray-800 font-medium mb-1">{qSet.questionText}</p>
                            )}
                            <div className="space-y-1 ml-3">
                                {(qSet.options || []).map((opt, oIdx) => (
                                    editMode ? (
                                        <div key={opt.letter} className="flex items-center gap-1">
                                            <input type="checkbox" disabled className="accent-blue-600" style={{ width: 10, height: 10 }} />
                                            <strong className="text-[9px]">{opt.letter}.</strong>
                                            <input value={opt.text || ""} onChange={e => {
                                                const sets = [...(group.questionSets || [])];
                                                const opts = [...(sets[qsIdx].options || [])];
                                                opts[oIdx] = { ...opts[oIdx], text: e.target.value };
                                                sets[qsIdx] = { ...sets[qsIdx], options: opts };
                                                updateGroupField(gIdx, "questionSets", sets);
                                            }} className="flex-1 text-[9px] px-1 py-0 border border-blue-200 rounded outline-none focus:border-blue-400 bg-blue-50/50" />
                                        </div>
                                    ) : (
                                        <label key={opt.letter} className="flex items-center gap-1.5 text-[9px] cursor-pointer">
                                            <input type="checkbox" disabled className="accent-blue-600" style={{ width: 10, height: 10 }} />
                                            <strong>{opt.letter}.</strong> <span>{opt.text}</span>
                                        </label>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Fallback for unknown types
        return (
            <div key={gIdx} className="border border-gray-200 rounded p-3">
                <h4 className="text-[10px] font-bold text-gray-800 mb-1">
                    Questions {group.startQuestion}–{group.endQuestion}
                </h4>
                <p className="text-[10px] text-gray-500 italic">
                    {gType || "Unknown"} type — preview not available
                </p>
            </div>
        );
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col" style={{ minHeight: "600px" }}>
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 flex items-center justify-between px-3 py-1.5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-bold text-xs">IELTS Reading</span>
                    <div className="flex gap-1">
                        {sections.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveSection(idx)}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${activeSection === idx
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                P{idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onUpdateSection && (
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${editMode
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {editMode ? "✏️ Editing" : "✏️ Edit"}
                        </button>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                        <FaClock className="text-[8px]" />
                        <span>{formData.duration || 60}:00</span>
                    </div>
                </div>
            </div>

            {/* Main Split Content */}
            <div className="flex-1 flex overflow-hidden" style={{ maxHeight: "550px" }}>
                {/* Left — Passage */}
                <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
                    <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                        <h3 className="font-semibold text-gray-800 text-xs">{currentSection.title || `Passage ${activeSection + 1}`}</h3>
                        {currentSection.passageSource && (
                            <p className="text-[10px] text-gray-500">{currentSection.passageSource}</p>
                        )}
                    </div>
                    <div className="p-3">
                        {currentSection.passage ? (
                            currentSection.passage.split('\n\n').map((para, index) => (
                                <p key={index} className="text-gray-700 text-[11px] leading-relaxed mb-3">{para}</p>
                            ))
                        ) : (
                            <div className="text-gray-400 text-xs italic text-center py-16">
                                Add passage text to see preview
                            </div>
                        )}

                        {/* Paragraphs if available */}
                        {(currentSection.paragraphs || []).length > 0 && (
                            <div className="mt-4 space-y-3">
                                {currentSection.paragraphs.map((p, i) => (
                                    <div key={i}>
                                        <span className="font-bold text-gray-800 text-[11px]">{p.label} </span>
                                        <span className="text-gray-700 text-[11px] leading-relaxed">{p.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Image */}
                        {currentSection.imageUrl && (
                            <div className="mt-3 border border-gray-200 rounded overflow-hidden">
                                <img src={currentSection.imageUrl} alt="Section" className="w-full object-contain max-h-48" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Questions */}
                <div className="w-1/2 overflow-y-auto bg-white">
                    {/* If questionGroups exist, render them */}
                    {(currentSection.questionGroups || []).length > 0 ? (
                        <>
                            <div className="bg-blue-50 border-b border-blue-100 px-3 py-2 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 text-xs">
                                    Questions {currentSection.questionGroups[0]?.startQuestion}–{currentSection.questionGroups[currentSection.questionGroups.length - 1]?.endQuestion}
                                </h3>
                                {editMode && <span className="text-[9px] text-blue-600 font-medium">✏️ Edit mode ON — click fields to edit</span>}
                            </div>
                            <div className="p-3 space-y-5">
                                {currentSection.questionGroups.map((group, gIdx) => renderGroupPreview(group, gIdx))}
                            </div>
                        </>
                    ) : currentSection.questions.length > 0 ? (
                        /* Fallback: render individual questions when no questionGroups */
                        <>
                            <div className="bg-blue-50 border-b border-blue-100 px-3 py-2">
                                <h3 className="font-semibold text-gray-800 text-xs">
                                    Questions {qsBefore + 1}–{qsEnd}
                                </h3>
                            </div>
                            <div className="p-3 space-y-4">
                                {currentSection.questions.map((q, qIdx) => {
                                    const typeLabel = QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType;
                                    const prevType = qIdx > 0 ? currentSection.questions[qIdx - 1].questionType : null;
                                    const showTypeHeader = q.questionType !== prevType;

                                    return (
                                        <div key={qIdx}>
                                            {showTypeHeader && (
                                                <div className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2 uppercase">
                                                    {typeLabel}
                                                </div>
                                            )}
                                            <div className="mb-3">
                                                <div className="flex gap-2">
                                                    <span className="text-[11px] font-bold text-gray-500 mt-0.5">{q.questionNumber}.</span>
                                                    <div className="flex-1">
                                                        <p className="text-[11px] text-gray-800">{q.questionText || '...'}</p>
                                                        {renderQuestionInput(q)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs italic">
                            Add question groups or answers to see preview
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-500">
                    {questionsCount} total questions · {sections.length} passages
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                        className="px-2 py-0.5 text-[10px] border rounded disabled:opacity-30 cursor-pointer"
                    >
                        ← Prev
                    </button>
                    <button
                        onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                        disabled={activeSection >= sections.length - 1}
                        className="px-2 py-0.5 text-[10px] border rounded disabled:opacity-30 cursor-pointer"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========
export default function CreateReadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        testType: "academic",
        source: "",
        difficulty: "medium",
        duration: 60,
    });

    // Sections state — 3 sections for IELTS Reading
    const [sections, setSections] = useState([
        emptySection(1),
        emptySection(2),
        emptySection(3),
    ]);

    const [imageUploading, setImageUploading] = useState({});

    // JSON import/export for full test
    const [showFullJson, setShowFullJson] = useState(false);
    const [fullJsonText, setFullJsonText] = useState("");
    const [fullJsonError, setFullJsonError] = useState("");
    const [copied, setCopied] = useState(false);

    // AI Chatbot state
    const [showAiChat, setShowAiChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', text: '🤖 Hi! I\'m your IELTS Reading Test AI Assistant.\n\nI can help you:\n• 📸 Upload a test paper image/PDF and I\'ll extract everything\n• ✍️ Generate questions from your instructions\n• 🔧 Modify or fix extracted content\n\nUpload an image or type your instructions to get started!', data: null }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatFile, setChatFile] = useState(null);
    const [chatFilePreview, setChatFilePreview] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [lastExtractedData, setLastExtractedData] = useState(null);

    // Fetch data for edit mode
    useEffect(() => {
        if (!editId) return;

        const fetchData = async () => {
            setFetchLoading(true);
            try {
                const response = await readingAPI.getById(editId, true);
                if (response.success && response.data) {
                    const data = response.data;
                    setIsEditMode(true);

                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        testType: data.testType || "academic",
                        source: data.source || "",
                        difficulty: data.difficulty || "medium",
                        duration: data.duration || 60,
                    });

                    if (data.sections && data.sections.length > 0) {
                        setSections(data.sections.map((s, i) => ({
                            sectionNumber: s.sectionNumber || i + 1,
                            title: s.title || "",
                            passage: s.passage || "",
                            passageSource: s.passageSource || "",
                            paragraphs: s.paragraphs || [],
                            instructions: s.instructions || "",
                            imageUrl: s.imageUrl || "",
                            questions: s.questions || [],
                            questionGroups: s.questionGroups || [],
                        })));
                    }
                }
            } catch (err) {
                setError("Failed to fetch reading test data");
                console.error(err);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchData();
    }, [editId]);

    const updateSection = (idx, updated) => {
        setSections(prev => prev.map((s, i) => i === idx ? updated : s));
    };

    // Full JSON export
    const handleFullJsonExport = () => {
        const fullData = { ...formData, sections };
        setFullJsonText(JSON.stringify(fullData, null, 2));
        setShowFullJson(true);
    };

    // Full JSON import
    const handleFullJsonImport = () => {
        try {
            const parsed = JSON.parse(fullJsonText);
            if (parsed.title !== undefined) setFormData(prev => ({ ...prev, title: parsed.title }));
            if (parsed.description !== undefined) setFormData(prev => ({ ...prev, description: parsed.description }));
            if (parsed.testType) setFormData(prev => ({ ...prev, testType: parsed.testType }));
            if (parsed.source !== undefined) setFormData(prev => ({ ...prev, source: parsed.source }));
            if (parsed.difficulty) setFormData(prev => ({ ...prev, difficulty: parsed.difficulty }));
            if (parsed.duration) setFormData(prev => ({ ...prev, duration: parsed.duration }));
            if (parsed.sections && Array.isArray(parsed.sections)) {
                setSections(parsed.sections.map((s, i) => ({
                    sectionNumber: s.sectionNumber || i + 1,
                    title: s.title || "",
                    passage: s.passage || "",
                    passageSource: s.passageSource || "",
                    paragraphs: s.paragraphs || [],
                    instructions: s.instructions || "",
                    imageUrl: s.imageUrl || "",
                    questions: s.questions || [],
                    questionGroups: s.questionGroups || [],
                })));
            }
            setShowFullJson(false);
            setFullJsonError("");
            setSuccess("JSON imported successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setFullJsonError(err.message);
        }
    };

    // Copy JSON
    const handleCopyJson = () => {
        navigator.clipboard.writeText(fullJsonText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // AI Chat — send message
    const handleChatSend = async () => {
        const msg = chatInput.trim();
        const file = chatFile;
        if (!msg && !file) return;

        // Add user message to chat
        const userMsg = {
            role: 'user',
            text: msg || (file ? `📎 Uploaded: ${file.name}` : ''),
            fileName: file?.name || null,
            filePreview: chatFilePreview,
        };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatFile(null);
        setChatFilePreview(null);
        setChatLoading(true);

        try {
            const fd = new FormData();
            if (msg) fd.append('message', msg);
            if (file) fd.append('file', file);
            // Send history (text only, last 10)
            const historyForApi = chatMessages
                .filter(m => m.text)
                .slice(-10)
                .map(m => ({ role: m.role, text: m.text.substring(0, 500) }));
            fd.append('history', JSON.stringify(historyForApi));

            const response = await fetch('/api/extract-questions', {
                method: 'POST',
                body: fd,
            });
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'AI request failed');
            }

            // If server couldn't parse JSON, try client-side extraction
            let extractedData = result.data || null;
            if (!extractedData && result.rawAiText) {
                try {
                    // Try multiple extraction methods
                    const rawText = result.rawAiText;

                    // Method 1: Find JSON between markers
                    const markerMatch = rawText.match(/%%%JSON_START%%%([\s\S]*?)%%%JSON_END%%%/);
                    if (markerMatch) {
                        extractedData = JSON.parse(markerMatch[1].trim());
                    }

                    // Method 2: Find JSON in code blocks
                    if (!extractedData) {
                        const codeblockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
                        if (codeblockMatch) {
                            const parsed = JSON.parse(codeblockMatch[1].trim());
                            if (parsed.sections || parsed.title) extractedData = parsed;
                        }
                    }

                    // Method 3: Find raw JSON object
                    if (!extractedData) {
                        const start = rawText.indexOf('{"');
                        if (start !== -1) {
                            let depth = 0;
                            let end = start;
                            for (let j = start; j < rawText.length; j++) {
                                if (rawText[j] === '{') depth++;
                                if (rawText[j] === '}') depth--;
                                if (depth === 0) { end = j; break; }
                            }
                            if (end > start) {
                                const parsed = JSON.parse(rawText.substring(start, end + 1));
                                if (parsed.sections || parsed.title) extractedData = parsed;
                            }
                        }
                    }
                } catch (parseErr) {
                    console.log('Client-side JSON extraction also failed:', parseErr.message);
                }
            }

            const aiMsg = {
                role: 'assistant',
                text: result.message || 'Done!',
                data: extractedData,
            };
            setChatMessages(prev => [...prev, aiMsg]);

            if (extractedData) {
                setLastExtractedData(extractedData);
            }
        } catch (err) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                text: `❌ Error: ${err.message}`,
                data: null,
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Apply extracted data to form
    const applyAiDataToForm = (data) => {
        if (!data) return;

        if (data.title) {
            setFormData(prev => ({ ...prev, title: data.title }));
        }

        if (data.sections && Array.isArray(data.sections)) {
            const newSections = data.sections.map((s, i) => ({
                sectionNumber: i + 1,
                title: s.title || `Section ${i + 1}`,
                passage: s.passage || '',
                passageSource: s.passageSource || '',
                paragraphs: s.paragraphs || [],
                instructions: s.instructions || '',
                imageUrl: s.imageUrl || '',
                questions: (s.questions || []).map(q => ({
                    questionNumber: q.questionNumber || 1,
                    questionType: q.questionType || 'multiple-choice',
                    questionText: q.questionText || '',
                    options: q.options || [],
                    correctAnswer: q.correctAnswer || '',
                    acceptableAnswers: q.acceptableAnswers || [],
                    wordLimit: q.wordLimit || null,
                    marks: q.marks || 1,
                    instruction: q.instruction || '',
                    explanation: q.explanation || '',
                })),
                questionGroups: (s.questionGroups || []).map(qg => ({
                    ...qg,
                    questionType: qg.questionType || qg.groupType || 'note-completion',
                    groupType: qg.groupType || qg.questionType || 'note-completion',
                })),
            }));

            while (newSections.length < 3) {
                newSections.push(emptySection(newSections.length + 1));
            }
            setSections(newSections);
        }

        setShowAiChat(false);
    };

    // Handle file selection in chat
    const handleChatFileSelect = (file) => {
        if (!file) return;
        setChatFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setChatFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setChatFilePreview(null);
        }
    };

    // Submit
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError("Title is required");
            return;
        }

        // Check sections have passages
        for (let i = 0; i < sections.length; i++) {
            if (!sections[i].title.trim()) {
                setError(`Section ${i + 1} title is required`);
                return;
            }
            if (!sections[i].passage.trim()) {
                setError(`Section ${i + 1} passage is required`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const payload = {
                ...formData,
                sections: sections.filter(s => s.title.trim() || s.passage.trim()),
            };

            let response;
            if (isEditMode && editId) {
                response = await readingAPI.update(editId, payload);
            } else {
                response = await readingAPI.create(payload);
            }

            if (response.success) {
                setSuccess(isEditMode ? "Reading test updated!" : "Reading test created!");
                setTimeout(() => {
                    router.push("/dashboard/admin/reading");
                }, 1500);
            } else {
                setError(response.message || "Failed to save");
            }
        } catch (err) {
            setError(err.message || "Failed to save reading test");
        } finally {
            setLoading(false);
        }
    };

    // Count totals
    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-blue-500" />
            </div>
        );
    }

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/reading"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaBook className="text-blue-600" />
                            {isEditMode ? "Edit Reading Test" : "Create Reading Test"}
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {totalQuestions} questions across {sections.length} sections
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleFullJsonExport}
                        className="px-3 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <FaCode /> JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {isEditMode ? "Update" : "Save"} Reading Test
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="max-w-[1600px] mx-auto">
                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center justify-between">
                        <span className="text-sm">{error}</span>
                        <button onClick={() => setError("")} className="cursor-pointer"><FaTimes /></button>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md mb-4 flex items-center gap-2">
                        <FaCheck /> <span className="text-sm">{success}</span>
                    </div>
                )}
            </div>

            {/* Full JSON Editor */}
            {showFullJson && (
                <div className="max-w-[1600px] mx-auto border border-blue-200 rounded-md bg-blue-50 p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Full Test JSON</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={handleCopyJson} className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                            </button>
                            <button type="button" onClick={() => setShowFullJson(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes /></button>
                        </div>
                    </div>
                    <textarea
                        value={fullJsonText}
                        onChange={(e) => setFullJsonText(e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono outline-none focus:border-blue-500 resize-y"
                    />
                    {fullJsonError && <p className="text-xs text-red-600 mt-1">{fullJsonError}</p>}
                    <button type="button" onClick={handleFullJsonImport} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-medium cursor-pointer hover:bg-blue-700">
                        Import JSON
                    </button>
                </div>
            )}

            {/* Two Column Layout: Form (Left) + Preview (Right) */}
            <div className="flex gap-6 max-w-[1600px] mx-auto">
                {/* LEFT — Form Editor */}
                <div className="flex-1 min-w-0">
                    {/* Basic Info */}
                    <div className="bg-white border border-gray-200 rounded-md p-5 mb-6">
                        <h2 className="text-sm font-bold text-gray-700 mb-4">Test Information</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Title *</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                    placeholder="e.g. IELTS Academic Reading Test 1"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Test Type</label>
                                <select
                                    value={formData.testType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, testType: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="academic">Academic</option>
                                    <option value="general-training">General Training</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                                <input
                                    value={formData.source}
                                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                                    placeholder="e.g. Cambridge IELTS 17"
                                />
                            </div>
                        </div>
                    </div>

                    {/* AI Chatbot Trigger */}
                    <button
                        type="button"
                        onClick={() => setShowAiChat(true)}
                        className="w-full mb-6 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 text-white rounded-lg p-4 flex items-center gap-3 hover:from-violet-600 hover:via-blue-600 hover:to-indigo-600 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 relative z-10">
                            <FaRobot className="text-lg" />
                        </div>
                        <div className="text-left relative z-10">
                            <span className="font-bold text-sm block">🤖 AI Question Generator</span>
                            <span className="text-[11px] text-white/80">Upload images, give instructions — AI will create the entire test for you</span>
                        </div>
                        <div className="ml-auto text-white/60 group-hover:text-white/90 transition-colors relative z-10">
                            <FaMagic className="text-lg" />
                        </div>
                    </button>

                    {/* AI Chat Modal */}
                    {showAiChat && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAiChat(false)}>
                            <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                                {/* Chat Header */}
                                <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <FaRobot className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm">AI Question Generator</h3>
                                            <p className="text-white/70 text-[10px]">Upload photos & give instructions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {lastExtractedData && (
                                            <button
                                                type="button"
                                                onClick={() => applyAiDataToForm(lastExtractedData)}
                                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                                            >
                                                <FaCheck /> Apply to Form
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAiChat(false)}
                                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white cursor-pointer transition-colors"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" id="chat-messages-container">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-md shadow-sm'
                                                } px-4 py-3`}>
                                                {/* Image preview in user message */}
                                                {msg.filePreview && (
                                                    <div className="mb-2 rounded-lg overflow-hidden">
                                                        <img src={msg.filePreview} alt="Upload" className="max-h-40 rounded-lg" />
                                                    </div>
                                                )}
                                                {msg.fileName && !msg.filePreview && (
                                                    <div className={`mb-2 text-[10px] flex items-center gap-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        <FaFilePdf /> {msg.fileName}
                                                    </div>
                                                )}
                                                {/* Message text */}
                                                <div className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                                {/* Data extracted — detailed preview */}
                                                {msg.data && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            {/* Header */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                                                                    <FaMagic /> ✅ Data Extracted Successfully
                                                                </span>
                                                                <span className="text-[10px] text-green-600 font-medium">
                                                                    {msg.data.sections?.reduce((t, s) => t + (s.questions?.length || 0), 0) || 0} questions
                                                                </span>
                                                            </div>

                                                            {/* Title */}
                                                            {msg.data.title && (
                                                                <div className="text-[11px] text-green-800 font-medium mb-2 bg-green-100 rounded px-2 py-1">
                                                                    📝 {msg.data.title}
                                                                </div>
                                                            )}

                                                            {/* Sections breakdown */}
                                                            {msg.data.sections?.map((sec, si) => (
                                                                <div key={si} className="mb-2 last:mb-0">
                                                                    <div className="text-[11px] font-semibold text-green-800 flex items-center gap-1">
                                                                        <span className="w-4 h-4 bg-green-600 text-white rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0">{si + 1}</span>
                                                                        {sec.title || `Section ${si + 1}`}
                                                                    </div>
                                                                    <div className="ml-5 mt-1 space-y-0.5">
                                                                        {sec.passage && (
                                                                            <div className="text-[10px] text-green-600">📖 Passage: {sec.passage.length > 100 ? `${sec.passage.substring(0, 100)}...` : sec.passage} ({sec.passage.length} chars)</div>
                                                                        )}
                                                                        {sec.questionGroups?.map((qg, qi) => (
                                                                            <div key={qi} className="text-[10px] text-green-700 bg-green-100/80 rounded px-1.5 py-0.5 inline-block mr-1 mb-0.5">
                                                                                Q{qg.startQuestion}-{qg.endQuestion}: <span className="font-medium">{qg.groupType || qg.questionType || 'unknown'}</span>
                                                                            </div>
                                                                        ))}
                                                                        {(!sec.questionGroups || sec.questionGroups.length === 0) && sec.questions?.length > 0 && (
                                                                            <div className="text-[10px] text-green-700">
                                                                                📋 {sec.questions.length} questions (types: {[...new Set(sec.questions.map(q => q.questionType))].join(', ')})
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Action buttons */}
                                                            <div className="flex gap-2 mt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => applyAiDataToForm(msg.data)}
                                                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                                                >
                                                                    <FaCheck /> Apply to Form
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(msg.data, null, 2))}
                                                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                                                                >
                                                                    <FaCopy /> Copy JSON
                                                                </button>
                                                            </div>

                                                            {/* Collapsible JSON preview */}
                                                            <details className="mt-2">
                                                                <summary className="text-[10px] text-green-600 cursor-pointer hover:text-green-800 select-none">
                                                                    🔍 View Raw JSON
                                                                </summary>
                                                                <pre className="mt-1 text-[9px] bg-gray-900 text-green-400 p-2 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                                                                    {JSON.stringify(msg.data, null, 2)}
                                                                </pre>
                                                            </details>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Typing indicator */}
                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    <span className="text-xs text-gray-400 ml-2">AI is thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={el => { if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
                                </div>

                                {/* File Preview Bar */}
                                {chatFile && (
                                    <div className="px-4 py-2 bg-violet-50 border-t border-violet-200 flex items-center gap-3">
                                        {chatFilePreview ? (
                                            <img src={chatFilePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                                <FaFilePdf className="text-red-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-700 truncate">{chatFile.name}</p>
                                            <p className="text-[10px] text-gray-400">{(chatFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                        </div>
                                        <button
                                            onClick={() => { setChatFile(null); setChatFilePreview(null); }}
                                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}

                                {/* Chat Input */}
                                <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-end gap-2 flex-shrink-0">
                                    {/* File upload button */}
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('chat-file-input')?.click()}
                                        className="w-9 h-9 bg-gray-100 hover:bg-violet-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-violet-600 cursor-pointer transition-colors flex-shrink-0"
                                        title="Upload image or PDF"
                                    >
                                        <FaCloudUploadAlt />
                                    </button>
                                    <input
                                        id="chat-file-input"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleChatFileSelect(file);
                                            e.target.value = '';
                                        }}
                                    />
                                    {/* Text input */}
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleChatSend();
                                                }
                                            }}
                                            placeholder="Type your instructions... (e.g. 'Extract questions from this image' or 'Generate 10 True/False questions')"
                                            rows={1}
                                            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-gray-50 focus:ring-2 focus:ring-violet-300 resize-none"
                                            disabled={chatLoading}
                                        />
                                    </div>
                                    {/* Send button */}
                                    <button
                                        type="button"
                                        onClick={handleChatSend}
                                        disabled={chatLoading || (!chatInput.trim() && !chatFile)}
                                        className="w-9 h-9 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                                    >
                                        {chatLoading ? <FaSpinner className="animate-spin text-sm" /> : <span className="text-sm">➤</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sections */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-700">Sections (Passages)</h2>
                            <button
                                type="button"
                                onClick={() => setSections(prev => [...prev, emptySection(prev.length + 1)])}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <FaPlus className="text-[10px]" /> Add Section
                            </button>
                        </div>
                        {sections.map((section, idx) => (
                            <SectionEditor
                                key={idx}
                                section={section}
                                sectionIndex={idx}
                                onChange={updateSection}
                                imageUploading={imageUploading}
                                setImageUploading={setImageUploading}
                            />
                        ))}
                    </div>

                    {/* Bottom Save */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-5 py-4">
                        <div className="text-sm text-gray-500">
                            {sections.length} sections · {totalQuestions} questions
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {isEditMode ? "Update" : "Save"} Reading Test
                        </button>
                    </div>
                </div>

                {/* RIGHT — Live Preview (sticky) */}
                <div className="w-[520px] flex-shrink-0">
                    <div className="sticky top-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaEye className="text-blue-600" /> Live Preview
                            </h2>
                            <span className="text-[10px] text-gray-400">Student View</span>
                        </div>
                        <LivePreview
                            formData={formData}
                            sections={sections}
                            onUpdateSection={(sIdx, field, value) => {
                                const updated = { ...sections[sIdx], [field]: value };
                                updateSection(sIdx, updated);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
