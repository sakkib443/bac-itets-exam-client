"use client";
import React, { useState } from "react";
import { FaHeadphones, FaVolumeUp, FaCheck } from "react-icons/fa";

// ══════════════════════════════════════════════════════════
// Renders one question block in official IELTS preview style
// ══════════════════════════════════════════════════════════
function PreviewQuestion({ block }) {
    const qType = block.questionType || "fill-in-blank";
    const isTextInput = [
        "note-completion", "form-completion", "table-completion",
        "sentence-completion", "summary-completion", "short-answer",
        "map-labelling",
        "fill-in-blank"
    ].includes(qType);

    const isMultipleChoice = qType === "multiple-choice" || qType === "multiple-choice-multi";
    const isMatching = qType.startsWith("matching");

    // Clean text logic (mirroring exam page)
    const rawText = block.questionText || '';
    const cleanText = rawText
        .replace(/_{1,}/g, '')            // Remove underscores
        .replace(/\{blank\}/g, '')        // Remove placeholders
        .replace(/\[\d+\]/g, '')          // Remove [15] patterns
        .trim();

    // Standard Number Box style
    const NumberBox = (
        <span style={{
            border: '1px solid #374151', fontWeight: 'bold', fontSize: '11px',
            padding: '0 5px', color: '#111827', background: 'white',
            lineHeight: '1.6', flexShrink: 0, borderRadius: '2px', display: 'inline-block', verticalAlign: 'middle'
        }}>
            {block.questionNumber}
        </span>
    );

    // ── Note / Table / Sentence Completion: Inline style ──
    if (isTextInput) {
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#111827', lineHeight: '1.8' }}>
                <span style={{ flexShrink: 0, marginTop: '2px' }}>•</span>
                <div style={{ flex: 1 }}>
                    <span style={{ verticalAlign: 'middle' }}>{cleanText}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', verticalAlign: 'middle', marginLeft: '6px' }}>
                        {NumberBox}
                        <div style={{
                            border: '1px solid #d1d5db', width: '150px',
                            minHeight: '28px', background: '#f9fafb',
                            color: '#059669', padding: '2px 8px', borderRadius: '2px',
                            fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center'
                        }}>
                            {block.correctAnswer || "No answer set"}
                        </div>
                    </span>
                </div>
            </div>
        );
    }

    // ── Multiple Choice ──
    if (isMultipleChoice) {
        return (
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    {NumberBox}
                    <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.5' }}>{cleanText}</span>
                </div>
                <div style={{ marginLeft: '34px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(block.options || []).map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const text = opt.replace(/^[A-Z]\.\s*/, "");
                        const isCorrect = block.correctAnswer && (block.correctAnswer.includes(letter) || block.correctAnswer === letter);
                        return (
                            <div key={oIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0, fontSize: '13px' }}>{letter}</span>
                                <div style={{
                                    width: '16px', height: '16px', border: `1px solid ${isCorrect ? '#059669' : '#d1d5db'}`,
                                    background: isCorrect ? '#059669' : 'white', flexShrink: 0, marginTop: '2px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                }}>
                                    {isCorrect && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
                                </div>
                                <span style={{ color: isCorrect ? '#059669' : '#374151', fontWeight: isCorrect ? 'bold' : 'normal', fontSize: '13px' }}>{text}</span>
                                {isCorrect && <FaCheck className="text-green-600 mt-1" size={10} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Matching ──
    if (isMatching) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {NumberBox}
                <span style={{ flex: 1, color: '#1f2937', fontSize: '14px' }}>{cleanText}</span>
                <div style={{
                    border: '1px solid #d1d5db', padding: '2px 10px', fontSize: '13px',
                    background: '#ecfdf5', color: '#065f46', fontWeight: 'bold', borderRadius: '2px', width: '60px', textAlign: 'center'
                }}>
                    {block.correctAnswer || "?"}
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: '#6b7280', fontSize: '12px' }}>
            {NumberBox} <span>{cleanText} (Unsupported type in preview)</span>
        </div>
    );
}

export default function ListeningPreview({ sections, title, mainAudioUrl }) {
    const [activePart, setActivePart] = useState(0);
    const currentSection = sections[activePart] || {};
    const blocks = currentSection.questions || [];

    const questionBlocks = blocks.filter(b => b.blockType === "question");

    return (
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
            {/* ══ Header ══ */}
            <div style={{ backgroundColor: '#1f2937', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaHeadphones size={14} />
                    Live Preview — {title || "Untitled Listening Test"}
                </h3>
            </div>

            {/* Part Tabs (Official Gray Banner Look) */}
            <div style={{ backgroundColor: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '5px 15px', display: 'flex', gap: '2px' }}>
                {sections.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePart(idx)}
                        style={{
                            padding: '4px 12px', fontSize: '12px', fontWeight: activePart === idx ? 'bold' : 'normal',
                            background: activePart === idx ? '#fff' : 'transparent',
                            color: activePart === idx ? '#1f2937' : '#4b5563',
                            border: activePart === idx ? '1px solid #d1d5db' : '1px solid transparent',
                            borderBottom: 'none', borderRadius: '3px 3px 0 0', cursor: 'pointer', marginBottom: '-6px'
                        }}
                    >
                        Part {idx + 1}
                    </button>
                ))}
            </div>

            {/* ══ Scrollable Context Area ══ */}
            <div style={{ overflowY: 'auto', maxHeight: '70vh', padding: '25px 40px' }}>

                {/* Instruction Banner mirrors official Part Banner */}
                <div style={{ marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Part {activePart + 1}</p>
                    <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>
                        {currentSection.instructions || "Ready for listening section"}
                    </p>
                </div>

                {/* Main Audio (if set) */}
                {mainAudioUrl && (
                    <div style={{ marginBottom: '15px', background: '#f9fafb', padding: '8px 12px', border: '1px dashed #d1d5db', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaVolumeUp className="text-gray-400" size={12} />
                        <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{mainAudioUrl}</span>
                    </div>
                )}

                {/* Render Content Blocks */}
                <div style={{ textAlign: 'left' }}>
                    {blocks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                            <FaHeadphones size={40} style={{ margin: '0 auto 10px opacity(0.2)' }} />
                            <p style={{ fontStyle: 'italic', fontSize: '14px' }}>No questions in Part {activePart + 1}</p>
                        </div>
                    )}

                    {blocks.map((block, bIdx) => {
                        if (block.blockType === 'instruction') {
                            return (
                                <div key={bIdx} style={{ marginBottom: '15px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }}
                                    dangerouslySetInnerHTML={{ __html: block.content }} />
                            );
                        }
                        if (block.blockType === 'question') {
                            return <PreviewQuestion key={bIdx} block={block} />;
                        }
                        return null;
                    })}
                </div>
            </div>

            {/* Answer Summary Footer */}
            {questionBlocks.length > 0 && (
                <div style={{ padding: '10px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Showing correct answers in GREEN</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {questionBlocks.map(b => (
                            <div key={b.questionNumber} style={{
                                width: '22px', height: '22px', fontSize: '10px', fontWeight: 'bold',
                                border: '1px solid #d1d5db', background: b.correctAnswer ? '#1f2937' : '#fff',
                                color: b.correctAnswer ? '#fff' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {b.questionNumber}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

