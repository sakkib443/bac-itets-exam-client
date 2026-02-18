"use client";
import React from "react";
import { FaTrash, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";

// ═══ Shared Styles ═══
const label = "block text-xs font-semibold text-gray-600 mb-1";
const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none";
const textarea = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-y";
const select = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white";
const removeBtn = "p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors";
const addBtn = "flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 px-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer";

// ═══════════════════════════════════════════
// 1. NOTE COMPLETION FORM
// ═══════════════════════════════════════════
export function NoteCompletionForm({ group, onChange }) {
    const bullets = group.notesSections?.[0]?.bullets || [];
    const questionBullets = bullets.filter(b => b.type === "question");

    const updateBullet = (idx, field, value) => {
        const allBullets = [...bullets];
        const qIdx = allBullets.findIndex((b, i) => b.type === "question" && bullets.slice(0, i + 1).filter(x => x.type === "question").length === idx + 1);
        if (qIdx >= 0) {
            allBullets[qIdx] = { ...allBullets[qIdx], [field]: value };
            onChange({ ...group, notesSections: [{ ...group.notesSections[0], bullets: allBullets }] });
        }
    };

    const addBullet = () => {
        const maxQ = Math.max(...questionBullets.map(b => b.questionNumber), group.startQuestion - 1);
        const newB = { type: "question", questionNumber: maxQ + 1, textBefore: "", textAfter: "", correctAnswer: "" };
        const updated = [...bullets, newB];
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            notesSections: [{ ...group.notesSections[0], bullets: updated }]
        });
    };

    const removeBullet = (idx) => {
        const allQ = questionBullets.filter((_, i) => i !== idx);
        const nonQ = bullets.filter(b => b.type !== "question");
        const updated = [...nonQ, ...allQ];
        const maxQ = allQ.length > 0 ? Math.max(...allQ.map(b => b.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, notesSections: [{ ...group.notesSections[0], bullets: updated }] });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className={label}>Heading / Title</label>
                <input className={input} value={group.mainHeading || ""} onChange={e => onChange({ ...group, mainHeading: e.target.value })} placeholder="e.g. The nutmeg tree and fruit" />
            </div>
            <div>
                <label className={label}>Instruction</label>
                <input className={input} value={group.subInstruction || ""} onChange={e => onChange({ ...group, subInstruction: e.target.value })} />
            </div>
            <div>
                <label className={label}>Gap Text (use __________ for blanks) — paste from question paper</label>
                <textarea className={textarea} rows={6} value={group.passage || ""} onChange={e => onChange({ ...group, passage: e.target.value })} placeholder={"• the leaves are 1 __________ in shape\n• the 2 __________ surrounds the fruit"} />
            </div>
            <div>
                <label className={label}>Answers</label>
                <div className="space-y-2">
                    {questionBullets.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-8">Q{b.questionNumber}</span>
                            <input className={`${input} flex-1`} value={b.correctAnswer} onChange={e => updateBullet(idx, "correctAnswer", e.target.value)} placeholder="Answer" />
                            <button type="button" onClick={() => removeBullet(idx)} className={removeBtn}><FaTrash size={11} /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addBullet} className={`${addBtn} mt-2`}><FaPlus size={10} /> Add Answer</button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// 2. TRUE/FALSE/NOT GIVEN FORM
// ═══════════════════════════════════════════
export function TFNGForm({ group, onChange }) {
    const stmts = group.statements || [];
    const options = group.groupType === "yes-no-not-given" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];

    const updateStmt = (idx, field, value) => {
        const updated = stmts.map((s, i) => i === idx ? { ...s, [field]: value } : s);
        onChange({ ...group, statements: updated });
    };

    const addStmt = () => {
        const maxQ = stmts.length > 0 ? Math.max(...stmts.map(s => s.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            statements: [...stmts, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }]
        });
    };

    const removeStmt = (idx) => {
        const updated = stmts.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(s => s.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, statements: updated });
    };

    return (
        <div className="space-y-2">
            {stmts.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-500 mt-2 w-8 shrink-0">Q{s.questionNumber}</span>
                    <textarea className={`${textarea} flex-1`} rows={2} value={s.text} onChange={e => updateStmt(idx, "text", e.target.value)} placeholder="Paste statement here..." />
                    <select className={`${select} w-32 shrink-0`} value={s.correctAnswer} onChange={e => updateStmt(idx, "correctAnswer", e.target.value)}>
                        <option value="">Answer</option>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button type="button" onClick={() => removeStmt(idx)} className={`${removeBtn} mt-1`}><FaTrash size={11} /></button>
                </div>
            ))}
            <button type="button" onClick={addStmt} className={addBtn}><FaPlus size={10} /> Add Statement</button>
        </div>
    );
}

