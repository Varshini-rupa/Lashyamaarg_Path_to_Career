import React, { useState } from 'react';
import { submitAssessmentV2 } from '../api';
import { useAuth } from '../context/AuthContext';

const QUESTIONS = [
    // RIASEC (R)
    { id: 1, text: "I enjoy working with tools, machines, or hardware.", type: "RIASEC", letter: "R" },
    { id: 2, text: "I like solving practical, hands-on problems.", type: "RIASEC", letter: "R" },
    // RIASEC (I)
    { id: 3, text: "I enjoy analyzing data or finding logical explanations.", type: "RIASEC", letter: "I" },
    { id: 4, text: "I like experimenting or researching to understand how things work.", type: "RIASEC", letter: "I" },
    // RIASEC (A)
    { id: 5, text: "I like expressing ideas through design, art, writing, or creativity.", type: "RIASEC", letter: "A" },
    { id: 6, text: "I enjoy creating new concepts rather than following fixed rules.", type: "RIASEC", letter: "A" },
    // RIASEC (S)
    { id: 7, text: "I enjoy helping people learn or solve personal problems.", type: "RIASEC", letter: "S" },
    { id: 8, text: "I feel good when I support or guide others.", type: "RIASEC", letter: "S" },
    // RIASEC (E)
    { id: 9, text: "I enjoy leading a team or convincing people about an idea.", type: "RIASEC", letter: "E" },
    { id: 10, text: "I like taking initiative and making decisions quickly.", type: "RIASEC", letter: "E" },
    // RIASEC (C)
    { id: 11, text: "I like organizing information neatly and following structured plans.", type: "RIASEC", letter: "C" },
    { id: 12, text: "I enjoy tasks involving records, schedules, and clear procedures.", type: "RIASEC", letter: "C" },

    // Big Five (O)
    { id: 13, text: "I enjoy learning new topics beyond my syllabus.", type: "BigFive", trait: "O" },
    { id: 14, text: "I like exploring new ideas, places, or technologies.", type: "BigFive", trait: "O" },
    { id: 15, text: "I am interested in creative or innovative thinking.", type: "BigFive", trait: "O" },
    // Big Five (C)
    { id: 16, text: "I plan my work and complete tasks on time.", type: "BigFive", trait: "C" },
    { id: 17, text: "I stay disciplined even when the work is boring.", type: "BigFive", trait: "C" },
    { id: 18, text: "I pay attention to details and avoid careless mistakes.", type: "BigFive", trait: "C" },
    // Big Five (E)
    { id: 19, text: "I feel energized when I talk to many people.", type: "BigFive", trait: "E" },
    { id: 20, text: "I enjoy participating in group activities and discussions.", type: "BigFive", trait: "E" },
    { id: 21, text: "I like presenting or speaking in front of others.", type: "BigFive", trait: "E" },
    // Big Five (A)
    { id: 22, text: "I try to avoid conflicts and keep the peace.", type: "BigFive", trait: "A" },
    { id: 23, text: "I easily empathize with others’ feelings.", type: "BigFive", trait: "A" },
    { id: 24, text: "People consider me supportive and cooperative.", type: "BigFive", trait: "A" },
    // Big Five (N)
    { id: 25, text: "I often worry about my future or performance.", type: "BigFive", trait: "N" },
    { id: 26, text: "I feel stressed easily under pressure.", type: "BigFive", trait: "N" },
    { id: 27, text: "Small problems sometimes make me anxious.", type: "BigFive", trait: "N" },

    // Calibration
    { id: 28, text: "I prefer learning by building projects rather than only watching videos.", type: "Calibration", key: "handsOn" },
    { id: 29, text: "I enjoy solving puzzles and challenging problems regularly.", type: "Calibration", key: "problemSolving" },
    { id: 30, text: "I can stay consistent if I have a clear goal and weekly plan.", type: "Calibration", key: "consistency" }
];

const LIKERT_OPTIONS = [
    { value: 1, label: "Strongly Disagree", color: "#fca5a5" },
    { value: 2, label: "Disagree", color: "#fbcfe8" },
    { value: 3, label: "Neutral", color: "#e5e7eb" },
    { value: 4, label: "Agree", color: "#bbf7d0" },
    { value: 5, label: "Strongly Agree", color: "#86efac" }
];

