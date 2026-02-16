"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
    FaMicrophone,
    FaCloudUploadAlt,
    FaCheck,
} from "react-icons/fa";
import { questionSetsAPI, uploadAPI } from "@/lib/api";

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

const createEmptyQuestion = (number) => ({
    questionNumber: number,
    questionType: "multiple-choice",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
});

const createEmptySection = (number) => ({
    sectionNumber: number,
    title: `Section ${number}`,
    instructions: "",
    audioUrl: "",
    passage: "",
    questions: [createEmptyQuestion(1)],
});

export default function EditQuestionSetPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Audio upload states
    const [audioUploading, setAudioUploading] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState("");

    // Image upload states for writing tasks
    const [imageUploading, setImageUploading] = useState({});
    const [imageProgress, setImageProgress] = useState({});

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: 40,
        difficulty: "medium",
        mainAudioUrl: "",
        audioDuration: 0,
        setType: "LISTENING",
    });

    const [sections, setSections] = useState([]);
    const [writingTasks, setWritingTasks] = useState([]);

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
        preparationTime: 1,
        speakingTime: 2,
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

        // Validate file type
        const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Please upload MP3, WAV, or OGG audio files.");
            return;
        }

        // Validate file size (50MB max)
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

    useEffect(() => {
        if (params.id) {
            fetchQuestionSet();
        }
    }, [params.id]);

    const fetchQuestionSet = async () => {
        try {
            setLoading(true);
            const response = await questionSetsAPI.getById(params.id, true);

            if (response.success && response.data) {
                const set = response.data;
                setFormData({
                    title: set.title || "",
                    description: set.description || "",
                    duration: set.duration || 40,
                    difficulty: set.difficulty || "medium",
                    mainAudioUrl: set.mainAudioUrl || "",
                    audioDuration: set.audioDuration || 0,
                    setType: set.setType || "LISTENING",
                });

                if (set.sections) {
                    setSections(set.sections);
                }

                // Handle Writing tasks - create default if none exist
                if (set.setType === "WRITING") {
                    if (set.writingTasks && set.writingTasks.length > 0) {
                        setWritingTasks(set.writingTasks);
                    } else {
                        // Create default empty tasks for Writing
                        setWritingTasks([
                            {
                                taskNumber: 1,
                                taskType: "task1-academic",
                                prompt: set.tasks?.[0]?.prompt || "",
                                instructions: set.tasks?.[0]?.instructions || "",
                                minWords: set.tasks?.[0]?.minWords || 150,
                                imageUrl: set.tasks?.[0]?.images?.[0]?.url || "",
                            },
                            {
                                taskNumber: 2,
                                taskType: "task2",
                                prompt: set.tasks?.[1]?.prompt || "",
                                instructions: set.tasks?.[1]?.instructions || "",
                                minWords: set.tasks?.[1]?.minWords || 250,
                                imageUrl: set.tasks?.[1]?.images?.[0]?.url || "",
                            }
                        ]);
                    }
                } else if (set.writingTasks) {
                    setWritingTasks(set.writingTasks);
                }

                // Handle Speaking data
                if (set.setType === "SPEAKING") {
                    if (set.part1) setSpeakingPart1(set.part1);
                    if (set.part2) setSpeakingPart2(set.part2);
                    if (set.part3) setSpeakingPart3(set.part3);
                }
            }
        } catch (error) {
            console.error("Failed to fetch question set:", error);
            setError("Failed to load question set");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    // Section handlers
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

    // Question handlers
    const addQuestion = (sectionIndex) => {
        setSections((prev) =>
            prev.map((section, i) => {
                if (i === sectionIndex) {
                    const newQNum = section.questions.length + 1;
                    return {
                        ...section,
                        questions: [...section.questions, createEmptyQuestion(newQNum)],
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
                                const newOptions = [...(q.options || [])];
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

    // Writing task handlers
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
            const isWritingType = formData.setType === "WRITING";
            const isSpeakingType = formData.setType === "SPEAKING";

            let setData = {};
            if (isSpeakingType) {
                setData = { part1: speakingPart1, part2: speakingPart2, part3: speakingPart3 };
            } else if (isWritingType) {
                setData = { writingTasks };
            } else {
                setData = {
                    sections: sections.map((s) => ({
                        ...s,
                        questions: s.questions.map((q, idx) => ({
                            ...q,
                            questionNumber: idx + 1,
                        })),
                    })),
                };
            }

            const updateData = {
                ...formData,
                ...setData,
            };

            const response = await questionSetsAPI.update(params.id, updateData);

            if (response.success) {
                router.push(`/dashboard/admin/question-sets/${params.id}`);
            }
        } catch (err) {
            setError(err.message || "Failed to update question set");
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
                return null;
        }
    };

    const isWriting = formData.setType === "WRITING";
    const isSpeaking = formData.setType === "SPEAKING";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FaSpinner className="animate-spin text-4xl text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/admin/question-sets/${params.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {getTypeIcon()}
                        Edit Question Set
                    </h1>
                    <p className="text-gray-500">Modify questions and settings</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Set Type
                            </label>
                            <input
                                type="text"
                                value={formData.setType}
                                disabled
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes) *
                            </label>
                            <input
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                required
                                min={1}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Difficulty *
                            </label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleInputChange}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Audio Upload for Listening */}
                    {formData.setType === "LISTENING" && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                <FaHeadphones className="inline mr-2 text-purple-600" />
                                Main Audio File
                            </label>

                            {/* Upload Area */}
                            <div className="space-y-4">
                                {!formData.mainAudioUrl ? (
                                    <label className={`
                                        relative flex flex-col items-center justify-center 
                                        w-full h-40 border-2 border-dashed rounded-xl 
                                        cursor-pointer transition-all duration-200
                                        ${audioUploading
                                            ? "bg-purple-50 border-purple-300"
                                            : "bg-gray-50 border-gray-300 hover:bg-purple-50 hover:border-purple-400"
                                        }
                                    `}>
                                        <input
                                            type="file"
                                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                                            onChange={handleAudioUpload}
                                            disabled={audioUploading}
                                            className="hidden"
                                        />

                                        {audioUploading ? (
                                            <div className="flex flex-col items-center">
                                                <FaSpinner className="text-3xl text-purple-600 animate-spin mb-2" />
                                                <span className="text-purple-600 font-medium">{uploadProgress}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <FaCloudUploadAlt className="text-4xl text-gray-400 mb-3" />
                                                <span className="text-gray-600 font-medium">Click to upload audio file</span>
                                                <span className="text-gray-400 text-sm mt-1">MP3, WAV, OGG (max 50MB)</span>
                                            </div>
                                        )}
                                    </label>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <FaCheck className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-green-700 font-medium">Audio available!</p>
                                                    <p className="text-green-600 text-sm">
                                                        {audioFile?.name || "Audio file"}
                                                        {formData.audioDuration > 0 && ` • ${Math.floor(formData.audioDuration / 60)}:${String(formData.audioDuration % 60).padStart(2, '0')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, mainAudioUrl: "", audioDuration: 0 }));
                                                    setAudioFile(null);
                                                }}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>

                                        {/* Audio Preview */}
                                        <div className="mt-4">
                                            <audio
                                                controls
                                                src={formData.mainAudioUrl}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Or enter URL manually */}
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-gray-400 text-sm">or enter URL manually</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Audio URL
                                        </label>
                                        <input
                                            type="url"
                                            name="mainAudioUrl"
                                            value={formData.mainAudioUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://..."
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Audio Duration (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            name="audioDuration"
                                            value={formData.audioDuration}
                                            onChange={handleInputChange}
                                            min={0}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Writing Tasks */}
                {isWriting && writingTasks.length > 0 && (
                    <div className="space-y-6">
                        {writingTasks.map((task, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaPen className="text-green-600" />
                                    Task {task.taskNumber}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Task Prompt *
                                        </label>
                                        <textarea
                                            value={task.prompt}
                                            onChange={(e) => updateWritingTask(index, "prompt", e.target.value)}
                                            rows={4}
                                            required
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    {/* Image Upload Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            📷 Task Image (Graph/Chart/Diagram)
                                        </label>

                                        {!task.imageUrl ? (
                                            <label className={`
                                                relative flex flex-col items-center justify-center 
                                                w-full h-40 border-2 border-dashed rounded-xl 
                                                cursor-pointer transition-all duration-200
                                                ${imageUploading[index]
                                                    ? "bg-green-50 border-green-300"
                                                    : "bg-gray-50 border-gray-300 hover:bg-green-50 hover:border-green-400"
                                                }
                                            `}>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        // Validate file type
                                                        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                                                        if (!validTypes.includes(file.type)) {
                                                            setError("Invalid file type. Please upload JPG, PNG, GIF, or WebP images.");
                                                            return;
                                                        }

                                                        // Validate file size (10MB max)
                                                        if (file.size > 10 * 1024 * 1024) {
                                                            setError("File size too large. Maximum allowed is 10MB.");
                                                            return;
                                                        }

                                                        setImageUploading(prev => ({ ...prev, [index]: true }));
                                                        setImageProgress(prev => ({ ...prev, [index]: "Uploading image..." }));
                                                        setError("");

                                                        try {
                                                            const result = await uploadAPI.uploadImage(file);
                                                            if (result.success) {
                                                                updateWritingTask(index, "imageUrl", result.data.url);
                                                                setImageProgress(prev => ({ ...prev, [index]: "Upload complete!" }));
                                                                setTimeout(() => {
                                                                    setImageProgress(prev => ({ ...prev, [index]: "" }));
                                                                }, 2000);
                                                            }
                                                        } catch (err) {
                                                            setError(err.message || "Failed to upload image");
                                                            setImageProgress(prev => ({ ...prev, [index]: "" }));
                                                        } finally {
                                                            setImageUploading(prev => ({ ...prev, [index]: false }));
                                                        }
                                                    }}
                                                    disabled={imageUploading[index]}
                                                    className="hidden"
                                                />

                                                {imageUploading[index] ? (
                                                    <div className="flex flex-col items-center">
                                                        <FaSpinner className="text-3xl text-green-600 animate-spin mb-2" />
                                                        <span className="text-green-600 font-medium">{imageProgress[index]}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <FaCloudUploadAlt className="text-4xl text-gray-400 mb-3" />
                                                        <span className="text-gray-600 font-medium">Click to upload image</span>
                                                        <span className="text-gray-400 text-sm mt-1">JPG, PNG, GIF, WebP (max 10MB)</span>
                                                    </div>
                                                )}
                                            </label>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-green-200">
                                                            <img
                                                                src={task.imageUrl}
                                                                alt="Task image"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-green-700 font-medium">Image uploaded!</p>
                                                            <p className="text-green-600 text-sm truncate max-w-xs">
                                                                {task.imageUrl.split('/').pop()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateWritingTask(index, "imageUrl", "")}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Or enter URL manually */}
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="h-px flex-1 bg-gray-200"></div>
                                            <span className="text-gray-400 text-sm">or enter URL manually</span>
                                            <div className="h-px flex-1 bg-gray-200"></div>
                                        </div>

                                        <input
                                            type="url"
                                            value={task.imageUrl || ""}
                                            onChange={(e) => updateWritingTask(index, "imageUrl", e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full mt-3 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Minimum Words
                                        </label>
                                        <input
                                            type="number"
                                            value={task.minWords}
                                            onChange={(e) => updateWritingTask(index, "minWords", Number(e.target.value))}
                                            min={1}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Speaking Parts */}
                {isSpeaking && (
                    <div className="space-y-6">
                        {/* Part 1 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMicrophone className="text-orange-600" />
                                Part 1 — Introduction & Interview
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={speakingPart1.duration}
                                    onChange={(e) => setSpeakingPart1(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                    min={1}
                                    className="w-32 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            {speakingPart1.topics.map((topic, tIndex) => (
                                <div key={tIndex} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <input
                                            type="text"
                                            value={topic.topicName}
                                            onChange={(e) => {
                                                const newTopics = [...speakingPart1.topics];
                                                newTopics[tIndex] = { ...newTopics[tIndex], topicName: e.target.value };
                                                setSpeakingPart1(prev => ({ ...prev, topics: newTopics }));
                                            }}
                                            placeholder="Topic name (e.g., Home & Accommodation)"
                                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        />
                                        {speakingPart1.topics.length > 1 && (
                                            <button type="button" onClick={() => {
                                                setSpeakingPart1(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== tIndex) }));
                                            }} className="ml-2 text-red-500 hover:bg-red-50 p-2 rounded-lg"><FaTrash className="text-sm" /></button>
                                        )}
                                    </div>
                                    {topic.questions.map((q, qIndex) => (
                                        <div key={qIndex} className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-gray-400 w-6">Q{qIndex + 1}</span>
                                            <input
                                                type="text"
                                                value={q}
                                                onChange={(e) => {
                                                    const newTopics = [...speakingPart1.topics];
                                                    const newQuestions = [...newTopics[tIndex].questions];
                                                    newQuestions[qIndex] = e.target.value;
                                                    newTopics[tIndex] = { ...newTopics[tIndex], questions: newQuestions };
                                                    setSpeakingPart1(prev => ({ ...prev, topics: newTopics }));
                                                }}
                                                placeholder="Enter question..."
                                                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                            />
                                            {topic.questions.length > 1 && (
                                                <button type="button" onClick={() => {
                                                    const newTopics = [...speakingPart1.topics];
                                                    newTopics[tIndex] = { ...newTopics[tIndex], questions: newTopics[tIndex].questions.filter((_, i) => i !== qIndex) };
                                                    setSpeakingPart1(prev => ({ ...prev, topics: newTopics }));
                                                }} className="text-red-400 hover:text-red-600 p-1"><FaTrash className="text-xs" /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const newTopics = [...speakingPart1.topics];
                                        newTopics[tIndex] = { ...newTopics[tIndex], questions: [...newTopics[tIndex].questions, ""] };
                                        setSpeakingPart1(prev => ({ ...prev, topics: newTopics }));
                                    }} className="text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded text-sm flex items-center gap-1 mt-1">
                                        <FaPlus className="text-xs" /> Add Question
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => {
                                setSpeakingPart1(prev => ({ ...prev, topics: [...prev.topics, { topicName: "", questions: [""] }] }));
                            }} className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-sm">
                                <FaPlus /> Add Topic
                            </button>
                        </div>

                        {/* Part 2 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMicrophone className="text-orange-600" />
                                Part 2 — Individual Long Turn (Cue Card)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                    <input type="text" value={speakingPart2.topic}
                                        onChange={(e) => setSpeakingPart2(prev => ({ ...prev, topic: e.target.value }))}
                                        placeholder="e.g., Describe a time when you helped someone"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cue Card Text</label>
                                    <textarea value={speakingPart2.cueCard}
                                        onChange={(e) => setSpeakingPart2(prev => ({ ...prev, cueCard: e.target.value }))}
                                        rows={3} placeholder="Describe a time when..."
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bullet Points</label>
                                    {speakingPart2.bulletPoints.map((bp, bpIdx) => (
                                        <div key={bpIdx} className="flex items-center gap-2 mb-2">
                                            <span className="text-gray-400">•</span>
                                            <input type="text" value={bp}
                                                onChange={(e) => {
                                                    const newBps = [...speakingPart2.bulletPoints];
                                                    newBps[bpIdx] = e.target.value;
                                                    setSpeakingPart2(prev => ({ ...prev, bulletPoints: newBps }));
                                                }}
                                                placeholder="Bullet point..."
                                                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" />
                                            {speakingPart2.bulletPoints.length > 1 && (
                                                <button type="button" onClick={() => {
                                                    setSpeakingPart2(prev => ({ ...prev, bulletPoints: prev.bulletPoints.filter((_, i) => i !== bpIdx) }));
                                                }} className="text-red-400 hover:text-red-600 p-1"><FaTrash className="text-xs" /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        setSpeakingPart2(prev => ({ ...prev, bulletPoints: [...prev.bulletPoints, ""] }));
                                    }} className="text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded text-sm flex items-center gap-1">
                                        <FaPlus className="text-xs" /> Add Bullet Point
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Question</label>
                                    <input type="text" value={speakingPart2.followUpQuestion}
                                        onChange={(e) => setSpeakingPart2(prev => ({ ...prev, followUpQuestion: e.target.value }))}
                                        placeholder="Follow-up question after cue card..."
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
                                        <input type="number" value={speakingPart2.preparationTime}
                                            onChange={(e) => setSpeakingPart2(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                                            min={1} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Speaking Time (min)</label>
                                        <input type="number" value={speakingPart2.speakingTime}
                                            onChange={(e) => setSpeakingPart2(prev => ({ ...prev, speakingTime: Number(e.target.value) }))}
                                            min={1} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Part 3 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMicrophone className="text-orange-600" />
                                Part 3 — Two-way Discussion
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discussion Topic</label>
                                    <input type="text" value={speakingPart3.topic}
                                        onChange={(e) => setSpeakingPart3(prev => ({ ...prev, topic: e.target.value }))}
                                        placeholder="e.g., Helping others in the community"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                    <input type="number" value={speakingPart3.duration}
                                        onChange={(e) => setSpeakingPart3(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                        min={1} className="w-32 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Questions</label>
                                    {speakingPart3.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-gray-400 w-6">Q{qIdx + 1}</span>
                                            <input type="text" value={q}
                                                onChange={(e) => {
                                                    const newQs = [...speakingPart3.questions];
                                                    newQs[qIdx] = e.target.value;
                                                    setSpeakingPart3(prev => ({ ...prev, questions: newQs }));
                                                }}
                                                placeholder="Enter discussion question..."
                                                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" />
                                            {speakingPart3.questions.length > 1 && (
                                                <button type="button" onClick={() => {
                                                    setSpeakingPart3(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIdx) }));
                                                }} className="text-red-400 hover:text-red-600 p-1"><FaTrash className="text-xs" /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        setSpeakingPart3(prev => ({ ...prev, questions: [...prev.questions, ""] }));
                                    }} className="text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded text-sm flex items-center gap-1">
                                        <FaPlus className="text-xs" /> Add Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sections */}
                {!isWriting && !isSpeaking && sections.length > 0 && (
                    <div className="space-y-6">
                        {sections.map((section, sIndex) => (
                            <div key={sIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => updateSection(sIndex, "title", e.target.value)}
                                        className="font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-cyan-500 focus:outline-none px-1"
                                    />
                                    {sections.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSection(sIndex)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Section Instructions
                                            </label>
                                            <input
                                                type="text"
                                                value={section.instructions || ""}
                                                onChange={(e) => updateSection(sIndex, "instructions", e.target.value)}
                                                placeholder="e.g., Write ONE WORD AND/OR A NUMBER for each answer."
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                            />
                                        </div>

                                        {formData.setType === "READING" ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reading Passage
                                                </label>
                                                <textarea
                                                    value={section.passage || ""}
                                                    onChange={(e) => updateSection(sIndex, "passage", e.target.value)}
                                                    rows={10}
                                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 font-serif text-lg leading-relaxed"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Listening Passage / Context (Optional)
                                                </label>
                                                <p className="text-[10px] text-gray-400 mb-1 italic">Use {'{1}'}, {'{2}'} etc. to create inline blanks mapped to questions.</p>
                                                <textarea
                                                    value={section.passage || ""}
                                                    onChange={(e) => updateSection(sIndex, "passage", e.target.value)}
                                                    rows={6}
                                                    placeholder="Regular activities&#10;Beach&#10;- making sure the beach does not have {1} on it"
                                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium text-gray-700">
                                                Questions ({section.questions?.length || 0})
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => addQuestion(sIndex)}
                                                className="text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                            >
                                                <FaPlus /> Add
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {section.questions?.map((question, qIndex) => (
                                                <div key={qIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                                                            Q{qIndex + 1}
                                                        </span>
                                                        {section.questions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQuestion(sIndex, qIndex)}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                            >
                                                                <FaTrash className="text-sm" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <select
                                                            value={question.questionType}
                                                            onChange={(e) => updateQuestion(sIndex, qIndex, "questionType", e.target.value)}
                                                            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                                        >
                                                            {QUESTION_TYPES.map((type) => (
                                                                <option key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={question.correctAnswer}
                                                            onChange={(e) => updateQuestion(sIndex, qIndex, "correctAnswer", e.target.value)}
                                                            placeholder="Correct Answer"
                                                            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={question.questionText}
                                                        onChange={(e) => updateQuestion(sIndex, qIndex, "questionText", e.target.value)}
                                                        placeholder="Question text..."
                                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 mb-2"
                                                    />
                                                    {question.questionType === "multiple-choice" && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(question.options || ["", "", "", ""]).map((opt, optIdx) => (
                                                                <input
                                                                    key={optIdx}
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => updateQuestionOption(sIndex, qIndex, optIdx, e.target.value)}
                                                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                                    className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addSection}
                            className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <FaPlus /> Add Section
                        </button>
                    </div>
                )}

                {/* Error Modal */}
                {error && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Occurred</h3>
                                    <p className="text-gray-600 text-sm whitespace-pre-wrap break-words">
                                        {error.includes("Validation failed")
                                            ? "Please check all required fields are filled correctly."
                                            : error
                                        }
                                    </p>
                                    {error.includes("Validation failed") && (
                                        <details className="mt-3">
                                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                                Technical Details
                                            </summary>
                                            <pre className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded overflow-auto max-h-40">
                                                {error}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-4 sticky bottom-4 bg-white p-4 rounded-xl border border-gray-200 shadow-lg">
                    <Link
                        href={`/dashboard/admin/question-sets/${params.id}`}
                        className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
