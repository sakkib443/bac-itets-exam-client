"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaArrowLeft, FaSpinner, FaSave, FaHeadphones, FaTimes, FaCheck,
    FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaEye, FaEyeSlash,
    FaCode, FaCopy, FaVolumeUp, FaGripVertical, FaImage, FaUpload,
} from "react-icons/fa";
import { listeningAPI, uploadImage, uploadAudio } from "@/lib/api";
import ListeningPreview from "@/components/listening/ListeningPreview";

// ═══════════════════════════════════════════════════════
// Audio Upload Button (reusable)
// ═══════════════════════════════════════════════════════
function AudioUploadBtn({ onUploaded }) {
    const [uploading, setUploading] = React.useState(false);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadAudio(file);
            if (res?.data?.url) {
                onUploaded(res.data.url);
            }
        } catch (err) {
            alert("Audio upload failed: " + (err.message || "Unknown error"));
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap">
            {uploading ? <FaSpinner className="animate-spin" size={11} /> : <FaUpload size={11} />}
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="audio/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
    );
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
const QUESTION_TYPES = [
    { value: "note-completion", label: "Note Completion" },
    { value: "form-completion", label: "Form Completion" },
    { value: "table-completion", label: "Table Completion" },
    { value: "multiple-choice", label: "Multiple Choice (A/B/C)" },
    { value: "multiple-choice-multi", label: "Multiple Choice (Multi-Select)" },
    { value: "matching", label: "Matching" },
    { value: "matching-features", label: "Matching Features" },
    { value: "map-labeling", label: "Map/Plan Labelling" },
    { value: "diagram-labeling", label: "Diagram Labelling" },
    { value: "short-answer", label: "Short Answer" },
    { value: "sentence-completion", label: "Sentence Completion" },
    { value: "summary-completion", label: "Summary Completion" },
    { value: "flow-chart-completion", label: "Flow Chart Completion" },
];

function emptySection(num) {
    return {
        sectionNumber: num,
        title: `Part ${num}`,
        context: "",
        instructions: `Questions ${(num - 1) * 10 + 1}–${num * 10}`,
        audioUrl: "",
        questions: [],
    };
}

function emptyInstruction() {
    return { blockType: "instruction", content: "" };
}

function emptyQuestion(num) {
    return {
        blockType: "question",
        questionNumber: num,
        questionType: "note-completion",
        questionText: "",
        correctAnswer: "",
        options: [],
        marks: 1,
        wordLimit: 1,
    };
}

