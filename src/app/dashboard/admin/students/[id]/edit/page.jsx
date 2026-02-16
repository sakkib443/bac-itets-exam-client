"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaUserGraduate,
    FaEnvelope,
    FaPhone,
    FaCalendar,
    FaMoneyBillWave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
} from "react-icons/fa";
import { studentsAPI, questionSetsAPI } from "@/lib/api";

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Question set options
    const [listeningSets, setListeningSets] = useState([]);
    const [readingSets, setReadingSets] = useState([]);
    const [writingSets, setWritingSets] = useState([]);
    const [speakingSets, setSpeakingSets] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        nameEnglish: "",
        nameBengali: "",
        phone: "",
        nidNumber: "",
        examDate: "",
        paymentStatus: "pending",
        paymentAmount: 0,
        paymentMethod: "cash",
        paymentReference: "",
        listeningSetNumber: "",
        readingSetNumber: "",
        writingSetNumber: "",
        speakingSetNumber: "",
        isActive: true,
        canRetake: false,
    });

    useEffect(() => {
        if (params.id) {
            fetchStudent();
            fetchQuestionSets();
        }
    }, [params.id]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const response = await studentsAPI.getById(params.id);

            if (response.success && response.data) {
                const student = response.data;
                setFormData({
                    nameEnglish: student.nameEnglish || "",
                    nameBengali: student.nameBengali || "",
                    phone: student.phone || "",
                    nidNumber: student.nidNumber || "",
                    examDate: student.examDate ? new Date(student.examDate).toISOString().split("T")[0] : "",
                    paymentStatus: student.paymentStatus || "pending",
                    paymentAmount: student.paymentAmount || 0,
                    paymentMethod: student.paymentMethod || "cash",
                    paymentReference: student.paymentReference || "",
                    listeningSetNumber: student.assignedSets?.listeningSetNumber || "",
                    readingSetNumber: student.assignedSets?.readingSetNumber || "",
                    writingSetNumber: student.assignedSets?.writingSetNumber || "",
                    speakingSetNumber: student.assignedSets?.speakingSetNumber || "",
                    isActive: student.isActive !== false,
                    canRetake: student.canRetake || false,
                });
            }
        } catch (error) {
            console.error("Failed to fetch student:", error);
            setError("Failed to load student data");
        } finally {
            setLoading(false);
        }
    };

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
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            // Prepare update data
            const updateData = {
                nameEnglish: formData.nameEnglish,
                nameBengali: formData.nameBengali || undefined,
                phone: formData.phone,
                nidNumber: formData.nidNumber || undefined,
                examDate: new Date(formData.examDate).toISOString(),
                paymentStatus: formData.paymentStatus,
                paymentAmount: formData.paymentAmount,
                paymentMethod: formData.paymentMethod,
                paymentReference: formData.paymentReference || undefined,
                listeningSetNumber: formData.listeningSetNumber ? Number(formData.listeningSetNumber) : undefined,
                readingSetNumber: formData.readingSetNumber ? Number(formData.readingSetNumber) : undefined,
                writingSetNumber: formData.writingSetNumber ? Number(formData.writingSetNumber) : undefined,
                speakingSetNumber: formData.speakingSetNumber ? Number(formData.speakingSetNumber) : undefined,
                isActive: formData.isActive,
                canRetake: formData.canRetake,
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const response = await studentsAPI.update(params.id, updateData);

            if (response.success) {
                router.push("/dashboard/admin/students");
            }
        } catch (err) {
            setError(err.message || "Failed to update student");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FaSpinner className="animate-spin text-4xl text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/admin/students/${params.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
                    <p className="text-gray-500">Update student information</p>
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
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
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
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                NID / Voter ID Number (Optional)
                            </label>
                            <input
                                type="text"
                                name="nidNumber"
                                value={formData.nidNumber}
                                onChange={handleInputChange}
                                placeholder="10 or 17 number (optional)"
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaCalendar className="inline mr-1 text-gray-400" />
                                Exam Date *
                            </label>
                            <input
                                type="date"
                                name="examDate"
                                value={formData.examDate}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
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
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </select>
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
                                required
                                min={0}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method *
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Question Sets Assignment */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Assigned Question Sets</h3>
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Not Assigned</option>
                                {listeningSets.map((set) => (
                                    <option key={set._id || set.setId} value={set.setNumber}>
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Not Assigned</option>
                                {readingSets.map((set) => (
                                    <option key={set._id || set.setId} value={set.setNumber}>
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Not Assigned</option>
                                {writingSets.map((set) => (
                                    <option key={set._id || set.setId} value={set.setNumber}>
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
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="">Not Assigned</option>
                                    {speakingSets.map((set) => (
                                        <option key={set._id || set.setId} value={set.setNumber}>
                                            Set #{set.setNumber} - {set.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Options */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Status Options</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <div>
                                <p className="font-medium text-gray-800">Account Active</p>
                                <p className="text-sm text-gray-500">Allow student to access exam</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="canRetake"
                                checked={formData.canRetake}
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <div>
                                <p className="font-medium text-gray-800">Allow Retake</p>
                                <p className="text-sm text-gray-500">Allow student to retake the exam</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                        {error}
                    </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4">
                    <Link
                        href={`/dashboard/admin/students/${params.id}`}
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