const PsychometricPage = ({ navigate }) => {
    const { user } = useAuth();
    const [step, setStep] = useState('intro'); // intro, questions, results
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    // Result State
    const [resultsData, setResultsData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleAnswer = (value) => {
        const qId = QUESTIONS[currentQIndex].id;
        setAnswers(prev => ({ ...prev, [qId]: value }));

        if (currentQIndex < QUESTIONS.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        }
    };

    const calculateResults = () => {
        // RIASEC
        const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        // Big Five
        const bigFiveScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };

        QUESTIONS.forEach(q => {
            const val = answers[q.id] || 3; // default to neutral if missing somehow
            if (q.type === 'RIASEC') {
                riasecScores[q.letter] += val;
            } else if (q.type === 'BigFive') {
                bigFiveScores[q.trait] += val;
            }
        });

        // Top 2 RIASEC
        const sortedRiasec = Object.entries(riasecScores)
            .sort((a, b) => b[1] - a[1]);
        const hollandCode = sortedRiasec[0][0] + sortedRiasec[1][0];

        // Top 2 Big Five
        const sortedBigFive = Object.entries(bigFiveScores)
            .sort((a, b) => b[1] - a[1]);
        const topTraits = [sortedBigFive[0][0], sortedBigFive[1][0]];

        // Convert BigFive to percentages (max score is 15 = 3 qs * 5)
        const bigFivePercentages = {};
        for (let t in bigFiveScores) {
            bigFivePercentages[t] = Math.round((bigFiveScores[t] / 15) * 100);
        }

        // --- Core Prompt Logic for Tags ---
        let recommendedTags = new Set();
        const topLetters = hollandCode;

        if (topLetters.includes('I')) { recommendedTags.add('ai_ml'); recommendedTags.add('data'); recommendedTags.add('research'); }
        if (topLetters.includes('R')) { recommendedTags.add('hardware'); recommendedTags.add('iot'); recommendedTags.add('robotics'); }
        if (topLetters.includes('A')) { recommendedTags.add('design'); recommendedTags.add('content'); recommendedTags.add('uiux'); }
        if (topLetters.includes('S')) { recommendedTags.add('teaching'); recommendedTags.add('hr'); recommendedTags.add('healthcare'); recommendedTags.add('community'); }
        if (topLetters.includes('E')) { recommendedTags.add('management'); recommendedTags.add('sales'); recommendedTags.add('entrepreneurship'); }
        if (topLetters.includes('C')) { recommendedTags.add('operations'); recommendedTags.add('finance'); recommendedTags.add('govt_jobs'); }

        let topStrengths = [];
        // Big Five Refinement
        if (bigFivePercentages.C > 70) {
            recommendedTags.add('competitive_exams');
            recommendedTags.add('long_term_roadmap');
            topStrengths.push("Highly disciplined and organized planner.");
        }
        if (bigFivePercentages.O > 70) {
            recommendedTags.add('startup');
            recommendedTags.add('innovation');
            topStrengths.push("Creative thinker who enjoys new ideas and learning.");
        }
        if (bigFivePercentages.E > 70) {
            recommendedTags.add('leadership');
            recommendedTags.add('public_speaking');
            topStrengths.push("Strong communicator and natural team leader.");
        }
        if (bigFivePercentages.N > 70) {
            topStrengths.push("Prefers structured plans and smaller milestones.");
        }

        // Calibration
        if (answers[28] >= 4) topStrengths.push("Hands-on, project-based learner.");
        if (answers[29] >= 4) topStrengths.push("Enjoys solving complex puzzles regularly.");
        if (answers[30] >= 4) topStrengths.push("Consistent performer with clear weekly goals.");

        if (topStrengths.length === 0) topStrengths.push("Adaptable and balanced approach to tasks.");

        setResultsData({
            riasecScores,
            hollandCode,
            bigFiveScores: bigFivePercentages,
            topTraits,
            topStrengths: topStrengths.slice(0, 3), // max 3 lines
            recommendedTags: Array.from(recommendedTags)
        });

        setStep('results');
    };

    const handleSaveAndContinue = async () => {
        setSaving(true);
        setError(null);
        try {
            await submitAssessmentV2({
                answers,
                ...resultsData
            });
            navigate('dashboard');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || 'Failed to save results. Try again.');
            setSaving(false);
        }
    };

    // --- RENDER INTRO ---
    if (step === 'intro') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 28, marginBottom: 16, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Discover Your True Potential
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 30, fontSize: 16, lineHeight: 1.6 }}>
                        This 30-question psychometric test uses the Holland Code (RIASEC) and Big Five models to uncover your working style, strengths, and recommended career domains.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 30 }}>
                        <span className="badge badge-primary">⏳ ~5 Mins</span>
                        <span className="badge badge-success">🎯 Personalized Results</span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 18 }} onClick={() => setStep('questions')}>
                        Start Assessment 🚀
                    </button>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('dashboard')}>
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER QUESTIONS ---
    if (step === 'questions') {
        const question = QUESTIONS[currentQIndex];
        const progress = ((currentQIndex) / QUESTIONS.length) * 100;

        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px 20px' }}>
                {/* Progress bar top */}
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'var(--border)' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                </div>

                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 30, fontSize: 14, fontWeight: 600 }}>
                        <span>Question {currentQIndex + 1} of {QUESTIONS.length}</span>
                        <span>{Math.round(progress)}% Completed</span>
                    </div>

                    <div className="card" style={{ padding: '40px 30px', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h2 style={{ fontSize: 24, textAlign: 'center', marginBottom: 40, lineHeight: 1.4 }}>
                            "{question.text}"
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {LIKERT_OPTIONS.map(opt => {
                                const isSelected = answers[question.id] === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer(opt.value)}
                                        style={{
                                            padding: 16,
                                            borderRadius: 12,
                                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                            background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            color: 'var(--text-primary)',
                                            fontSize: 16,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: isSelected ? opt.color : 'var(--border)', marginRight: 12 }} />
                                            {opt.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        <button className="btn btn-outline" onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0}>
                            ← Back
                        </button>
                        {answers[question.id] && currentQIndex === QUESTIONS.length - 1 && (
                            <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={calculateResults}>
                                Finish Assessment ✅
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER RESULTS ---
    if (step === 'results' && resultsData) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '60px 20px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <h1 style={{ fontSize: 32, textAlign: 'center', marginBottom: 40, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Psychometric Profile
                    </h1>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                        {/* Holland Code Card */}
                        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Holland Code</div>
                            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>
                                {resultsData.hollandCode}
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                Your top inclinations are heavily skewed toward{' '}
                                {resultsData.hollandCode.split('').join(' and ')} domains.
                            </p>
                        </div>

                        {/* Top Strengths */}
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 }}>Top Strengths</div>
                            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {resultsData.topStrengths.map((str, idx) => (
                                    <li key={idx} style={{ lineHeight: 1.5 }}>{str}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Big Five Chart */}
                    <div className="card" style={{ padding: 30, marginBottom: 24 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Big Five Trait Breakdown</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {Object.entries(resultsData.bigFiveScores).map(([trait, percentage]) => {
                                const traitNames = { O: "Openness", C: "Conscientiousness", E: "Extraversion", A: "Agreeableness", N: "Neuroticism" };
                                return (
                                    <div key={trait}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                            <span>{traitNames[trait]} ({trait})</span>
                                            <span style={{ fontWeight: 600 }}>{percentage}%</span>
                                        </div>
                                        <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${percentage}%`, background: trait === 'N' ? 'var(--danger)' : 'var(--primary)', transition: 'width 1s ease-out' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Suggested Domains */}
                    <div className="card" style={{ padding: 30, marginBottom: 30 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recommended AI Domains</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {resultsData.recommendedTags.map(tag => (
                                <span key={tag} className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: 14 }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {error && <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 16 }}>{error}</div>}

                    <div style={{ textAlign: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 18, fontWeight: 700 }} onClick={handleSaveAndContinue} disabled={saving}>
                            {saving ? '⏳ Saving Profile...' : 'Save & Explore Roadmap 🚀'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PsychometricPage;
