"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FaArrowLeft,
    FaUserGraduate,
    FaSpinner,
    FaCheck,
    FaCopy,
    FaEnvelope,
    FaPhone,
    FaIdCard,
    FaCalendar,
    FaMoneyBillWave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaTimes,
    FaExclamationTriangle,
} from "react-icons/fa";
import { studentsAPI, questionSetsAPI } from "@/lib/api";

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === "error" ? "bg-red-500" : type === "success" ? "bg-green-500" : "bg-yellow-500";
    const Icon = type === "error" ? FaTimes : type === "success" ? FaCheck : FaExclamationTriangle;

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-md animate-slide-in`}>
            <div className="flex-shrink-0 mt-0.5">
                <Icon className="text-lg" />
            </div>
            <div className="flex-1">
                <p className="font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="flex-shrink-0 hover:bg-white/20 p-1 rounded">
                <FaTimes />
            </button>
        </div>
    );
};

// Field Error Display
const FieldError = ({ error }) => {
    if (!error) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <FaExclamationTriangle className="text-[10px]" />
            {error}
        </p>
    );
};

// Parse error from API response
const parseApiError = (error) => {
    // If it's an array of validation errors
    if (Array.isArray(error)) {
        const fieldErrors = {};
        let generalMessage = "";

        error.forEach((err) => {
            // Handle new format with 'field' property (e.g., "body.nidNumber" -> "nidNumber")
            let fieldName = err.field?.split(".")?.pop() || err.path?.[err.path.length - 1] || "general";
            const message = err.message || "Invalid value";

            if (fieldName === "general" || fieldName === "body" || !fieldName) {
                generalMessage += message + " ";
            } else {
                fieldErrors[fieldName] = message;
            }
        });

        return { fieldErrors, generalMessage: generalMessage.trim() || "Please fix the highlighted errors" };
    }

    // If it's a string message
    if (typeof error === "string") {
        return { fieldErrors: {}, generalMessage: error };
    }

    // If it's an object with errors array
    if (error?.errors && Array.isArray(error.errors)) {
        return parseApiError(error.errors);
    }

    // If it's an object with message
    if (error?.message) {
        return { fieldErrors: {}, generalMessage: error.message };
    }

    return { fieldErrors: {}, generalMessage: "An unexpected error occurred" };
};

export default function CreateStudentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [toast, setToast] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [copiedField, setCopiedField] = useState(null);

    // Question set options
    const [listeningSets, setListeningSets] = useState([]);
    const [readingSets, setReadingSets] = useState([]);
    const [writingSets, setWritingSets] = useState([]);
    const [speakingSets, setSpeakingSets] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        nameEnglish: "",
        nameBengali: "",
        email: "",
        phone: "",
        nidNumber: "",
        examDate: "",
        paymentStatus: "paid",
        paymentAmount: 5000,
        paymentMethod: "cash",
        paymentReference: "",
        listeningSetNumber: "",
        readingSetNumber: "",
        writingSetNumber: "",
        speakingSetNumber: "",
    });

    useEffect(() => {
        fetchQuestionSets();
    }, []);

    const fetchQuestionSets = async () => {
        try {
            const [listeningRes, readingRes, writingRes, speakingRes] = await Promise.all([
                questionSetsAPI.getSummary("LISTENING").catch(() => ({ data: [] })),
                questionSetsAPI.getSummary("READING").catch(() => ({ data: [] })),
                questionSetsAPI.getSummary("WRITING").catch(() => ({ data: [] })),
                questionSetsAPI.getSummary("SPEAKING").catch(() => ({ data: [] })),
            ]);

            setListeningSets(listeningRes.data || []);
            setReadingSets(readingRes.data || []);
            setWritingSets(writingRes.data || []);
            setSpeakingSets(speakingRes.data || []);
        } catch (error) {
            console.error("Failed to fetch question sets:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.nameEnglish.trim()) {
            errors.nameEnglish = "Full name is required";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!/^01[3-9]\d{8}$/.test(formData.phone)) {
            errors.phone = "Please enter a valid 11-digit BD phone number";
        }

        if (formData.nidNumber && !/^\d{10}$|^\d{17}$/.test(formData.nidNumber)) {
            errors.nidNumber = "NID must be 10 or 17 digits only";
        }

        if (!formData.examDate) {
            errors.examDate = "Exam date is required";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        // Client-side validation
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setToast({ message: "Please fix the highlighted errors", type: "error" });
            return;
        }

        setLoading(true);

        try {
            // Prepare data
            const studentData = {
                ...formData,
                examDate: new Date(formData.examDate).toISOString(),
                listeningSetNumber: formData.listeningSetNumber ? Number(formData.listeningSetNumber) : undefined,
                readingSetNumber: formData.readingSetNumber ? Number(formData.readingSetNumber) : undefined,
                writingSetNumber: formData.writingSetNumber ? Number(formData.writingSetNumber) : undefined,
                speakingSetNumber: formData.speakingSetNumber ? Number(formData.speakingSetNumber) : undefined,
            };

            // Remove empty fields
            Object.keys(studentData).forEach(key => {
                if (studentData[key] === "" || studentData[key] === undefined) {
                    delete studentData[key];
                }
            });

            const response = await studentsAPI.create(studentData);

            if (response.success && response.data) {
                setToast({ message: "Student registered successfully!", type: "success" });
                // Redirect to students list after a short delay
                setTimeout(() => {
                    router.push("/dashboard/admin/students");
                }, 2000);
            }
        } catch (err) {
            // Parse the error
            let errorData = err.message || "Failed to register student";

            // Try to parse JSON error if it's a string
            try {
                if (typeof errorData === "string" && errorData.startsWith("[")) {
                    errorData = JSON.parse(errorData);
                }
            } catch (e) {
                // Not JSON, use as-is
            }

            const { fieldErrors: parsedFieldErrors, generalMessage } = parseApiError(errorData);

            if (Object.keys(parsedFieldErrors).length > 0) {
                setFieldErrors(parsedFieldErrors);
            }

            setToast({ message: generalMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getInputClass = (fieldName) => {
        const baseClass = "w-full border rounded-lg px-4 py-2.5 focus:outline-none transition-colors";
        if (fieldErrors[fieldName]) {
            return `${baseClass} border-red-400 bg-red-50 focus:border-red-500`;
        }
        return `${baseClass} border-gray-200 focus:border-cyan-500`;
    };

    // Success Screen
    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheck className="text-green-600 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Registered Successfully!</h2>
                    <p className="text-gray-500 mb-6">
                        Share the following credentials with the student for exam access.
                    </p>

                    {/* Credentials Card */}
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-200 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Login Credentials</h3>

                        <div className="space-y-4">
                            {/* Exam ID */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-cyan-100">
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">Exam ID</p>
                                    <p className="font-mono font-bold text-cyan-600 text-lg">
                                        {success.credentials.examId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(success.credentials.examId, "examId")}
                                    className="p-2 hover:bg-cyan-50 rounded-lg text-gray-400 hover:text-cyan-600"
                                >
                                    {copiedField === "examId" ? <FaCheck className="text-green-500" /> : <FaCopy />}
                                </button>
                            </div>

                            {/* Email */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-cyan-100">
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">Email (Username)</p>
                                    <p className="font-medium text-gray-800">{success.credentials.email}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(success.credentials.email, "email")}
                                    className="p-2 hover:bg-cyan-50 rounded-lg text-gray-400 hover:text-cyan-600"
                                >
                                    {copiedField === "email" ? <FaCheck className="text-green-500" /> : <FaCopy />}
                                </button>
                            </div>

                            {/* Password */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-cyan-100">
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">Password</p>
                                    <p className="font-mono font-medium text-gray-800">{success.credentials.password}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(success.credentials.password, "password")}
                                    className="p-2 hover:bg-cyan-50 rounded-lg text-gray-400 hover:text-cyan-600"
                                >
                                    {copiedField === "password" ? <FaCheck className="text-green-500" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            * Password is automatically generated from phone number
                        </p>
                    </div>

                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Name</p>
                                <p className="font-medium text-gray-800">{success.student.nameEnglish}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Exam Date</p>
                                <p className="font-medium text-gray-800">
                                    {new Date(success.student.examDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setSuccess(null);
                                setFormData({
                                    nameEnglish: "",
                                    nameBengali: "",
                                    email: "",
                                    phone: "",
                                    nidNumber: "",
                                    examDate: "",
                                    paymentStatus: "paid",
                                    paymentAmount: 5000,
                                    paymentMethod: "cash",
                                    paymentReference: "",
                                    listeningSetNumber: "",
                                    readingSetNumber: "",
                                    writingSetNumber: "",
                                    speakingSetNumber: "",
                                });
                            }}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            Register Another
                        </button>
                        <Link
                            href="/dashboard/admin/students"
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700"
                        >
                            View All Students
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* CSS for animation */}
            <style jsx global>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/admin/students"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Register New Student</h1>
                    <p className="text-gray-500">Create a new student account with exam ID</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUserGraduate className="text-cyan-600" />
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name (English) *
                            </label>
                            <input
                                type="text"
                                name="nameEnglish"
                                value={formData.nameEnglish}
                                onChange={handleInputChange}
                                className={getInputClass("nameEnglish")}
                                placeholder="e.g., Mohammad Rahman"
                            />
                            <FieldError error={fieldErrors.nameEnglish} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name (Bengali)
                            </label>
                            <input
                                type="text"
                                name="nameBengali"
                                value={formData.nameBengali}
                                onChange={handleInputChange}
                                className={getInputClass("nameBengali")}
                                placeholder="e.g., মোহাম্মদ রহমান"
                            />
                            <FieldError error={fieldErrors.nameBengali} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaEnvelope className="inline mr-1 text-gray-400" />
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={getInputClass("email")}
                                placeholder="student@email.com"
                            />
                            <FieldError error={fieldErrors.email} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="inline mr-1 text-gray-400" />
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={getInputClass("phone")}
                                placeholder="01712345678"
                            />
                            <FieldError error={fieldErrors.phone} />
                            <p className="text-xs text-gray-500 mt-1">This will be used as the student's password</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaIdCard className="inline mr-1 text-gray-400" />
                                NID / Voter ID Number (Optional)
                            </label>
                            <input
                                type="text"
                                name="nidNumber"
                                value={formData.nidNumber}
                                onChange={handleInputChange}
                                className={getInputClass("nidNumber")}
                                placeholder="10 or 17 number (optional)"
                            />
                            <FieldError error={fieldErrors.nidNumber} />
                        </div>
                    </div>
                </div>

                {/* Exam Date */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaCalendar className="text-cyan-600" />
                        Exam Schedule
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exam Date *
                        </label>
                        <input
                            type="date"
                            name="examDate"
                            value={formData.examDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split("T")[0]}
                            className={getInputClass("examDate")}
                        />
                        <FieldError error={fieldErrors.examDate} />
                    </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaMoneyBillWave className="text-cyan-600" />
                        Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Status *
                            </label>
                            <select
                                name="paymentStatus"
                                value={formData.paymentStatus}
                                onChange={handleInputChange}
                                className={getInputClass("paymentStatus")}
                            >
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                            <FieldError error={fieldErrors.paymentStatus} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Amount (BDT) *
                            </label>
                            <input
                                type="number"
                                name="paymentAmount"
                                value={formData.paymentAmount}
                                onChange={handleInputChange}
                                min={0}
                                className={getInputClass("paymentAmount")}
                            />
                            <FieldError error={fieldErrors.paymentAmount} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method *
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className={getInputClass("paymentMethod")}
                            >
                                <option value="cash">Cash</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                            <FieldError error={fieldErrors.paymentMethod} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Reference / TrxID
                            </label>
                            <input
                                type="text"
                                name="paymentReference"
                                value={formData.paymentReference}
                                onChange={handleInputChange}
                                className={getInputClass("paymentReference")}
                                placeholder="Transaction ID or reference"
                            />
                            <FieldError error={fieldErrors.paymentReference} />
                        </div>
                    </div>
                </div>

                {/* Question Sets Assignment */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Assign Question Sets</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Select which question sets this student will receive (optional - can be assigned later)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaHeadphones className="inline mr-1 text-purple-500" />
                                Listening Set
                            </label>
                            <select
                                name="listeningSetNumber"
                                value={formData.listeningSetNumber}
                                onChange={handleInputChange}
                                className={getInputClass("listeningSetNumber")}
                            >
                                <option value="">Select a set...</option>
                                {listeningSets.map((set) => (
                                    <option key={set._id} value={set.setNumber}>
                                        Set #{set.setNumber} - {set.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaBook className="inline mr-1 text-blue-500" />
                                Reading Set
                            </label>
                            <select
                                name="readingSetNumber"
                                value={formData.readingSetNumber}
                                onChange={handleInputChange}
                                className={getInputClass("readingSetNumber")}
                            >
                                <option value="">Select a set...</option>
                                {readingSets.map((set) => (
                                    <option key={set._id} value={set.setNumber}>
                                        Set #{set.setNumber} - {set.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPen className="inline mr-1 text-green-500" />
                                Writing Set
                            </label>
                            <select
                                name="writingSetNumber"
                                value={formData.writingSetNumber}
                                onChange={handleInputChange}
                                className={getInputClass("writingSetNumber")}
                            >
                                <option value="">Select a set...</option>
                                {writingSets.map((set) => (
                                    <option key={set._id} value={set.setNumber}>
                                        Set #{set.setNumber} - {set.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Speaking Set selection hidden */}
                        {false && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaMicrophone className="inline mr-1 text-orange-500" />
                                    Speaking Set
                                </label>
                                <select
                                    name="speakingSetNumber"
                                    value={formData.speakingSetNumber}
                                    onChange={handleInputChange}
                                    className={getInputClass("speakingSetNumber")}
                                >
                                    <option value="">Select a set...</option>
                                    {speakingSets.map((set) => (
                                        <option key={set._id} value={set.setNumber}>
                                            Set #{set.setNumber} - {set.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Link
                        href="/dashboard/admin/students"
                        className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <FaSpinner className="animate-spin" />}
                        Register Student
                    </button>
                </div>
            </form>
        </div>
    );
}