// ═══════════════════════════════════════════════════════
// QUESTION BLOCK EDITOR
// ═══════════════════════════════════════════════════════
function QuestionBlock({ block, index, onChange, onDelete, questionNumber }) {
    if (block.blockType === "instruction") {
        return (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                        📋 Instruction Block
                    </span>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <FaTrash size={11} />
                    </button>
                </div>
                <textarea
                    value={block.content}
                    onChange={e => onChange({ ...block, content: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-2 border border-amber-200 rounded text-xs font-mono outline-none focus:border-amber-400 resize-y bg-white"
                    placeholder="Instruction text (HTML supported)..."
                />
                <p className="text-[10px] text-amber-600 mt-1">HTML supported: &lt;strong&gt;, &lt;br/&gt;, &lt;ul&gt;&lt;li&gt;, &lt;table&gt;...</p>
            </div>
        );
    }

    // Question block
    const isMultipleChoice = ["multiple-choice", "multiple-choice-multi", "matching", "matching-features", "map-labeling", "diagram-labeling"].includes(block.questionType);
    const isMapDiagram = ["map-labeling", "diagram-labeling"].includes(block.questionType);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadImage(file);
            if (result.success && result.data?.url) {
                onChange({ ...block, imageUrl: result.data.url });
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            alert("Image upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border border-indigo-100 bg-white rounded-lg p-3">
            {/* Image Upload for Map/Diagram types */}
            {isMapDiagram && (
                <div className="mb-3 p-3 border border-dashed border-blue-300 bg-blue-50 rounded-lg">
                    <label className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                        <FaImage size={11} /> Map / Diagram Image
                    </label>
                    {block.imageUrl ? (
                        <div className="relative">
                            <img src={block.imageUrl} alt="Map/Diagram" className="max-h-48 rounded border border-gray-200 mb-2" />
                            <div className="flex items-center gap-2">
                                <input
                                    value={block.imageUrl}
                                    onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none font-mono bg-white"
                                    placeholder="Image URL"
                                />
                                <button
                                    onClick={() => onChange({ ...block, imageUrl: '' })}
                                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                    <FaTimes size={10} /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                                {uploading ? <FaSpinner className="animate-spin" size={10} /> : <FaUpload size={10} />}
                                {uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                            </label>
                            <span className="text-[10px] text-gray-400">or paste URL below</span>
                            <input
                                value={block.imageUrl || ''}
                                onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none font-mono"
                                placeholder="https://..."
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded text-xs font-bold flex items-center justify-center">
                        {block.questionNumber}
                    </span>
                    <select
                        value={block.questionType}
                        onChange={e => onChange({ ...block, questionType: e.target.value, options: [] })}
                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400 bg-white cursor-pointer"
                    >
                        {QUESTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500">Marks</label>
                    <input
                        type="number" min={1} max={2}
                        value={block.marks || 1}
                        onChange={e => onChange({ ...block, marks: parseInt(e.target.value) || 1 })}
                        className="w-12 text-xs border border-gray-200 rounded px-1.5 py-1 outline-none text-center"
                    />
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <FaTrash size={11} />
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <textarea
                value={block.questionText}
                onChange={e => onChange({ ...block, questionText: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-2 border border-gray-200 rounded text-sm outline-none focus:border-indigo-400 resize-none mb-2"
                placeholder='Question text, e.g. "Name of agent: Becky ________"'
            />

            {/* Options for MCQ */}
            {isMultipleChoice && (
                <div className="space-y-1.5 mb-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Options</label>
                    {(block.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-4">{String.fromCharCode(65 + oIdx)}.</span>
                            <input
                                value={opt.replace(/^[A-Z]\.\s*/, "")}
                                onChange={e => {
                                    const newOpts = [...(block.options || [])];
                                    newOpts[oIdx] = `${String.fromCharCode(65 + oIdx)}. ${e.target.value}`;
                                    onChange({ ...block, options: newOpts });
                                }}
                                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            />
                            <button
                                onClick={() => {
                                    const newOpts = block.options.filter((_, i) => i !== oIdx);
                                    onChange({ ...block, options: newOpts });
                                }}
                                className="text-gray-300 hover:text-red-400 cursor-pointer"
                            >
                                <FaTimes size={9} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const nextLetter = String.fromCharCode(65 + (block.options || []).length);
                            onChange({ ...block, options: [...(block.options || []), `${nextLetter}. `] });
                        }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer"
                    >
                        + Add Option
                    </button>
                </div>
            )}

            {/* Correct Answer */}
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-gray-500 w-20 shrink-0">Answer</label>
                <input
                    value={block.correctAnswer}
                    onChange={e => onChange({ ...block, correctAnswer: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 border border-green-200 rounded text-sm outline-none focus:border-green-400 bg-green-50 text-green-800"
                    placeholder={isMultipleChoice ? "A / B / C" : "Correct answer..."}
                />
                {!isMultipleChoice && (
                    <>
                        <label className="text-[10px] text-gray-400 shrink-0">Words</label>
                        <input
                            type="number" min={1} max={5}
                            value={block.wordLimit || 1}
                            onChange={e => onChange({ ...block, wordLimit: parseInt(e.target.value) || 1 })}
                            className="w-12 text-xs border border-gray-200 rounded px-1 py-1.5 outline-none text-center"
                        />
                    </>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// SECTION PANEL
// ═══════════════════════════════════════════════════════
function SectionPanel({ section, onChange }) {
    const [collapsed, setCollapsed] = useState(false);

    const questions = section.questions || [];
    const qCount = questions.filter(b => b.blockType === "question").length;

    const getNextQNum = () => {
        const nums = questions.filter(b => b.blockType === "question").map(b => b.questionNumber || 0);
        return nums.length > 0 ? Math.max(...nums) + 1 : (section.sectionNumber - 1) * 10 + 1;
    };

    const addInstruction = () => {
        onChange({ ...section, questions: [...questions, emptyInstruction()] });
    };

    const addQuestion = () => {
        onChange({ ...section, questions: [...questions, emptyQuestion(getNextQNum())] });
    };

    const updateBlock = (idx, updated) => {
        const newQ = questions.map((b, i) => i === idx ? updated : b);
        onChange({ ...section, questions: newQ });
    };

    const deleteBlock = (idx) => {
        onChange({ ...section, questions: questions.filter((_, i) => i !== idx) });
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Part Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center justify-center">
                        {section.sectionNumber}
                    </span>
                    <div>
                        <span className="font-semibold text-gray-800 text-sm">{section.title || `Part ${section.sectionNumber}`}</span>
                        <span className="ml-2 text-xs text-gray-400">{qCount} questions</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {section.audioUrl && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaVolumeUp size={9} /> Audio set
                        </span>
                    )}
                    {collapsed ? <FaChevronDown className="text-gray-400" size={12} /> : <FaChevronUp className="text-gray-400" size={12} />}
                </div>
            </div>

            {!collapsed && (
                <div className="p-4 space-y-4">
                    {/* Part meta */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Part Title</label>
                            <input
                                value={section.title}
                                onChange={e => onChange({ ...section, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                placeholder="e.g. Part 1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Instructions Header</label>
                            <input
                                value={section.instructions}
                                onChange={e => onChange({ ...section, instructions: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                placeholder="e.g. Questions 1–10"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Context / Situation</label>
                            <input
                                value={section.context}
                                onChange={e => onChange({ ...section, context: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                placeholder="e.g. A conversation between two people about a recruitment agency."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-2">
                                <FaVolumeUp className="text-indigo-500" size={11} />
                                Part Audio (optional)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    value={section.audioUrl}
                                    onChange={e => onChange({ ...section, audioUrl: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 font-mono"
                                    placeholder="https://... or upload →"
                                />
                                <AudioUploadBtn
                                    onUploaded={(url) => onChange({ ...section, audioUrl: url })}
                                />
                                {section.audioUrl && (
                                    <button type="button" onClick={() => onChange({ ...section, audioUrl: '' })}
                                        className="text-red-400 hover:text-red-600 cursor-pointer p-1">
                                        <FaTimes size={12} />
                                    </button>
                                )}
                            </div>
                            {section.audioUrl && (
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-green-600">
                                    <FaCheck size={8} /> Audio set
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Questions list */}
                    <div className="space-y-2">
                        {questions.map((block, idx) => (
                            <QuestionBlock
                                key={idx}
                                block={block}
                                index={idx}
                                onChange={updated => updateBlock(idx, updated)}
                                onDelete={() => deleteBlock(idx)}
                                questionNumber={block.questionNumber}
                            />
                        ))}
                    </div>

                    {/* Add buttons */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={addInstruction}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                            <FaPlus size={10} /> Add Instruction
                        </button>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                            <FaPlus size={10} /> Add Question (Q{getNextQNum()})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
function CreateListeningPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPreview, setShowPreview] = useState(true);
    const [showJson, setShowJson] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [copied, setCopied] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        source: "",
        difficulty: "medium",
        duration: 40,
        mainAudioUrl: "",
        audioDuration: 0,
    });

    // 4 sections for IELTS Listening
    const [sections, setSections] = useState([
        emptySection(1), emptySection(2), emptySection(3), emptySection(4),
    ]);

    // ═══ Fetch data for edit mode ═══
    useEffect(() => {
        if (!editId) return;
        const fetchData = async () => {
            setFetchLoading(true);
            try {
                const response = await listeningAPI.getById(editId, true);
                if (response.success && response.data) {
                    const data = response.data;
                    setIsEditMode(true);
                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        source: data.source || "",
                        difficulty: data.difficulty || "medium",
                        duration: data.duration || 40,
                        mainAudioUrl: data.mainAudioUrl || "",
                        audioDuration: data.audioDuration || 0,
                    });
                    if (data.sections && data.sections.length > 0) {
                        setSections(data.sections.map((s, i) => ({
                            sectionNumber: s.sectionNumber || i + 1,
                            title: s.title || `Part ${i + 1}`,
                            context: s.context || "",
                            instructions: s.instructions || "",
                            audioUrl: s.audioUrl || "",
                            questions: s.questions || [],
                        })));
                    }
                }
            } catch (err) {
                setError("Failed to fetch listening test data");
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

    // ═══ JSON Export / Import ═══
    const handleJsonExport = () => {
        setJsonText(JSON.stringify({ ...formData, sections }, null, 2));
        setShowJson(true);
        setJsonError("");
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (parsed.title !== undefined) setFormData(prev => ({ ...prev, ...parsed, sections: undefined }));
            if (parsed.sections && Array.isArray(parsed.sections)) {
                setSections(parsed.sections.map((s, i) => ({
                    sectionNumber: s.sectionNumber || i + 1,
                    title: s.title || `Part ${i + 1}`,
                    context: s.context || "",
                    instructions: s.instructions || "",
                    audioUrl: s.audioUrl || "",
                    questions: s.questions || [],
                })));
            }
            setShowJson(false);
            setJsonError("");
            setSuccess("JSON imported!");
            setTimeout(() => setSuccess(""), 2000);
        } catch (err) {
            setJsonError(err.message);
        }
    };

    // ═══ Submit ═══
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError("Title is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Count total questions
            const totalQuestions = sections.reduce((sum, s) =>
                sum + (s.questions || []).filter(b => b.blockType === "question").length, 0
            );

            const payload = {
                ...formData,
                totalQuestions,
                totalMarks: totalQuestions,
                sections: sections.map(s => ({
                    ...s,
                    questions: s.questions || [],
                })),
            };

            let response;
            if (isEditMode && editId) {
                response = await listeningAPI.update(editId, payload);
            } else {
                response = await listeningAPI.create(payload);
            }

            if (response.success) {
                setSuccess(isEditMode ? "Listening test updated!" : "Listening test created!");
                setTimeout(() => router.push("/dashboard/admin/listening"), 1500);
            } else {
                setError(response.message || "Failed to save");
            }
        } catch (err) {
            setError(err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const totalQuestions = sections.reduce((sum, s) =>
        sum + (s.questions || []).filter(b => b.blockType === "question").length, 0
    );

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-indigo-500" />
            </div>
        );
    }

    return (
        <div className={`pb-10 mx-auto ${showPreview ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/admin/listening" className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaHeadphones className="text-indigo-600" />
                            {isEditMode ? "Edit Listening Test" : "Create Listening Test"}
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {totalQuestions} questions across 4 parts
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button" onClick={() => setShowPreview(!showPreview)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${showPreview
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {showPreview ? <FaEyeSlash size={11} /> : <FaEye size={11} />} Preview
                    </button>
                    <button
                        type="button" onClick={handleJsonExport}
                        className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <FaCode size={11} /> JSON
                    </button>
                    <button
                        type="button" onClick={handleSubmit} disabled={loading}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                        {loading ? <FaSpinner className="animate-spin" size={13} /> : <FaSave size={13} />}
                        {isEditMode ? "Update" : "Save"} Test
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between text-sm">
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="cursor-pointer"><FaTimes /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                    <FaCheck /> <span>{success}</span>
                </div>
            )}

            {/* JSON Panel */}
            {showJson && (
                <div className="border border-indigo-200 rounded-xl bg-indigo-50 p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-indigo-700">📋 Full Test JSON</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(jsonText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                            </button>
                            <button onClick={() => setShowJson(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes /></button>
                        </div>
                    </div>
                    <textarea
                        value={jsonText} onChange={e => setJsonText(e.target.value)}
                        rows={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:border-indigo-500 resize-y bg-gray-900 text-green-400"
                    />
                    {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
                    <button
                        type="button" onClick={handleJsonImport}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-700"
                    >
                        Import JSON
                    </button>
                </div>
            )}

            {/* ═══ Test Information ═══ */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">🎧 Test Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
                        <input
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            placeholder="e.g. Listening Test 01"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                            placeholder="Optional description..."
                        />
                    </div>
                    {/* Main Audio URL */}
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1.5">
                            <FaVolumeUp className="text-indigo-500" size={11} />
                            Main Audio (full test audio)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                value={formData.mainAudioUrl}
                                onChange={e => setFormData(prev => ({ ...prev, mainAudioUrl: e.target.value }))}
                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                                placeholder="https://... or upload →"
                            />
                            <AudioUploadBtn
                                onUploaded={(url) => setFormData(prev => ({ ...prev, mainAudioUrl: url }))}
                            />
                            {formData.mainAudioUrl && (
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, mainAudioUrl: '' }))}
                                    className="text-red-400 hover:text-red-600 cursor-pointer p-1">
                                    <FaTimes size={12} />
                                </button>
                            )}
                        </div>
                        {formData.mainAudioUrl && (
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600">
                                <FaCheck size={9} /> Audio set
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Difficulty</label>
                        <select
                            value={formData.difficulty}
                            onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Duration (min)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 40 }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Audio Duration (seconds)</label>
                        <input
                            type="number"
                            value={formData.audioDuration}
                            onChange={e => setFormData(prev => ({ ...prev, audioDuration: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="1800 = 30 min"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Source</label>
                        <input
                            value={formData.source}
                            onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="e.g. Cambridge IELTS 15"
                        />
                    </div>
                </div>
            </div>

            {/* ═══ Two-Column Layout: Editor + Preview ═══ */}
            <div className={`flex gap-6 items-start`}>
                {/* LEFT — Parts Editor */}
                <div className={`${showPreview ? 'w-1/2' : 'w-full'} min-w-0`}>
                    <div className="space-y-4 mb-6">
                        {sections.map((section, idx) => (
                            <SectionPanel
                                key={idx}
                                section={section}
                                onChange={updated => updateSection(idx, updated)}
                            />
                        ))}
                    </div>

                    {/* Bottom Save */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                        <div className="text-xs text-gray-500">
                            💡 Total: <strong>{totalQuestions}</strong> questions across <strong>4</strong> parts
                        </div>
                        <button
                            type="button" onClick={handleSubmit} disabled={loading}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {isEditMode ? "Update" : "Save"} Listening Test
                        </button>
                    </div>
                </div>

                {/* RIGHT — Live Preview */}
                {showPreview && (
                    <div className="w-1/2 min-w-0 sticky top-4">
                        <ListeningPreview
                            sections={sections}
                            title={formData.title}
                            mainAudioUrl={formData.mainAudioUrl}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CreateListeningPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-indigo-500" />
            </div>
        }>
            <CreateListeningPageContent />
        </Suspense>
    );
}
