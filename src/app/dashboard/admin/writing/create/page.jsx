"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaPlus,
    FaTrash,
    FaPen,
    FaImage,
    FaTimes,
    FaClock,
    FaCloudUploadAlt,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import { writingAPI, uploadAPI } from "@/lib/api";

// ========== LIVE PREVIEW COMPONENT ==========
function LivePreview({ formData, tasks }) {
    const [activeTask, setActiveTask] = useState(0);
    const [demoText, setDemoText] = useState({});
    const wordCount = (demoText[activeTask] || "").trim().split(/\s+/).filter(Boolean).length;
    const currentTask = tasks[activeTask];
    if (!currentTask) return null;

    return (
        <div className="bg-white border-2 border-gray-300 min-h-full flex flex-col shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-bold text-sm tracking-wide">IELTS Writing Test</span>
                    <span className="text-xs text-blue-200 ml-2">{formData.title || "Untitled"}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 text-white text-sm">
                        <FaClock className="text-xs" />
                        <span className="font-mono font-semibold">{formData.duration || 60}:00</span>
                    </div>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">Submit</button>
                </div>
            </div>

            {/* Task Tabs */}
            <div className="bg-[#f5f5f5] border-b border-gray-300 flex">
                {tasks.map((t, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTask(idx)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTask === idx
                            ? "border-[#1a237e] text-[#1a237e] bg-white"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Task {t.taskNumber}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            ({(demoText[idx] || "").trim().split(/\s+/).filter(Boolean).length} words)
                        </span>
                    </button>
                ))}
            </div>

            {/* Task Requirements */}
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-4 text-xs text-amber-700">
                <span>📝 Min: <strong>{currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250)}</strong> words</span>
                <span>⏱️ Recommended: <strong>{currentTask.recommendedTime || (currentTask.taskNumber === 1 ? 20 : 40)}</strong> min</span>
                {currentTask.taskType && <span>📋 Type: <strong>{currentTask.taskType}</strong></span>}
                {currentTask.subType && <span>🏷️ {currentTask.subType}</span>}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex">
                {/* Left Panel - Instructions / Image */}
                <div className="w-1/2 border-r border-gray-200 p-4 overflow-y-auto bg-[#fafafa]" style={{ maxHeight: "500px" }}>
                    <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wide">
                        Writing Task {currentTask.taskNumber}
                    </h3>

                    {/* Instructions */}
                    {currentTask.instructions && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-sm text-blue-800 italic">
                            {currentTask.instructions}
                        </div>
                    )}

                    {/* Image */}
                    {currentTask.imageUrl && (
                        <div className="mb-3">
                            <img
                                src={currentTask.imageUrl}
                                alt="Task visual"
                                className="w-full rounded border border-gray-200"
                            />
                        </div>
                    )}

                    {/* Prompt Text */}
                    {currentTask.prompt && (
                        <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {currentTask.prompt}
                        </div>
                    )}

                    {!currentTask.prompt && !currentTask.instructions && (
                        <div className="text-gray-400 text-sm italic text-center py-8">
                            Add instructions and prompt to see preview
                        </div>
                    )}
                </div>

                {/* Right Panel - Writing Area */}
                <div className="w-1/2 p-4 flex flex-col" style={{ maxHeight: "500px" }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Your Response</span>
                        <span className={`text-xs font-bold ${wordCount >= (currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250)) ? "text-green-600" : "text-gray-400"}`}>
                            {wordCount} / {currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250)} words
                        </span>
                    </div>
                    <textarea
                        value={demoText[activeTask] || ""}
                        onChange={(e) => setDemoText(prev => ({ ...prev, [activeTask]: e.target.value }))}
                        placeholder="Start writing here..."
                        className="flex-1 w-full border border-gray-300 rounded p-3 text-sm resize-none outline-none focus:border-blue-400 bg-white leading-relaxed"
                    />
                    {/* Word count bar */}
                    <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${wordCount >= (currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250))
                                    ? "bg-green-500" : wordCount > 50 ? "bg-amber-400" : "bg-red-400"
                                    }`}
                                style={{ width: `${Math.min(100, (wordCount / (currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250))) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-[#e9ecef] p-3 border-t border-gray-300 flex items-center justify-between">
                <button
                    onClick={() => setActiveTask(Math.max(0, activeTask - 1))}
                    disabled={activeTask === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-30"
                >
                    <FaChevronLeft className="text-xs" /> Previous
                </button>
                <span className="text-xs font-bold text-gray-500">
                    Task {activeTask + 1} of {tasks.length}
                </span>
                <button
                    onClick={() => setActiveTask(Math.min(tasks.length - 1, activeTask + 1))}
                    disabled={activeTask === tasks.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-30"
                >
                    Next <FaChevronRight className="text-xs" />
                </button>
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========
export default function CreateWritingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPreview, setShowPreview] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        testType: "academic",
        duration: 60,
        difficulty: "medium",
        source: "",
    });

    // Tasks state — always 2 tasks for IELTS Writing
    const [tasks, setTasks] = useState([
        {
            taskNumber: 1,
            taskType: "task1-academic",
            subType: "",
            prompt: "",
            instructions: "You should spend about 20 minutes on this task.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
            minWords: 150,
            recommendedTime: 20,
            imageUrl: "",
            sampleAnswer: "",
            keyPoints: [],
        },
        {
            taskNumber: 2,
            taskType: "task2",
            subType: "",
            prompt: "",
            instructions: "You should spend about 40 minutes on this task.\n\nWrite about the following topic.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
            minWords: 250,
            recommendedTime: 40,
            imageUrl: "",
            sampleAnswer: "",
            keyPoints: [],
        },
    ]);

    const [imageUploading, setImageUploading] = useState({});

    // Fetch data for edit mode
    useEffect(() => {
        if (!editId) return;

        const fetchData = async () => {
            try {
                const response = await writingAPI.getById(editId, true);
                if (response.success && response.data) {
                    const data = response.data;
                    setIsEditMode(true);

                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        testType: data.testType || "academic",
                        duration: data.duration || 60,
                        difficulty: data.difficulty || "medium",
                        source: data.source || "",
                    });

                    if (data.tasks && data.tasks.length > 0) {
                        setTasks(data.tasks.map(t => ({
                            taskNumber: t.taskNumber,
                            taskType: t.taskType || "",
                            subType: t.subType || "",
                            prompt: t.prompt || "",
                            instructions: t.instructions || "",
                            minWords: t.minWords || (t.taskNumber === 1 ? 150 : 250),
                            recommendedTime: t.recommendedTime || (t.taskNumber === 1 ? 20 : 40),
                            imageUrl: t.images?.[0]?.url || "",
                            sampleAnswer: t.sampleAnswer || "",
                            keyPoints: t.keyPoints || [],
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch:", err);
                setError("Failed to load writing test data.");
            }
        };

        fetchData();
    }, [editId]);

    // Update a specific task field
    const updateTask = (index, field, value) => {
        setTasks(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Image upload handler
    const handleImageUpload = async (taskIndex, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(prev => ({ ...prev, [taskIndex]: true }));
        try {
            const response = await uploadAPI.uploadImage(file);
            if (response.success && response.data?.url) {
                updateTask(taskIndex, "imageUrl", response.data.url);
            }
        } catch (err) {
            setError("Image upload failed: " + err.message);
        } finally {
            setImageUploading(prev => ({ ...prev, [taskIndex]: false }));
        }
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Map frontend format to backend format
            const dataToSend = {
                ...formData,
                tasks: tasks.map(t => ({
                    taskNumber: t.taskNumber,
                    taskType: t.taskType,
                    subType: t.subType || undefined,
                    prompt: t.prompt,
                    instructions: t.instructions,
                    minWords: t.minWords,
                    recommendedTime: t.recommendedTime,
                    images: t.imageUrl ? [{ url: t.imageUrl, description: "", caption: "" }] : [],
                    sampleAnswer: t.sampleAnswer || undefined,
                    keyPoints: t.keyPoints?.length ? t.keyPoints : undefined,
                })),
            };

            const response = isEditMode
                ? await writingAPI.update(editId, dataToSend)
                : await writingAPI.create(dataToSend);

            if (response.success) {
                router.push("/dashboard/admin/writing");
            }
        } catch (err) {
            setError(err.message || `Failed to ${isEditMode ? "update" : "create"} writing test`);
        } finally {
            setLoading(false);
        }
    };

    // Task 1 sub-type options
    const task1SubTypes = formData.testType === "academic"
        ? [
            { value: "line-graph", label: "Line Graph" },
            { value: "bar-chart", label: "Bar Chart" },
            { value: "pie-chart", label: "Pie Chart" },
            { value: "table", label: "Table" },
            { value: "process-diagram", label: "Process Diagram" },
            { value: "map-comparison", label: "Map Comparison" },
            { value: "multiple-charts", label: "Multiple Charts" },
            { value: "flow-chart", label: "Flow Chart" },
        ]
        : [
            { value: "formal-letter", label: "Formal Letter" },
            { value: "semi-formal-letter", label: "Semi-Formal Letter" },
            { value: "informal-letter", label: "Informal Letter" },
        ];

    const task2SubTypes = [
        { value: "opinion", label: "Opinion / Agree-Disagree" },
        { value: "discussion", label: "Discussion (Both Views)" },
        { value: "discussion-opinion", label: "Discussion + Opinion" },
        { value: "problem-solution", label: "Problem-Solution" },
        { value: "problem-causes-solutions", label: "Problem-Causes-Solutions" },
        { value: "advantages-disadvantages", label: "Advantages & Disadvantages" },
        { value: "advantages-disadvantages-opinion", label: "Advantages & Disadvantages + Opinion" },
        { value: "two-part-question", label: "Two-Part Question" },
        { value: "direct-question", label: "Direct Question" },
    ];

    return (
        <div className={`${showPreview ? "max-w-[1600px]" : "max-w-4xl"} mx-auto transition-all duration-500`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/writing" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaPen className="text-green-600" />
                        {isEditMode ? "Edit" : "Create"} Writing Test
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEditMode ? "Modify existing writing test" : "Create a new IELTS Writing test with Task 1 & Task 2"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${showPreview
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    {showPreview ? <><FaEyeSlash /> Hide Preview</> : <><FaEye /> Show Preview</>}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError("")}><FaTimes /></button>
                </div>
            )}

            <div className={`flex flex-col ${showPreview ? "lg:flex-row" : ""} gap-8 items-start`}>
                {/* ========== LEFT: FORM ========== */}
                <div className={`${showPreview ? "lg:w-1/2" : "w-full"} transition-all duration-500`}>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaPen className="text-green-600" /> Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g., Academic Writing Test 1"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description..."
                                        rows={2}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                                        <select
                                            value={formData.testType}
                                            onChange={(e) => {
                                                setFormData(p => ({ ...p, testType: e.target.value }));
                                                // Update Task 1 type based on test type
                                                updateTask(0, "taskType", e.target.value === "academic" ? "task1-academic" : "task1-gt");
                                                updateTask(0, "subType", "");
                                            }}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                        >
                                            <option value="academic">Academic</option>
                                            <option value="general-training">General Training</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData(p => ({ ...p, duration: Number(e.target.value) }))}
                                            min={10}
                                            max={120}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData(p => ({ ...p, difficulty: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                    <input
                                        type="text"
                                        value={formData.source}
                                        onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                                        placeholder="e.g., Cambridge IELTS 18"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tasks */}
                        {tasks.map((task, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Task Header */}
                                <div className={`p-4 border-b ${index === 0 ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"}`}>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <FaPen className={index === 0 ? "text-green-600" : "text-blue-600"} />
                                        Task {task.taskNumber}
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            ({task.taskNumber === 1 ? "150+ words • 20 min" : "250+ words • 40 min"})
                                        </span>
                                    </h3>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Sub Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {task.taskNumber === 1 ? "Task 1 Sub-Type" : "Essay Type"}
                                        </label>
                                        <select
                                            value={task.subType}
                                            onChange={(e) => updateTask(index, "subType", e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500"
                                        >
                                            <option value="">Select type...</option>
                                            {(task.taskNumber === 1 ? task1SubTypes : task2SubTypes).map(st => (
                                                <option key={st.value} value={st.value}>{st.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                        <textarea
                                            value={task.instructions}
                                            onChange={(e) => updateTask(index, "instructions", e.target.value)}
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 resize-none text-sm"
                                        />
                                    </div>

                                    {/* Prompt */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt / Question *</label>
                                        <textarea
                                            value={task.prompt}
                                            onChange={(e) => updateTask(index, "prompt", e.target.value)}
                                            placeholder={task.taskNumber === 1
                                                ? "Describe the graph/chart/process..."
                                                : "Some people believe that... To what extent do you agree or disagree?"
                                            }
                                            rows={5}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 resize-none text-sm"
                                        />
                                    </div>

                                    {/* Image Upload (mainly for Task 1) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <FaImage className="inline mr-1" />
                                            Reference Image {task.taskNumber === 1 && "(Graph/Chart/Diagram)"}
                                        </label>
                                        {!task.imageUrl ? (
                                            <label className={`relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer ${imageUploading[index] ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-300 hover:border-green-400"}`}>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e)} disabled={imageUploading[index]} className="hidden" />
                                                {imageUploading[index]
                                                    ? <FaSpinner className="animate-spin text-green-600 text-xl" />
                                                    : <div className="text-center">
                                                        <FaCloudUploadAlt className="text-2xl mx-auto mb-1 text-gray-400" />
                                                        <span className="text-xs text-gray-500">Click to upload image</span>
                                                    </div>
                                                }
                                            </label>
                                        ) : (
                                            <div className="relative">
                                                <img src={task.imageUrl} alt="Uploaded" className="w-full max-h-48 object-contain rounded-lg border" />
                                                <button
                                                    type="button"
                                                    onClick={() => updateTask(index, "imageUrl", "")}
                                                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                                >
                                                    <FaTimes className="text-xs" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Min Words & Time (collapsible) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Words</label>
                                            <input
                                                type="number"
                                                value={task.minWords}
                                                onChange={(e) => updateTask(index, "minWords", Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time (min)</label>
                                            <input
                                                type="number"
                                                value={task.recommendedTime}
                                                onChange={(e) => updateTask(index, "recommendedTime", Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Sample Answer (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sample Answer (optional)</label>
                                        <textarea
                                            value={task.sampleAnswer}
                                            onChange={(e) => updateTask(index, "sampleAnswer", e.target.value)}
                                            placeholder="Model answer for reference..."
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 resize-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Submit */}
                        <div className="flex justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-xl border shadow-lg">
                            <Link href="/dashboard/admin/writing" className="px-4 py-2 border rounded-lg text-sm text-gray-600">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                {loading && <FaSpinner className="animate-spin" />}
                                {isEditMode ? "Update Test" : "Create Test"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ========== RIGHT: PREVIEW ========== */}
                {showPreview && (
                    <div className="lg:w-1/2 sticky top-4 transition-all duration-500">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Live Preview</h3>
                        </div>
                        <LivePreview formData={formData} tasks={tasks} />
                    </div>
                )}
            </div>
        </div>
    );
}