// ═══════════════════════════════════════════
// 3. MATCHING INFORMATION FORM
// ═══════════════════════════════════════════
export function MatchingInfoForm({ group, onChange }) {
    const items = group.matchingItems || [];
    const paraOpts = group.paragraphOptions || ["A", "B", "C", "D", "E", "F", "G"];

    const updateItem = (idx, field, value) => {
        const updated = items.map((m, i) => i === idx ? { ...m, [field]: value } : m);
        onChange({ ...group, matchingItems: updated });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group, endQuestion: maxQ + 1,
            matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }]
        });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className={label}>Paragraph Labels (comma separated)</label>
                <input className={input} value={paraOpts.join(", ")} onChange={e => onChange({ ...group, paragraphOptions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="A, B, C, D, E, F, G" />
            </div>
            <div className="space-y-2">
                {items.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-bold text-gray-500 mt-2 w-8 shrink-0">Q{m.questionNumber}</span>
                        <textarea className={`${textarea} flex-1`} rows={2} value={m.text} onChange={e => updateItem(idx, "text", e.target.value)} placeholder="Statement..." />
                        <select className={`${select} w-20 shrink-0`} value={m.correctAnswer} onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                            <option value="">—</option>
                            {paraOpts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <button type="button" onClick={() => removeItem(idx)} className={`${removeBtn} mt-1`}><FaTrash size={11} /></button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className={addBtn}><FaPlus size={10} /> Add Item</button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// 4. MATCHING HEADINGS FORM
// ═══════════════════════════════════════════
export function MatchingHeadingsForm({ group, onChange }) {
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];
    const romanNums = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

    const updateFeature = (idx, text) => {
        const updated = features.map((f, i) => i === idx ? { ...f, text } : f);
        onChange({ ...group, featureOptions: updated });
    };

    const addFeature = () => {
        const next = romanNums[features.length] || `${features.length + 1}`;
        onChange({ ...group, featureOptions: [...features, { letter: next, text: "" }] });
    };

    const removeFeature = (idx) => {
        onChange({ ...group, featureOptions: features.filter((_, i) => i !== idx) });
    };

    const updateItem = (idx, field, value) => {
        const updated = items.map((m, i) => i === idx ? { ...m, [field]: value } : m);
        onChange({ ...group, matchingItems: updated });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className={label}>Headings List</label>
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 w-8">{f.letter}</span>
                            <input className={`${input} flex-1`} value={f.text} onChange={e => updateFeature(idx, e.target.value)} placeholder="Heading text..." />
                            <button type="button" onClick={() => removeFeature(idx)} className={removeBtn}><FaTrash size={11} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={addFeature} className={addBtn}><FaPlus size={10} /> Add Heading</button>
                </div>
            </div>
            <div>
                <label className={label}>Paragraph → Heading Mapping</label>
                <div className="space-y-1.5">
                    {items.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 w-8">Q{m.questionNumber}</span>
                            <span className="text-sm text-gray-700 flex-1">{m.text}</span>
                            <select className={`${select} w-20`} value={m.correctAnswer} onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                <option value="">—</option>
                                {features.map(f => <option key={f.letter} value={f.letter}>{f.letter}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// 5. MATCHING FEATURES FORM
// ═══════════════════════════════════════════
export function MatchingFeaturesForm({ group, onChange }) {
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];

    const updateFeature = (idx, text) => {
        const updated = features.map((f, i) => i === idx ? { ...f, text } : f);
        const paraOpts = updated.map(f => f.letter);
        onChange({ ...group, featureOptions: updated, paragraphOptions: paraOpts });
    };

    const addFeature = () => {
        const next = String.fromCharCode(65 + features.length);
        const updated = [...features, { letter: next, text: "" }];
        onChange({ ...group, featureOptions: updated, paragraphOptions: updated.map(f => f.letter) });
    };

    const removeFeature = (idx) => {
        const updated = features.filter((_, i) => i !== idx);
        onChange({ ...group, featureOptions: updated, paragraphOptions: updated.map(f => f.letter) });
    };

    const updateItem = (idx, field, value) => {
        const updated = items.map((m, i) => i === idx ? { ...m, [field]: value } : m);
        onChange({ ...group, matchingItems: updated });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group, endQuestion: maxQ + 1,
            matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }]
        });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className={label}>List Title</label>
                <input className={input} value={group.featureListTitle || ""} onChange={e => onChange({ ...group, featureListTitle: e.target.value })} placeholder="e.g. List of Explorers" />
            </div>
            <div>
                <label className={label}>People / Features</label>
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 w-6">{f.letter}</span>
                            <input className={`${input} flex-1`} value={f.text} onChange={e => updateFeature(idx, e.target.value)} placeholder="Person/feature name..." />
                            <button type="button" onClick={() => removeFeature(idx)} className={removeBtn}><FaTrash size={11} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={addFeature} className={addBtn}><FaPlus size={10} /> Add Person/Feature</button>
                </div>
            </div>
            <div>
                <label className={label}>Statements</label>
                <div className="space-y-2">
                    {items.map((m, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 mt-2 w-8 shrink-0">Q{m.questionNumber}</span>
                            <textarea className={`${textarea} flex-1`} rows={2} value={m.text} onChange={e => updateItem(idx, "text", e.target.value)} placeholder="Statement..." />
                            <select className={`${select} w-20 shrink-0`} value={m.correctAnswer} onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                <option value="">—</option>
                                {features.map(f => <option key={f.letter} value={f.letter}>{f.letter}</option>)}
                            </select>
                            <button type="button" onClick={() => removeItem(idx)} className={`${removeBtn} mt-1`}><FaTrash size={11} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className={addBtn}><FaPlus size={10} /> Add Statement</button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// 6. MULTIPLE CHOICE FULL FORM
// ═══════════════════════════════════════════
export function MCQFullForm({ group, onChange }) {
    const mcqs = group.mcQuestions || [];

    const updateQ = (idx, field, value) => {
        const updated = mcqs.map((q, i) => i === idx ? { ...q, [field]: value } : q);
        onChange({ ...group, mcQuestions: updated });
    };

    const updateOption = (qIdx, oIdx, text) => {
        const updated = mcqs.map((q, i) => {
            if (i !== qIdx) return q;
            const opts = q.options.map((o, j) => j === oIdx ? { ...o, text } : o);
            return { ...q, options: opts };
        });
        onChange({ ...group, mcQuestions: updated });
    };

    const addQ = () => {
        const maxQ = mcqs.length > 0 ? Math.max(...mcqs.map(q => q.questionNumber)) : group.startQuestion - 1;
        const newQ = {
            questionNumber: maxQ + 1, questionText: "", correctAnswer: "",
            options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }]
        };
        onChange({ ...group, endQuestion: maxQ + 1, mcQuestions: [...mcqs, newQ] });
    };

    const removeQ = (idx) => {
        const updated = mcqs.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(q => q.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, mcQuestions: updated });
    };

    return (
        <div className="space-y-4">
            {mcqs.map((q, qIdx) => (
                <div key={qIdx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-500 mt-2 w-8 shrink-0">Q{q.questionNumber}</span>
                        <textarea className={`${textarea} flex-1`} rows={2} value={q.questionText} onChange={e => updateQ(qIdx, "questionText", e.target.value)} placeholder="Question text..." />
                        <button type="button" onClick={() => removeQ(qIdx)} className={`${removeBtn} mt-1`}><FaTrash size={11} /></button>
                    </div>
                    <div className="ml-10 space-y-1.5">
                        {(q.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                                <button type="button"
                                    onClick={() => updateQ(qIdx, "correctAnswer", opt.letter)}
                                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-colors cursor-pointer ${q.correctAnswer === opt.letter ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-500 hover:border-green-400"}`}
                                >
                                    {opt.letter}
                                </button>
                                <input className={`${input} flex-1`} value={opt.text} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${opt.letter}...`} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button type="button" onClick={addQ} className={addBtn}><FaPlus size={10} /> Add Question</button>
        </div>
    );
}

// ═══════════════════════════════════════════
// 7. SUMMARY WITH OPTIONS FORM
// ═══════════════════════════════════════════
export function SummaryOptionsForm({ group, onChange }) {
    const phrases = group.phraseList || [];
    const segments = group.summarySegments || [];

    const updatePhrase = (idx, text) => {
        const updated = phrases.map((p, i) => i === idx ? { ...p, text } : p);
        onChange({ ...group, phraseList: updated });
    };

    const addPhrase = () => {
        const next = String.fromCharCode(65 + phrases.length);
        onChange({ ...group, phraseList: [...phrases, { letter: next, text: "" }] });
    };

    const removePhrase = (idx) => {
        onChange({ ...group, phraseList: phrases.filter((_, i) => i !== idx) });
    };

    const updateSegment = (idx, field, value) => {
        const updated = segments.map((s, i) => i === idx ? { ...s, [field]: value } : s);
        onChange({ ...group, summarySegments: updated });
    };

    const blankSegments = segments.filter(s => s.type === "blank");

    return (
        <div className="space-y-3">
            <div>
                <label className={label}>Heading</label>
                <input className={input} value={group.mainHeading || ""} onChange={e => onChange({ ...group, mainHeading: e.target.value })} placeholder="Summary heading..." />
            </div>
            <div>
                <label className={label}>Word/Phrase List</label>
                <div className="grid grid-cols-2 gap-1.5">
                    {phrases.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-blue-600 w-5">{p.letter}</span>
                            <input className={`${input} flex-1`} value={p.text} onChange={e => updatePhrase(idx, e.target.value)} placeholder="Word/phrase..." />
                            <button type="button" onClick={() => removePhrase(idx)} className={removeBtn}><FaTrash size={10} /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addPhrase} className={`${addBtn} mt-1.5`}><FaPlus size={10} /> Add Word/Phrase</button>
            </div>
            <div>
                <label className={label}>Summary Text (text and blank segments)</label>
                <div className="space-y-1.5">
                    {segments.map((seg, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            {seg.type === "text" ? (
                                <>
                                    <span className="text-xs text-gray-400 w-12">Text:</span>
                                    <input className={`${input} flex-1`} value={seg.content || ""} onChange={e => updateSegment(idx, "content", e.target.value)} placeholder="Summary text..." />
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-orange-500 w-12">Q{seg.questionNumber}:</span>
                                    <select className={`${select} flex-1`} value={seg.correctAnswer || ""} onChange={e => updateSegment(idx, "correctAnswer", e.target.value)}>
                                        <option value="">Select answer...</option>
                                        {phrases.map(p => <option key={p.letter} value={p.letter}>{p.letter} – {p.text}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-1.5">
                    <button type="button" onClick={() => onChange({ ...group, summarySegments: [...segments, { type: "text", content: "" }] })} className={addBtn}>+ Text</button>
                    <button type="button" onClick={() => {
                        const maxQ = blankSegments.length > 0 ? Math.max(...blankSegments.map(s => s.questionNumber)) : group.startQuestion - 1;
                        onChange({
                            ...group, endQuestion: maxQ + 1,
                            summarySegments: [...segments, { type: "blank", questionNumber: maxQ + 1, correctAnswer: "" }]
                        });
                    }} className={addBtn}>+ Blank (Q)</button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// 8. CHOOSE TWO LETTERS FORM
// ═══════════════════════════════════════════
export function ChooseTwoForm({ group, onChange }) {
    const sets = group.questionSets || [];

    const updateSet = (sIdx, field, value) => {
        const updated = sets.map((s, i) => i === sIdx ? { ...s, [field]: value } : s);
        onChange({ ...group, questionSets: updated });
    };

    const updateSetOption = (sIdx, oIdx, text) => {
        const updated = sets.map((s, i) => {
            if (i !== sIdx) return s;
            const opts = s.options.map((o, j) => j === oIdx ? { ...o, text } : o);
            return { ...s, options: opts };
        });
        onChange({ ...group, questionSets: updated });
    };

    const toggleCorrect = (sIdx, letter) => {
        const set = sets[sIdx];
        const current = set.correctAnswers || [];
        let updated;
        if (current.includes(letter)) {
            updated = current.filter(l => l !== letter);
        } else {
            updated = current.length < 2 ? [...current, letter] : [current[1], letter];
        }
        updateSet(sIdx, "correctAnswers", updated);
    };

    const addSet = () => {
        const maxQ = sets.length > 0 ? Math.max(...sets.flatMap(s => s.questionNumbers)) : group.startQuestion - 1;
        const newSet = {
            questionNumbers: [maxQ + 1, maxQ + 2],
            questionText: "",
            options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }, { letter: "E", text: "" }],
            correctAnswers: []
        };
        onChange({ ...group, endQuestion: maxQ + 2, questionSets: [...sets, newSet] });
    };

    const removeSet = (idx) => {
        const updated = sets.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.flatMap(s => s.questionNumbers)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, questionSets: updated });
    };

    return (
        <div className="space-y-4">
            {sets.map((set, sIdx) => (
                <div key={sIdx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-500 mt-2 shrink-0">Q{set.questionNumbers?.join("-")}</span>
                        <textarea className={`${textarea} flex-1`} rows={2} value={set.questionText} onChange={e => updateSet(sIdx, "questionText", e.target.value)} placeholder="Question text..." />
                        <button type="button" onClick={() => removeSet(sIdx)} className={`${removeBtn} mt-1`}><FaTrash size={11} /></button>
                    </div>
                    <div className="ml-10 space-y-1.5">
                        {(set.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                                <button type="button" onClick={() => toggleCorrect(sIdx, opt.letter)}
                                    className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center border-2 transition-colors cursor-pointer ${(set.correctAnswers || []).includes(opt.letter) ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-500 hover:border-green-400"}`}
                                >
                                    {opt.letter}
                                </button>
                                <input className={`${input} flex-1`} value={opt.text} onChange={e => updateSetOption(sIdx, oIdx, e.target.value)} placeholder={`Option ${opt.letter}...`} />
                            </div>
                        ))}
                        <p className="text-xs text-gray-400 ml-9">Click 2 letters to mark correct answers (green = correct)</p>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addSet} className={addBtn}><FaPlus size={10} /> Add Question Set</button>
        </div>
    );
}

// ═══════════════════════════════════════════
// MAIN QUESTION GROUP EDITOR (Wrapper)
// ═══════════════════════════════════════════
export function QuestionGroupEditor({ group, index, onUpdate, onRemove }) {
    const [collapsed, setCollapsed] = React.useState(false);
    const typeInfo = [
        { value: "note-completion", label: "Note Completion", icon: "📝" },
        { value: "true-false-not-given", label: "T/F/NG", icon: "✅" },
        { value: "yes-no-not-given", label: "Y/N/NG", icon: "🔘" },
        { value: "matching-information", label: "Matching Info", icon: "🔗" },
        { value: "matching-headings", label: "Matching Headings", icon: "📑" },
        { value: "matching-features", label: "Matching Features", icon: "👥" },
        { value: "multiple-choice-full", label: "MCQ (A/B/C/D)", icon: "🔤" },
        { value: "summary-with-options", label: "Summary + Options", icon: "📋" },
        { value: "choose-two-letters", label: "Choose Two", icon: "✌️" },
    ].find(t => t.value === group.groupType) || { label: group.groupType, icon: "❓" };

    const renderForm = () => {
        switch (group.groupType) {
            case "note-completion": return <NoteCompletionForm group={group} onChange={onUpdate} />;
            case "true-false-not-given":
            case "yes-no-not-given": return <TFNGForm group={group} onChange={onUpdate} />;
            case "matching-information": return <MatchingInfoForm group={group} onChange={onUpdate} />;
            case "matching-headings": return <MatchingHeadingsForm group={group} onChange={onUpdate} />;
            case "matching-features": return <MatchingFeaturesForm group={group} onChange={onUpdate} />;
            case "multiple-choice-full": return <MCQFullForm group={group} onChange={onUpdate} />;
            case "summary-with-options": return <SummaryOptionsForm group={group} onChange={onUpdate} />;
            case "choose-two-letters": return <ChooseTwoForm group={group} onChange={onUpdate} />;
            default: return <p className="text-sm text-gray-500">Unknown question type</p>;
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{typeInfo.icon}</span>
                    <span className="font-semibold text-sm text-gray-800">{typeInfo.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Q{group.startQuestion}–Q{group.endQuestion}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 p-1"><FaTrash size={12} /></button>
                    {collapsed ? <FaChevronDown className="text-gray-400" size={12} /> : <FaChevronUp className="text-gray-400" size={12} />}
                </div>
            </div>
            {!collapsed && (
                <div className="px-4 py-3 border-t border-gray-100">
                    <div className="mb-3">
                        <label className={label}>Main Instruction</label>
                        <input className={input} value={group.mainInstruction || ""} onChange={e => onUpdate({ ...group, mainInstruction: e.target.value })} />
                    </div>
                    {renderForm()}
                </div>
            )}
        </div>
    );
}
