"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaPlay,
    FaClock,
    FaQuestionCircle,
    FaArrowRight,
    FaLayerGroup,
    FaSpinner,
    FaUser,
    FaCheckCircle,
    FaLock
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

    // System Check States
    const [systemChecked, setSystemChecked] = useState(false);
    const [checkStep, setCheckStep] = useState(1);
    const [testAudioPlaying, setTestAudioPlaying] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = React.useRef(null);

    // Audio/Visual states
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedOutput, setSelectedOutput] = useState("");
    const [micVolume, setMicVolume] = useState(0);
    const audioContextRef = React.useRef(null);
    const analyserRef = React.useRef(null);
    const animationFrameRef = React.useRef(null);

    // Recording states for mic test
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    // UI Settings
    const [displaySettings, setDisplaySettings] = useState({
        fontSize: 'standard',
        theme: 'standard',
    });

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

    // Handle Media and Devices for system check
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first to get device labels
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const outputs = devices.filter(d => d.kind === 'audiooutput');
                setAudioDevices(outputs);
                if (outputs.length > 0) setSelectedOutput(outputs[0].deviceId);
            } catch (err) {
                console.error("Error enumeration devices:", err);
            }
        };
        getDevices();

        if (checkStep === 2 && !cameraStream) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    setCameraStream(stream);
                    if (videoRef.current) videoRef.current.srcObject = stream;

                    // Setup Audio Visualizer
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 256;

                    audioContextRef.current = audioContext;
                    analyserRef.current = analyser;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const updateVolume = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);
                        const volume = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                        setMicVolume(volume);
                        animationFrameRef.current = requestAnimationFrame(updateVolume);
                    };
                    updateVolume();
                })
                .catch(err => console.error("Media access error:", err));
        }
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [checkStep]);

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

    // Exam modules configuration
    const examModules = [
        {
            id: "listening",
            name: "Listening",
            icon: <FaHeadphones className="text-2xl" />,
            duration: 40,
            questions: 40,
            sections: 4,
            description: "Audio-based comprehension",
            details: "4 recordings: conversations & lectures",
            color: "cyan",
            setNumber: session?.assignedSets?.listeningSetNumber
        },
        {
            id: "reading",
            name: "Reading",
            icon: <FaBook className="text-2xl" />,
            duration: 60,
            questions: 40,
            sections: 3,
            description: "Academic passage analysis",
            details: "3 passages with increasing difficulty",
            color: "blue",
            setNumber: session?.assignedSets?.readingSetNumber
        },
        {
            id: "writing",
            name: "Writing",
            icon: <FaPen className="text-2xl" />,
            duration: 60,
            questions: 2,
            sections: 2,
            description: "Academic writing tasks",
            details: "Task 1: 150 words • Task 2: 250 words",
            color: "green",
            setNumber: session?.assignedSets?.writingSetNumber
        }
    ];

    const totalTime = examModules.reduce((sum, m) => sum + m.duration, 0);
    const totalQuestions = examModules.reduce((sum, m) => sum + m.questions, 0);

    const handleStartModule = (moduleId) => {
        router.push(`/exam/${sessionId}/${moduleId}`);
    };

    const handleStartFullExam = () => {
        router.push(`/exam/${sessionId}/full`);
    };

    // ── System Check Overlay ──
    if (!systemChecked && completedModules.length < 3) {
        return (
            <div className="min-h-screen bg-[#4b4b4b] flex items-center justify-center p-6 transition-all duration-500">
                <div className="max-w-xl w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-600">
                    <div className="bg-[#1f2937] px-6 py-4 flex items-center justify-between">
                        <h2 className="text-white font-bold flex items-center gap-2">
                            <FaUser size={14} /> System Check
                        </h2>
                        <div className="flex gap-2">
                            {[1, 2].map(s => (
                                <div key={s} className={`w-2 h-2 rounded-full ${checkStep === s ? 'bg-cyan-400' : 'bg-gray-600'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 text-center">
                        {checkStep === 1 && (
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaHeadphones size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Check Your Audio</h3>
                                <p className="text-gray-600 text-sm">
                                    Select your speaker/headphones and play the test sound.
                                </p>

                                <div className="max-w-xs mx-auto text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Output Device</label>
                                    <select
                                        value={selectedOutput}
                                        onChange={(e) => setSelectedOutput(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        {audioDevices.length > 0 ? (
                                            audioDevices.map(d => (
                                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 5)}`}</option>
                                            ))
                                        ) : (
                                            <option value="">Default Speaker</option>
                                        )}
                                    </select>
                                </div>

                                <button
                                    onClick={async () => {
                                        const voiceAudio = new Audio("https://ielts-gateway.com/wp-content/uploads/2022/10/Listening-Introduction.mp3");
                                        if (voiceAudio.setSinkId && selectedOutput) {
                                            await voiceAudio.setSinkId(selectedOutput);
                                        }
                                        voiceAudio.play().catch(e => console.error("Audio play failed:", e));
                                        setTestAudioPlaying(true);
                                        voiceAudio.onended = () => setTestAudioPlaying(false);
                                        setTimeout(() => setTestAudioPlaying(false), 5000);
                                    }}
                                    className={`px-8 py-4 rounded-md font-bold text-sm transition-all border-2 flex items-center justify-center gap-3 mx-auto ${testAudioPlaying ? 'bg-cyan-50 border-cyan-500 text-cyan-600' : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-cyan-400'}`}
                                >
                                    <FaPlay size={14} />
                                    {testAudioPlaying ? "Playing Demo Audio..." : "Play Test Voice Audio"}
                                </button>
                                <div className="pt-8">
                                    <button onClick={() => setCheckStep(2)} className="bg-black text-white px-8 py-3 rounded font-bold hover:bg-gray-900 w-full flex items-center justify-center gap-3">
                                        I can hear the sound <FaArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {checkStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-800">Video & Microphone Check</h3>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden border-4 border-gray-800 shadow-inner relative">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <div className="bg-black/60 px-3 py-1 rounded text-[10px] text-white flex items-center gap-2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> LIVE CAMERA
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-left">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Microphone Verification</p>
                                        {isRecording && <span className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded animate-pulse">
                                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> RECORDING
                                        </span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <button
                                            onClick={() => {
                                                if (!isRecording) {
                                                    chunksRef.current = [];
                                                    const mediaRecorder = new MediaRecorder(cameraStream);
                                                    mediaRecorderRef.current = mediaRecorder;
                                                    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
                                                    mediaRecorder.onstop = () => {
                                                        const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
                                                        setRecordedUrl(URL.createObjectURL(blob));
                                                    };
                                                    mediaRecorder.start();
                                                    setIsRecording(true);
                                                    setTimeout(() => {
                                                        if (mediaRecorder.state === 'recording') {
                                                            mediaRecorder.stop();
                                                            setIsRecording(false);
                                                        }
                                                    }, 3000);
                                                }
                                            }}
                                            disabled={isRecording}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs border-2 transition-all ${isRecording ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-500'}`}
                                        >
                                            <FaMicrophone size={12} />
                                            {isRecording ? "Recording..." : "Record 3s Voice"}
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (recordedUrl) {
                                                    const audio = new Audio(recordedUrl);
                                                    audio.play();
                                                }
                                            }}
                                            disabled={!recordedUrl || isRecording}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs border-2 transition-all ${!recordedUrl ? 'bg-gray-50 border-gray-100 text-gray-300' : 'bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100'}`}
                                        >
                                            <FaPlay size={10} />
                                            Play Back Voice
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden flex items-center px-1">
                                            <div
                                                className="h-1.5 bg-cyan-500 rounded-full transition-all duration-75"
                                                style={{ width: `${Math.min(100, (micVolume / 100) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic text-center">Speak now to see the volume bar bounce. Record and play back to verify.</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={() => {
                                            setSystemChecked(true);
                                            localStorage.setItem('examSettings', JSON.stringify(displaySettings));
                                        }}
                                        className="bg-[#1a56db] text-white px-8 py-4 rounded font-bold hover:bg-[#1e429f] w-full flex items-center justify-center gap-3 shadow-xl"
                                    >
                                        Confirm & Go to Exam <FaArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic styles based on settings
    const themeStyles = {
        standard: "bg-white text-gray-900 border-gray-200",
        yellow: "bg-[#fff9c4] text-black border-[#fbc02d]",
        blue: "bg-[#e3f2fd] text-black border-[#90caf9]",
        'high-contrast': "bg-black text-white border-gray-800",
    }[displaySettings.theme];

    const fontStyles = {
        standard: "text-base",
        large: "text-lg",
        'extra-large': "text-xl",
    }[displaySettings.fontSize];

    return (
        <div className="min-h-screen bg-white transition-colors duration-300">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaUser className="text-cyan-600" />
                            <span>{session?.studentName || "Student"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded">
                            <span>ID: <span className="font-mono font-semibold text-gray-700">{session?.examId}</span></span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-10">
                {completedModules.length >= 3 ? (
                    <div className="max-w-2xl mx-auto text-center py-10 px-6 bg-white rounded-md border border-gray-200 shadow-sm relative">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
                                <FaCheckCircle className="text-3xl" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Congratulations!
                            </h1>
                            <h2 className="text-lg font-medium text-green-600 mb-6">
                                Examination Completed Successfully
                            </h2>

                            <div className="max-w-xl mx-auto space-y-4">
                                <p className="text-gray-600 text-base">
                                    Thank you, <span className="font-semibold text-gray-800">{session?.studentName}</span>! You have successfully finished all modules.
                                </p>

                                <div className="bg-gray-50 border border-gray-200 rounded-md p-6 my-6 text-left">
                                    <p className="text-gray-800 text-sm font-semibold mb-4 tracking-tight uppercase">
                                        SUBMISSION CONFIRMED
                                    </p>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <FaUser className="text-xs text-cyan-600" />
                                            <p className="text-sm text-gray-700 font-medium">Login with Exam ID & Password for results</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FaQuestionCircle className="text-xs text-green-600" />
                                            <p className="text-sm text-gray-700 font-medium">Contact support team for assistance</p>
                                        </div>
                                    </div>

                                    <p className="text-amber-600 text-[11px] border-t border-gray-200 pt-3 italic">
                                        * Writing results available in 24-48 hours.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("examSession");
                                        router.push("/");
                                    }}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-gray-900 text-white rounded-md font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    Go to Home
                                    <FaArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Student Login
                                </button>
                            </div>

                            <p className="mt-8 text-gray-400 text-xs uppercase tracking-widest font-mono">
                                ID: {session?.examId}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                IELTS Academic Test
                            </h1>
                            <p className="text-gray-500">
                                Welcome, {session?.studentName}! Select a module to start your exam.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-cyan-600">{totalQuestions}</p>
                                <p className="text-gray-500 text-sm">Total Questions</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-amber-500">{totalTime}</p>
                                <p className="text-gray-500 text-sm">Minutes</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">9.0</p>
                                <p className="text-gray-500 text-sm">Max Band</p>
                            </div>
                        </div>

                        <div
                            onClick={handleStartFullExam}
                            className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-6 mb-8 cursor-pointer hover:border-cyan-400 transition-colors"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-cyan-600 rounded-xl flex items-center justify-center text-white">
                                        <FaLayerGroup className="text-2xl" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-bold text-gray-800">Complete IELTS Exam</h2>
                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">Recommended</span>
                                        </div>
                                        <p className="text-gray-500 mb-3">Take all three sections: Listening → Reading → Writing</p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                            <span className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200">
                                                <FaClock className="text-cyan-600" />
                                                {totalTime} minutes
                                            </span>
                                            <span className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200">
                                                <FaQuestionCircle className="text-cyan-600" />
                                                {totalQuestions} questions
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors cursor-pointer">
                                    <FaPlay />
                                    Start Full Exam
                                    <FaArrowRight className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-sm">OR PRACTICE INDIVIDUAL SECTIONS</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {examModules.map((module) => {
                                const hasSet = module.setNumber != null;
                                const isCompleted = completedModules.includes(module.id);

                                return (
                                    <div
                                        key={module.id}
                                        onClick={() => hasSet && !isCompleted && handleStartModule(module.id)}
                                        className={`bg-white border-2 rounded-lg p-5 transition-all relative ${isCompleted
                                            ? "border-green-400 bg-green-50 cursor-not-allowed"
                                            : hasSet
                                                ? "border-gray-200 cursor-pointer hover:border-cyan-400 hover:shadow-md"
                                                : "border-gray-100 opacity-60 cursor-not-allowed"
                                            }`}
                                    >
                                        {isCompleted && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                <FaCheckCircle className="text-xs" />
                                                Completed
                                            </div>
                                        )}

                                        <div className={`w-14 h-14 ${isCompleted
                                            ? 'bg-green-100 text-green-600'
                                            : module.color === 'cyan'
                                                ? 'bg-cyan-100 text-cyan-600'
                                                : module.color === 'blue'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-green-100 text-green-600'
                                            } rounded-xl flex items-center justify-center mb-4`}>
                                            {isCompleted ? <FaCheckCircle className="text-2xl" /> : module.icon}
                                        </div>

                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800">{module.name}</h3>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-1">{module.description}</p>
                                        <p className="text-gray-400 text-xs mb-4">{module.details}</p>

                                        {!isCompleted && (
                                            <div className="space-y-2 mb-4 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Duration</span>
                                                    <span className="text-gray-800 font-medium">{module.duration} mins</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Questions</span>
                                                    <span className="text-gray-800 font-medium">{module.questions}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Sections</span>
                                                    <span className="text-gray-800 font-medium">{module.sections}</span>
                                                </div>
                                            </div>
                                        )}

                                        {isCompleted ? (
                                            <div className="w-full flex items-center justify-center gap-2 bg-green-200 text-green-700 py-2.5 rounded-lg font-medium">
                                                <FaLock className="text-sm" />
                                                Already Completed
                                            </div>
                                        ) : hasSet ? (
                                            <button className={`w-full flex items-center justify-center gap-3 ${module.color === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-700' : module.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg cursor-pointer group`}>
                                                <FaPlay className="text-sm transition-transform group-hover:scale-110" />
                                                <span>Start {module.name}</span>
                                                <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
                                            </button>
                                        ) : (
                                            <div className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-2.5 rounded-lg font-medium">
                                                Not Assigned
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <footer className="bg-white border-t border-gray-200 py-4 px-4 mt-auto">
                <div className="max-w-5xl mx-auto text-center text-gray-400 text-sm">
                    © 2024 BAC IELTS ACADEMY • OFFICIAL EXAMINATION PORTAL
                </div>
            </footer>
        </div>
    );
}
