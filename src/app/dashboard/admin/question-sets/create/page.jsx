"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaPlus,
    FaTrash,
    FaHeadphones,
    FaBook,
    FaPen,
    FaQuestionCircle,
    FaCloudUploadAlt,
    FaCheck,
    FaBold,
    FaListUl,
    FaPlusSquare,
    FaMicrophone,
} from "react-icons/fa";
import { questionSetsAPI, uploadAPI } from "@/lib/api";

// Smart Editor Component
function SmartEditor({ value, onChange, placeholder, rows = 3, label }) {
    const textareaRef = React.useRef(null);

    const insertText = (before, after = "") => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        const newText = text.substring(0, start) + before + selected + after + text.substring(end);

        onChange({ target: { value: newText } });

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const addGap = () => {
        const matches = value.match(/\{(\d+)\}/g) || [];
        const nextNum = matches.length + 1;
        insertText(`{${nextNum}}`);
    };

    const fillExample = () => {
        const example = `**Bankside Agency**\n- Address: 497 Eastside\n- Name of agent: Becky {1}\n- Best to call in the {2}`;
        onChange({ target: { value: example } });
    };

    return (
        <div className="space-y-2 w-full group">
            <div className="flex items-center justify-between">
                {label && <label className="block text-sm font-bold text-gray-800">{label}</label>}
                <button
                    type="button"
                    onClick={fillExample}
                    className="text-[10px] text-gray-400 hover:text-cyan-600 transition-colors uppercase font-bold tracking-widest"
                >
                    Click for Example
                </button>
            </div>
            <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-50/50 transition-all bg-white shadow-sm">
                <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => insertText("**", "**")} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-all shadow-sm">
                        <FaBold size={11} /><span className="text-[10px] font-bold">Bold</span>
                    </button>
                    <button type="button" onClick={() => insertText("- ", "")} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-all shadow-sm">
                        <FaListUl size={11} /><span className="text-[10px] font-bold">List</span>
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1" />
                    <button type="button" onClick={addGap} className="flex items-center gap-2 px-3 py-1 bg-cyan-600 border border-cyan-700 rounded hover:bg-cyan-700 text-white transition-all shadow-md active:scale-95">
                        <FaPlusSquare size={12} /><span className="text-[11px] font-bold uppercase tracking-tight">Insert Blank Box</span>
                    </button>
                    <span className="ml-auto text-[9px] text-gray-400 font-medium italic hidden sm:block">Real-time preview on right side →</span>
                </div>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 text-[15px] outline-none resize-y min-h-[120px] leading-relaxed text-gray-800 placeholder:text-gray-300"
                />
            </div>
        </div>
    );
}

// Question Types for IELTS
const QUESTION_TYPES = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "matching", label: "Matching" },
    { value: "form-completion", label: "Form Completion" },
    { value: "note-completion", label: "Note Completion" },
    { value: "sentence-completion", label: "Sentence Completion" },
    { value: "summary-completion", label: "Summary Completion" },
    { value: "true-false-not-given", label: "True/False/Not Given" },
    { value: "yes-no-not-given", label: "Yes/No/Not Given" },
    { value: "short-answer", label: "Short Answer" },
    { value: "diagram-labeling", label: "Diagram Labeling" },
    { value: "fill-in-blank", label: "Fill in the Blank" },
];

// Default empty question helper
const createEmptyQuestion = (number, blockType = "question") => ({
    blockType,
    questionNumber: blockType === "question" ? number : undefined,
    questionType: blockType === "question" ? "multiple-choice" : undefined,
    questionText: blockType === "question" ? "" : undefined,
    content: blockType === "instruction" ? "" : undefined,
    options: blockType === "question" ? ["", "", "", ""] : undefined,
    correctAnswer: blockType === "question" ? "" : undefined,
    marks: blockType === "question" ? 1 : undefined,
});

// Default empty section helper
const createEmptySection = (number) => ({
    sectionNumber: number,
    title: `Section ${number}`,
    instructions: "",
    audioUrl: "",
    passage: "",
    questions: [createEmptyQuestion(1)],
});

// Default writing task helper
const createEmptyWritingTask = (number) => ({
    taskNumber: number,
    taskType: number === 1 ? "task1" : "task2",
    prompt: "",
    imageUrl: "",
    minWords: number === 1 ? 150 : 250,
    sampleAnswer: "",
});

export default function CreateQuestionSetPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get("type") || "LISTENING";

    // State
    const [loading, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    // Audio upload states
    const [audioUploading, setAudioUploading] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState("");

    // Form data
    const [formData, setFormData] = useState({
        setType: typeFromUrl,
        title: "",
        description: "",
        duration: typeFromUrl === "LISTENING" ? 40 : typeFromUrl === "SPEAKING" ? 14 : 60,
        difficulty: "medium",
        mainAudioUrl: "",
        audioDuration: 0,
    });

    // Sections for Listening/Reading
    const [sections, setSections] = useState([createEmptySection(1)]);

    // Writing tasks
    const [writingTasks, setWritingTasks] = useState([
        createEmptyWritingTask(1),
        createEmptyWritingTask(2),
    ]);

    const isWriting = formData.setType === "WRITING";
    const isSpeaking = formData.setType === "SPEAKING";

    // Speaking state
    const [speakingPart1, setSpeakingPart1] = useState({
        topics: [{ topicName: "", questions: [""] }],
        duration: 5,
    });
    const [speakingPart2, setSpeakingPart2] = useState({
        topic: "",
        cueCard: "",
        bulletPoints: ["", "", ""],
        followUpQuestion: "",
        preparationTime: 60,
        speakingTime: 120,
        followUpQuestions: [],
    });
    const [speakingPart3, setSpeakingPart3] = useState({
        topic: "",
        questions: [""],
        duration: 5,
    });

    // Handle audio file upload
    const handleAudioUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Please upload MP3, WAV, or OGG audio files.");
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError("File size too large. Maximum allowed is 50MB.");
            return;
        }

        setAudioFile(file);
        setAudioUploading(true);
        setUploadProgress("Uploading audio...");
        setError("");

        try {
            const result = await uploadAPI.uploadAudio(file);
            if (result.success) {
                setFormData((prev) => ({
                    ...prev,
                    mainAudioUrl: result.data.url,
                    audioDuration: Math.round(result.data.duration || 0),
                }));
                setUploadProgress("Upload complete!");
                setTimeout(() => setUploadProgress(""), 2000);
            }
        } catch (err) {
            setError(err.message || "Failed to upload audio file");
            setUploadProgress("");
        } finally {
            setAudioUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData((prev) => ({
            ...prev,
            setType: newType,
            duration: newType === "LISTENING" ? 40 : newType === "SPEAKING" ? 14 : 60,
        }));
    };

    const addSection = () => {
        setSections((prev) => [...prev, createEmptySection(prev.length + 1)]);
    };

    const removeSection = (index) => {
        if (sections.length > 1) {
            setSections((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateSection = (index, field, value) => {
        setSections((prev) =>
            prev.map((section, i) =>
                i === index ? { ...section, [field]: value } : section
            )
        );
    };

    const addQuestion = (sectionIndex) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex) {
                    return {
                        ...section,
                        questions: [...section.questions, createEmptyQuestion(section.questions.length + 1)],
                    };
                }
                return section;
            })
        );
    };

    const addInstruction = (sectionIndex) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex) {
                    return {
                        ...section,
                        questions: [...section.questions, createEmptyQuestion(0, "instruction")],
                    };
                }
                return section;
            })
        );
    };

    const removeQuestion = (sectionIndex, questionIndex) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex && section.questions.length > 1) {
                    return {
                        ...section,
                        questions: section.questions.filter((_, qi) => qi !== questionIndex),
                    };
                }
                return section;
            })
        );
    };

    const updateQuestion = (sectionIndex, questionIndex, field, value) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex) {
                    return {
                        ...section,
                        questions: section.questions.map((q, qi) =>
                            qi === questionIndex ? { ...q, [field]: value } : q
                        ),
                    };
                }
                return section;
            })
        );
    };

    const updateQuestionOption = (sectionIndex, questionIndex, optionIndex, value) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex) {
                    return {
                        ...section,
                        questions: section.questions.map((q, qi) => {
                            if (qi === questionIndex) {
                                const newOptions = [...q.options];
                                newOptions[optionIndex] = value;
                                return { ...q, options: newOptions };
                            }
                            return q;
                        }),
                    };
                }
                return section;
            })
        );
    };

    const updateWritingTask = (index, field, value) => {
        setWritingTasks((prev) =>
            prev.map((task, i) => (i === index ? { ...task, [field]: value } : task))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const setData = {
                ...formData,
                ...(isSpeaking
                    ? { part1: speakingPart1, part2: speakingPart2, part3: speakingPart3 }
                    : isWriting
                        ? { writingTasks }
                        : {
                            sections: sections.map(s => ({
                                ...s,
                                questions: s.questions.map((q, idx) => ({
                                    ...q,
                                    questionNumber: idx + 1,
                                }))
                            }))
                        }),
            };

            const response = await questionSetsAPI.create(setData);

            if (response.success) {
                router.push("/dashboard/admin/question-sets");
            }
        } catch (err) {
            setError(err.message || "Failed to create question set");
        } finally {
            setSaving(false);
        }
    };

    const getTypeIcon = () => {
        switch (formData.setType) {
            case "LISTENING":
                return <FaHeadphones className="text-purple-600" />;
            case "READING":
                return <FaBook className="text-blue-600" />;
            case "WRITING":
                return <FaPen className="text-green-600" />;
            case "SPEAKING":
                return <FaMicrophone className="text-orange-600" />;
            default:
                return <FaQuestionCircle />;
        }
    };

    const getTypeColor = () => {
        switch (formData.setType) {
            case "LISTENING": return "purple";
            case "READING": return "blue";
            case "WRITING": return "green";
            case "SPEAKING": return "orange";
            default: return "gray";
        }
    };

    return (
        <div className={`${showPreview ? "max-w-[1600px]" : "max-w-5xl"} mx-auto transition-all duration-500`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/question-sets" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {getTypeIcon()} Create {formData.setType} Set
                    </h1>
                    <p className="text-gray-500 text-sm">Add questions and configure the set</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`ml-auto px-4 py-2 rounded-lg font-medium transition-all ${showPreview ? "bg-cyan-600 text-white shadow-lg shadow-cyan-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                    {showPreview ? "Hide Preview" : "Show Live Preview"}
                </button>
            </div>

            {formData.setType !== "WRITING" && formData.setType !== "SPEAKING" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FaQuestionCircle className="text-amber-600 text-xl" />
                    </div>
                    <div>
                        <h4 className="text-amber-800 font-bold text-sm mb-1">সফটওয়্যারটি যারা ব্যবহার করবে তাদের জন্য গাইড:</h4>
                        <p className="text-amber-700 text-xs leading-relaxed max-w-2xl">
                            মাঝখানে গ্যাপ বা আন্ডারলাইন তৈরি করার জন্য নিচের টুলবার থেকে <strong>"Insert Blank Box"</strong> বাটনে ক্লিক করলেই হবে।
                            লিস্ট বা পয়েন্ট করার জন্য <strong>"List"</strong> বাটনে ক্লিক করুন।
                            ডান পাশের <strong>Preview</strong> সেকশনে দেখলেই তারা বুঝতে পারবে কিভাবে কোশ্চেনটি তৈরি হচ্ছে।
                        </p>
                    </div>
                </div>
            )}

            <div className={`flex flex-col ${showPreview ? "lg:flex-row" : ""} gap-8 items-start`}>
                <div className={`${showPreview ? "lg:w-1/2" : "w-full"} transition-all duration-500`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Set Type *</label>
                                    <select name="setType" value={formData.setType} onChange={handleTypeChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500">
                                        <option value="LISTENING">Listening</option>
                                        <option value="READING">Reading</option>
                                        <option value="WRITING">Writing</option>
                                        <option value="SPEAKING">Speaking</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                                    <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} required min={1} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                                    <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500">
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            {formData.setType === "LISTENING" && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-3"><FaHeadphones className="inline mr-2 text-purple-600" /> Audio File *</label>
                                    {!formData.mainAudioUrl ? (
                                        <label className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer ${audioUploading ? "bg-purple-50 border-purple-300" : "bg-gray-50 border-gray-300 hover:border-purple-400"}`}>
                                            <input type="file" onChange={handleAudioUpload} disabled={audioUploading} className="hidden" />
                                            {audioUploading ? <FaSpinner className="animate-spin text-purple-600" /> : <div className="text-center"><FaCloudUploadAlt className="text-2xl mx-auto mb-1 text-gray-400" /><span className="text-xs">Click to upload audio</span></div>}
                                        </label>
                                    ) : (
                                        <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2"><FaCheck className="text-green-600" /><span className="text-sm text-green-700">Audio ready</span></div>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, mainAudioUrl: "" }))} className="text-red-500"><FaTrash /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* writing tasks or sections */}
                        {isSpeaking ? (
                            <div className="space-y-6">
                                {/* Part 1: Introduction & Interview */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaMicrophone className="text-orange-600" />
                                        Part 1: Introduction & Interview
                                    </h3>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                        <input type="number" value={speakingPart1.duration} onChange={e => setSpeakingPart1(p => ({ ...p, duration: Number(e.target.value) }))} min={1} max={10} className="w-24 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500" />
                                    </div>
                                    {speakingPart1.topics.map((topic, tIdx) => (
                                        <div key={tIdx} className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={topic.topicName}
                                                    onChange={e => {
                                                        const newTopics = [...speakingPart1.topics];
                                                        newTopics[tIdx] = { ...newTopics[tIdx], topicName: e.target.value };
                                                        setSpeakingPart1(p => ({ ...p, topics: newTopics }));
                                                    }}
                                                    placeholder="Topic name (e.g., History, Hobbies)"
                                                    className="font-medium bg-white border border-gray-200 rounded px-3 py-1.5 outline-none focus:border-cyan-500 flex-1"
                                                />
                                                {speakingPart1.topics.length > 1 && (
                                                    <button type="button" onClick={() => {
                                                        setSpeakingPart1(p => ({ ...p, topics: p.topics.filter((_, i) => i !== tIdx) }));
                                                    }} className="text-red-400 ml-2"><FaTrash /></button>
                                                )}
                                            </div>
                                            {topic.questions.map((q, qIdx) => (
                                                <div key={qIdx} className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-gray-400 w-6">Q{qIdx + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={q}
                                                        onChange={e => {
                                                            const newTopics = [...speakingPart1.topics];
                                                            const newQuestions = [...newTopics[tIdx].questions];
                                                            newQuestions[qIdx] = e.target.value;
                                                            newTopics[tIdx] = { ...newTopics[tIdx], questions: newQuestions };
                                                            setSpeakingPart1(p => ({ ...p, topics: newTopics }));
                                                        }}
                                                        placeholder="Question..."
                                                        className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 outline-none focus:border-cyan-500"
                                                    />
                                                    {topic.questions.length > 1 && (
                                                        <button type="button" onClick={() => {
                                                            const newTopics = [...speakingPart1.topics];
                                                            newTopics[tIdx] = { ...newTopics[tIdx], questions: newTopics[tIdx].questions.filter((_, i) => i !== qIdx) };
                                                            setSpeakingPart1(p => ({ ...p, topics: newTopics }));
                                                        }} className="text-red-400"><FaTrash className="text-xs" /></button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                const newTopics = [...speakingPart1.topics];
                                                newTopics[tIdx] = { ...newTopics[tIdx], questions: [...newTopics[tIdx].questions, ""] };
                                                setSpeakingPart1(p => ({ ...p, topics: newTopics }));
                                            }} className="text-xs text-cyan-600 mt-2">+ Add Question</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        setSpeakingPart1(p => ({ ...p, topics: [...p.topics, { topicName: "", questions: [""] }] }));
                                    }} className="w-full border-2 border-dashed p-3 rounded-lg text-gray-400 hover:bg-gray-50 text-sm">+ Add Topic</button>
                                </div>

                                {/* Part 2: Cue Card */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaMicrophone className="text-orange-600" />
                                        Part 2: Individual Long Turn (Cue Card)
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                                            <input type="text" value={speakingPart2.topic} onChange={e => setSpeakingPart2(p => ({ ...p, topic: e.target.value }))} placeholder="e.g., A Neighbourhood" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cue Card Text *</label>
                                            <textarea value={speakingPart2.cueCard} onChange={e => setSpeakingPart2(p => ({ ...p, cueCard: e.target.value }))} rows={2} placeholder="Describe the neighbourhood you lived in..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Bullet Points (You should say:)</label>
                                            {speakingPart2.bulletPoints.map((bp, bIdx) => (
                                                <div key={bIdx} className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <input type="text" value={bp} onChange={e => {
                                                        const newBp = [...speakingPart2.bulletPoints];
                                                        newBp[bIdx] = e.target.value;
                                                        setSpeakingPart2(p => ({ ...p, bulletPoints: newBp }));
                                                    }} placeholder="bullet point..." className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 outline-none focus:border-cyan-500" />
                                                    {speakingPart2.bulletPoints.length > 1 && (
                                                        <button type="button" onClick={() => {
                                                            setSpeakingPart2(p => ({ ...p, bulletPoints: p.bulletPoints.filter((_, i) => i !== bIdx) }));
                                                        }} className="text-red-400"><FaTrash className="text-xs" /></button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                setSpeakingPart2(p => ({ ...p, bulletPoints: [...p.bulletPoints, ""] }));
                                            }} className="text-xs text-cyan-600">+ Add Bullet Point</button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Question</label>
                                            <input type="text" value={speakingPart2.followUpQuestion} onChange={e => setSpeakingPart2(p => ({ ...p, followUpQuestion: e.target.value }))} placeholder="and explain whether..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (sec)</label>
                                                <input type="number" value={speakingPart2.preparationTime} onChange={e => setSpeakingPart2(p => ({ ...p, preparationTime: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Speaking Time (sec)</label>
                                                <input type="number" value={speakingPart2.speakingTime} onChange={e => setSpeakingPart2(p => ({ ...p, speakingTime: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Part 3: Discussion */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaMicrophone className="text-orange-600" />
                                        Part 3: Two-way Discussion
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discussion Topic *</label>
                                            <input type="text" value={speakingPart3.topic} onChange={e => setSpeakingPart3(p => ({ ...p, topic: e.target.value }))} placeholder="e.g., Neighbourhoods and Communities" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                            <input type="number" value={speakingPart3.duration} onChange={e => setSpeakingPart3(p => ({ ...p, duration: Number(e.target.value) }))} min={1} max={10} className="w-24 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Questions</label>
                                            {speakingPart3.questions.map((q, qIdx) => (
                                                <div key={qIdx} className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-gray-400 w-6">Q{qIdx + 1}</span>
                                                    <input type="text" value={q} onChange={e => {
                                                        const newQ = [...speakingPart3.questions];
                                                        newQ[qIdx] = e.target.value;
                                                        setSpeakingPart3(p => ({ ...p, questions: newQ }));
                                                    }} placeholder="Discussion question..." className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 outline-none focus:border-cyan-500" />
                                                    {speakingPart3.questions.length > 1 && (
                                                        <button type="button" onClick={() => {
                                                            setSpeakingPart3(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qIdx) }));
                                                        }} className="text-red-400"><FaTrash className="text-xs" /></button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                setSpeakingPart3(p => ({ ...p, questions: [...p.questions, ""] }));
                                            }} className="text-xs text-cyan-600">+ Add Question</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : isWriting ? (
                            <div className="space-y-6">
                                {writingTasks.map((task, index) => (
                                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaPen className="text-green-600" />
                                            Task {task.taskNumber} ({task.taskType === "task1" ? "150+ words" : "250+ words"})
                                        </h3>
                                        <div className="space-y-4">
                                            <SmartEditor
                                                label="Task Prompt *"
                                                value={task.prompt}
                                                onChange={(e) => updateWritingTask(index, "prompt", e.target.value)}
                                                rows={4}
                                                placeholder="Write the task prompt here..."
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" value={task.imageUrl} onChange={(e) => updateWritingTask(index, "imageUrl", e.target.value)} placeholder="Image URL (for Task 1)" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                                <input type="number" value={task.minWords} onChange={(e) => updateWritingTask(index, "minWords", Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sections.map((section, sIdx) => (
                                    <div key={sIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className={`bg-${getTypeColor()}-50 p-4 border-b flex justify-between`}>
                                            <input value={section.title} onChange={e => updateSection(sIdx, "title", e.target.value)} className="font-semibold bg-transparent outline-none" />
                                            {sections.length > 1 && <button type="button" onClick={() => removeSection(sIdx)} className="text-red-500"><FaTrash /></button>}
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <SmartEditor
                                                label="Instructions"
                                                value={section.instructions}
                                                onChange={e => updateSection(sIdx, "instructions", e.target.value)}
                                                rows={2}
                                                placeholder="Instructions for this section..."
                                            />

                                            {(formData.setType === "READING" || formData.setType === "LISTENING") && (
                                                <SmartEditor
                                                    label={formData.setType === "READING" ? "Reading Passage" : "Listening Passage / Note Context"}
                                                    value={section.passage}
                                                    onChange={e => updateSection(sIdx, "passage", e.target.value)}
                                                    rows={6}
                                                    placeholder={formData.setType === "READING" ? "Paste passage..." : "Use {1}, {2} etc. for gaps..."}
                                                />
                                            )}

                                            <div className="border-t border-gray-100 pt-6">
                                                <div className="flex justify-between mb-4">
                                                    <h4 className="font-medium">Questions & Blocks</h4>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => addInstruction(sIdx)} className="text-xs text-amber-600 border border-amber-200 px-2 py-1 rounded">Add Message</button>
                                                        <button type="button" onClick={() => addQuestion(sIdx)} className="text-xs text-cyan-600 border border-cyan-200 px-2 py-1 rounded">Add Question</button>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {section.questions.map((q, qIdx) => (
                                                        <div key={qIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-xs font-bold">{q.blockType === "instruction" ? "Instruction" : `Q${q.questionNumber || qIdx + 1}`}</span>
                                                                <button type="button" onClick={() => removeQuestion(sIdx, qIdx)} className="text-red-400"><FaTrash className="text-xs" /></button>
                                                            </div>
                                                            {q.blockType === "instruction" ? (
                                                                <textarea value={q.content} onChange={e => updateQuestion(sIdx, qIdx, "content", e.target.value)} className="w-full text-sm border p-2 rounded outline-none" />
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <div className="flex gap-2">
                                                                        <select value={q.questionType} onChange={e => updateQuestion(sIdx, qIdx, "questionType", e.target.value)} className="text-xs border rounded p-1">
                                                                            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                                        </select>
                                                                        <input value={q.correctAnswer} onChange={e => updateQuestion(sIdx, qIdx, "correctAnswer", e.target.value)} placeholder="Answer" className="flex-1 text-xs border rounded p-1" />
                                                                    </div>
                                                                    <input value={q.questionText} onChange={e => updateQuestion(sIdx, qIdx, "questionText", e.target.value)} placeholder="Question..." className="w-full text-xs border rounded p-1" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addSection} className="w-full border-2 border-dashed p-4 rounded-xl text-gray-400 hover:bg-gray-50">+ Add Section</button>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-xl border shadow-lg">
                            <Link href="/dashboard/admin/question-sets" className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</Link>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                                {loading && <FaSpinner className="animate-spin" />} Create Set
                            </button>
                        </div>
                    </form>
                </div>

                {showPreview && (
                    <div className="lg:w-1/2 sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto no-scrollbar pb-20 transition-all duration-500">
                        <LivePreview sections={sections} formData={formData} writingTasks={writingTasks} />
                    </div>
                )}
            </div>
        </div>
    );
}

function LivePreview({ sections, formData, writingTasks }) {
    const isWriting = formData.setType === "WRITING";

    const renderPassageText = (text) => {
        if (!text) return null;

        const lines = text.split("\n");

        return lines.map((line, lineIdx) => {
            let isBullet = false;
            let displayContent = line;

            if (line.trim().startsWith("- ")) {
                isBullet = true;
                displayContent = line.trim().substring(2);
            }

            const processLineContent = (txt) => {
                // Split by blanks first {1}, {2}
                const parts = txt.split(/(\{\d+\})/g);
                return parts.map((part, i) => {
                    const match = part.match(/^\{(\d+)\}$/);
                    if (match) {
                        const qNum = parseInt(match[1]);
                        // Find if there is a corresponding question defined in any section
                        const allQuestions = sections.flatMap(s => s.questions);
                        const questionDef = allQuestions.find(q => q.questionNumber === qNum);

                        return (
                            <span key={i} className="inline-flex items-center mx-1 translate-y-1">
                                <span className="w-7 h-7 border-2 border-black flex items-center justify-center text-[12px] font-black bg-white text-black shrink-0">
                                    {qNum}
                                </span>
                                <input
                                    type="text"
                                    placeholder={questionDef ? "(Type answer here)" : "(Question not added below)"}
                                    className={`w-40 border-b-2 border-gray-400 bg-transparent outline-none px-2 text-sm font-medium focus:border-cyan-600 transition-colors ${!questionDef ? "bg-red-50 border-red-200" : ""}`}
                                />
                            </span>
                        );
                    }

                    // Handle bold text **bold**
                    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                    return boldParts.map((bp, j) => {
                        const boldMatch = bp.match(/^\*\*(.*)\*\*$/);
                        if (boldMatch) {
                            return <strong key={`${i}-${j}`} className="font-bold text-gray-900">{boldMatch[1]}</strong>;
                        }
                        return bp;
                    });
                });
            };

            if (isBullet) {
                return (
                    <div key={lineIdx} className="flex items-start gap-4 my-2.5 ml-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2.5 flex-shrink-0" />
                        <div className="text-[15px] text-gray-800 flex-1 leading-relaxed">
                            {processLineContent(displayContent)}
                        </div>
                    </div>
                );
            }

            return (
                <div key={lineIdx} className="my-2 text-[15px] text-gray-800 leading-relaxed">
                    {processLineContent(displayContent)}
                </div>
            );
        });
    };

    return (
        <div className="bg-white border-2 border-gray-300 min-h-full flex flex-col shadow-sm">
            {/* Real IELTS Top Bar */}
            <div className="border-b border-gray-200 p-2 flex items-center justify-between bg-[#f8f9fa]">
                <div className="font-bold text-sm text-gray-700 ml-2">Questions 1-40</div>
                <div className="flex items-center gap-4">
                    <button className="bg-white border border-gray-300 px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-gray-50 italic">
                        <FaHeadphones className="text-gray-600" /> Listen From Here
                    </button>
                    <div className="text-xs font-bold bg-gray-100 border border-gray-300 px-2 py-1 rounded">
                        {formData.duration}:00
                    </div>
                </div>
            </div>

            <div className="p-10 flex-1 font-sans text-[#1a1a1a]">
                <div className="mb-10 max-w-3xl border-b border-gray-100 pb-6">
                    <h2 className="text-2xl font-bold mb-3">{formData.title || "Untitled Test"}</h2>
                    <p className="text-gray-600 text-sm italic">{formData.description}</p>
                </div>
                {formData.setType === "LISTENING" && formData.mainAudioUrl && (
                    <div className="mb-10 p-4 border border-gray-200 bg-gray-50 rounded shadow-inner">
                        <audio src={formData.mainAudioUrl} controls className="w-full h-10" />
                    </div>
                )}
                <div className="space-y-10">
                    {isWriting ? writingTasks.map((t, i) => (
                        <div key={i} className="space-y-3">
                            <h3 className="font-bold text-gray-800">Task {t.taskNumber}</h3>
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg italic whitespace-pre-wrap">{t.prompt}</div>
                            {t.imageUrl && <img src={t.imageUrl} className="rounded-lg max-h-40 mx-auto" />}
                        </div>
                    )) : sections.map((s, si) => {
                        const allQuestions = s.questions.filter(q => q.blockType === "question");
                        const startQ = allQuestions.length > 0 ? Math.min(...allQuestions.map(q => q.questionNumber)) : null;
                        const endQ = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.questionNumber)) : null;

                        return (
                            <div key={si} className="space-y-6">
                                {/* Section Header with range and Listen button */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                                    <div className="text-sm font-bold text-gray-700">
                                        {startQ && endQ ? `Questions ${startQ}-${endQ}` : `Section ${si + 1}`}
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-[11px] font-bold shadow-sm transition-all italic">
                                        <FaHeadphones size={13} className="text-gray-500" /> Listen From Here
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="font-bold text-lg text-[#1a1c1e] mb-1">{s.title}</h3>
                                    {s.instructions && (
                                        <p className="text-[15px] text-gray-800 italic mb-4">{s.instructions}</p>
                                    )}
                                </div>

                                {s.passage && (
                                    <div className="text-[16px] border border-gray-300 p-8 bg-white whitespace-pre-wrap leading-[1.8] text-gray-800 shadow-sm relative overflow-hidden mb-8">
                                        {renderPassageText(s.passage)}
                                    </div>
                                )}

                                <div className="space-y-8 mt-4">
                                    {s.questions
                                        .filter(q => q.blockType === "question" && !(s.passage || "").includes(`{${q.questionNumber}}`))
                                        .map((q, qi) => (
                                            <div key={qi} className="group animate-in fade-in slide-in-from-left-4 duration-500">
                                                <div className="flex flex-col gap-5">
                                                    <div className="flex gap-4 items-start">
                                                        <span className="w-8 h-8 border border-black flex-shrink-0 flex items-center justify-center font-bold bg-white text-sm shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all">
                                                            {q.questionNumber}
                                                        </span>
                                                        <div className="text-[#1a1c1e] font-bold pt-0.5 text-[15px] leading-snug">
                                                            {q.questionText || "(No question text provided)"}
                                                        </div>
                                                    </div>

                                                    {q.questionType === "multiple-choice" ? (
                                                        <div className="grid grid-cols-1 gap-2.5 ml-12">
                                                            {q.options?.map((o, oi) => (
                                                                <div key={oi} className="flex gap-3 items-center group/opt cursor-pointer">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="relative flex items-center justify-center">
                                                                            <span className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0 group-hover/opt:border-cyan-600 transition-colors bg-white"></span>
                                                                            <span className="absolute text-[11px] font-bold text-gray-500 group-hover/opt:text-cyan-700 uppercase">{String.fromCharCode(65 + oi)}</span>
                                                                        </div>
                                                                        <input
                                                                            type="radio"
                                                                            name={`q-${q.questionNumber}`}
                                                                            className="hidden"
                                                                        />
                                                                        <span className="text-[15px] text-gray-800 font-medium">{o && o.startsWith(`${String.fromCharCode(65 + oi)} `) ? o.substring(2) : o}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="ml-12 border border-gray-400 w-72 h-9 bg-white shadow-inner flex items-center px-3 text-gray-400 text-xs italic">
                                                            (Answer will be entered here)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Real Stats Bar */}
            <div className="bg-[#e9ecef] p-3 border-t border-gray-300 flex items-center justify-between text-xs font-bold text-gray-700">
                <div className="flex gap-4">
                    <span>Total Questions: {sections.reduce((acc, s) => acc + s.questions.length, 0)}</span>
                    <span className="text-cyan-700">Answered: 0</span>
                </div>
                <div className="uppercase tracking-widest text-[10px] opacity-30">IELTS OFFICIAL EXAM SYSTEM</div>
            </div>
        </div>
    );
}
