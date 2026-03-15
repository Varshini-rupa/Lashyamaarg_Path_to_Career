import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecommendation, getRoadmap, sendChatMessage, getOpportunities, getAIOpportunities, updateProfile, getJobRolesByDomain } from '../api';
import LanguageSelector from '../components/LanguageSelector';

// ─── Career → Job Role Intelligence Data ─────────────────────────────
// Maps roadmap key → list of job roles with companies & placement stats
const CAREER_JOB_DATA = {
    technology: {
        roles: [
            { title: 'Software Engineer', companies: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys'], placedPct: 82, salary: '₹6–30L', freq: 'Very High' },
            { title: 'Data Scientist', companies: ['Flipkart', 'Meesho', 'Amazon', 'Paytm', 'CRED'], placedPct: 74, salary: '₹7–25L', freq: 'High' },
            { title: 'DevOps / Cloud Engineer', companies: ['AWS India', 'Google Cloud', 'Atlassian', 'ThoughtWorks'], placedPct: 70, salary: '₹8–30L', freq: 'High' },
            { title: 'AI / ML Engineer', companies: ['NVIDIA', 'Google', 'Adobe', 'Sarvam AI', 'Krutrim'], placedPct: 62, salary: '₹9–35L', freq: 'High' },
        ],
    },
    medical: {
        roles: [
            { title: 'Resident Doctor (MBBS)', companies: ['AIIMS', 'Apollo Hospitals', 'Fortis', 'Max Healthcare'], placedPct: 95, salary: '₹4–12L', freq: 'High' },
            { title: 'Specialist (MD/MS)', companies: ['AIIMS Delhi', 'CMC Vellore', 'PGIMER', 'KEM Mumbai'], placedPct: 88, salary: '₹14–40L', freq: 'Medium' },
            { title: 'Healthcare Researcher', companies: ['IISc', 'TIFR', 'DBT Labs', 'WHO India'], placedPct: 40, salary: '₹5–18L', freq: 'Low' },
        ],
    },
    law: {
        roles: [
            { title: 'Corporate Lawyer', companies: ['AZB & Partners', 'Cyril Amarchand', 'Khaitan & Co', 'Trilegal'], placedPct: 55, salary: '₹6–20L', freq: 'Medium' },
            { title: 'Litigation Advocate', companies: ['Supreme Court', 'High Courts', 'District Courts', 'Self Practice'], placedPct: 40, salary: '₹1.5–8L', freq: 'High' },
            { title: 'In-House Legal Counsel', companies: ['TCS', 'Infosys', 'Tata Group', 'Reliance', 'HDFC Bank'], placedPct: 35, salary: '₹8–25L', freq: 'Medium' },
        ],
    },
    business: {
        roles: [
            { title: 'Management Trainee', companies: ['HUL', 'ITC', 'Marico', 'Nestlé India', 'P&G'], placedPct: 68, salary: '₹8–15L', freq: 'High' },
            { title: 'Business Analyst', companies: ['TCS', 'Wipro', 'Accenture', 'Deloitte', 'KPMG'], placedPct: 78, salary: '₹5–16L', freq: 'Very High' },
            { title: 'Product Manager', companies: ['Flipkart', 'Swiggy', 'Ola', 'Paytm', 'Google India'], placedPct: 25, salary: '₹10–40L', freq: 'Medium' },
        ],
    },
    design: {
        roles: [
            { title: 'UI/UX Designer', companies: ['Swiggy', 'CRED', 'Razorpay', 'Meesho', 'inMobi'], placedPct: 60, salary: '₹4–18L', freq: 'High' },
            { title: 'Graphic Designer', companies: ['WPP India', 'Ogilvy', 'Leo Burnett', 'Social Beat'], placedPct: 72, salary: '₹3–10L', freq: 'High' },
            { title: 'Product Designer', companies: ['Razorpay', 'Groww', 'BrowserStack', 'Freshworks'], placedPct: 40, salary: '₹7–25L', freq: 'Medium' },
        ],
    },
    mba: {
        roles: [
            { title: 'Management Consultant', companies: ['McKinsey', 'BCG', 'Bain', 'Kearney', 'EY'], placedPct: 12, salary: '₹20–50L', freq: 'Low' },
            { title: 'Investment Banker', companies: ['Goldman Sachs', 'JP Morgan', 'Kotak IB', 'Axis Capital'], placedPct: 8, salary: '₹15–40L', freq: 'Low' },
            { title: 'Operations Manager', companies: ['Amazon India', 'Delhivery', 'Blue Dart', 'Flipkart SCM'], placedPct: 65, salary: '₹8–20L', freq: 'High' },
        ],
    },
    fashion: {
        roles: [
            { title: 'Fashion Designer', companies: ['NIFT graduates', 'Fabindia', 'Ethnix by Raymond', 'FabAlley'], placedPct: 55, salary: '₹3–12L', freq: 'Medium' },
            { title: 'Merchandiser', companies: ['Myntra', 'Ajio', 'H&M India', 'Zara India'], placedPct: 70, salary: '₹4–10L', freq: 'High' },
        ],
    },
    architecture: {
        roles: [
            { title: 'Junior Architect', companies: ['Hafeez Contractor', 'CP Kukreja', 'Sanjay Puri Architects', 'L&T'], placedPct: 65, salary: '₹2.5–5L', freq: 'Medium' },
            { title: 'Urban Planner', companies: ['NITI Aayog', 'Smart Cities Mission', 'AECOM India', 'Stantec'], placedPct: 30, salary: '₹4–12L', freq: 'Low' },
        ],
    },
    ca: {
        roles: [
            { title: 'Audit & Assurance', companies: ['Deloitte', 'PwC', 'EY', 'KPMG', 'Grant Thornton'], placedPct: 78, salary: '₹7–18L', freq: 'High' },
            { title: 'Tax Consultant', companies: ['Big 4', 'Mid-size CA Firms', 'Self Practice'], placedPct: 85, salary: '₹5–20L', freq: 'High' },
            { title: 'CFO / Finance Head', companies: ['Any MNC/Listed Company', 'Startups (VP Finance)'], placedPct: 15, salary: '₹20–60L', freq: 'Low' },
        ],
    },
    chef: {
        roles: [
            { title: 'Commis Chef', companies: ['Taj Hotels', 'Oberoi Hotels', 'ITC Hotels', 'Marriott India'], placedPct: 80, salary: '₹1.8–4L', freq: 'Very High' },
            { title: 'Sous Chef', companies: ['Leela', 'JW Marriott', 'Hyatt India', 'Starwood Hotels'], placedPct: 55, salary: '₹4–8L', freq: 'High' },
        ],
    },
    hotel: {
        roles: [
            { title: 'Front Office Manager', companies: ['Taj Hotels', 'Marriott India', 'Radisson Hotels', 'OYO PRO'], placedPct: 82, salary: '₹3–12L', freq: 'High' },
            { title: 'F&B Manager', companies: ['ITC Hotels', 'Leela Palaces', 'Four Seasons India'], placedPct: 75, salary: '₹4–14L', freq: 'High' },
        ],
    },
    pharma: {
        roles: [
            { title: 'Quality Control Analyst', companies: ['Sun Pharma', 'Cipla', "Dr. Reddy's", 'Lupin', 'Aurobindo'], placedPct: 80, salary: '₹3–8L', freq: 'High' },
            { title: 'Medical Sales Rep', companies: ['Abbott India', 'Pfizer India', 'GSK India', 'Novartis India'], placedPct: 85, salary: '₹3–9L', freq: 'Very High' },
            { title: 'R&D Scientist', companies: ['NIPER', 'Biocon', 'Serum Institute', 'CSIR Labs'], placedPct: 30, salary: '₹5–18L', freq: 'Medium' },
        ],
    },
};

// ─── Roadmap Timeline ───────────────────────────────────────────────
const RoadmapPanel = ({ topDomain }) => {
    const [roadmap, setRoadmap] = useState(null);
    const [selectedKey, setSelectedKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationInput, setLocationInput] = useState('');
    const [localColleges, setLocalColleges] = useState(null);
    const [loadingColleges, setLoadingColleges] = useState(false);

    const ALL_KEYS = [
        { key: 'technology', label: '🤖 Tech/Eng', color: '#6366f1' },
        { key: 'medical', label: '🏥 Medical', color: '#10b981' },
        { key: 'law', label: '⚖️ Law', color: '#f59e0b' },
        { key: 'business', label: '💼 Business', color: '#8b5cf6' },
        { key: 'design', label: '🎨 Design', color: '#ec4899' },
        { key: 'mba', label: '📊 MBA', color: '#6366f1' },
        { key: 'fashion', label: '👗 Fashion', color: '#f43f5e' },
        { key: 'architecture', label: '🏛️ B.Arch', color: '#0ea5e9' },
        { key: 'ca', label: '📈 CA', color: '#eab308' },
        { key: 'chef', label: '👨‍🍳 Chef', color: '#f97316' },
        { key: 'hotel', label: '🏨 Hotel Mgmt', color: '#06b6d4' },
        { key: 'pharma', label: '💊 Pharma', color: '#14b8a6' },
    ];

    useEffect(() => {
        getRecommendation()
            .then(res => {
                const rm = res.data.recommendation?.roadmap;
                if (rm) {
                    setRoadmap(rm);
                    setSelectedKey(rm.key);
                } else {
                    // Default to 'technology' if no recommendation
                    switchRoadmap('technology');
                }
                setLoading(false);
            })
            .catch(() => {
                switchRoadmap('technology');
            });
    }, []);

    const switchRoadmap = (key) => {
        setLoading(true);
        getRoadmap(key).then(res => {
            setRoadmap(res.data.roadmap);
            setSelectedKey(key);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const handleLocalColleges = async () => {
        if (!locationInput.trim()) return;
        setLoadingColleges(true);
        try {
            // Reusing chatbot logic for a quick LLM extraction
            const res = await sendChatMessage(`List 3 nearby colleges in ${locationInput} for ${roadmap.title}. Format STRICTLY as JSON array of objects: [{"name":"College Name", "location":"City", "info":"Short detail"}]. NO MARKDOWN. NO BACKTICKS. JUST THE RAW JSON ARRAY.`, 'en', false);
            const collegesList = JSON.parse(res.data.response);
            setLocalColleges(collegesList);
        } catch (err) {
            console.error(err);
        }
        setLoadingColleges(false);
    };

    if (loading && !roadmap) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
    if (!roadmap) return <div style={{ padding: 40, textAlign: 'center' }}>Loading roadmap data...</div>;

    return (
        <div>
            {/* Roadmap Selector */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                {ALL_KEYS.map(item => (
                    <button
                        key={item.key}
                        onClick={() => switchRoadmap(item.key)}
                        style={{
                            padding: '8px 16px', borderRadius: 999, border: `1px solid ${selectedKey === item.key ? item.color : 'rgba(255,255,255,0.1)'}`,
                            background: selectedKey === item.key ? `${item.color}20` : 'rgba(255,255,255,0.02)', color: selectedKey === item.key ? item.color : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'box-shadow 0.2s, transform 0.2s',
                            boxShadow: selectedKey === item.key ? `0 4px 12px ${item.color}30` : 'none',
                            transform: selectedKey === item.key ? 'translateY(-1px)' : 'none'
                        }}
                        onMouseEnter={e => { if (selectedKey !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { if (selectedKey !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>


            {/* Roadmap header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px 24px',
                background: `${roadmap.color}12`, border: `1px solid ${roadmap.color}30`, borderRadius: 16
            }}>
                <span style={{ fontSize: 40 }}>{roadmap.icon}</span>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{roadmap.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{roadmap.tagline}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {[
                    { label: '📚 Required Subjects', items: roadmap.requiredSubjects },
                    { label: '📝 Entrance Exams', items: roadmap.entranceExams },
                ].map(section => (
                    <div key={section.label} className="card" style={{ padding: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>{section.label}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {section.items.map(item => (
                                <span key={item} className="badge badge-primary" style={{ fontSize: 12 }}>{item}</span>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>⏱️ Duration</h4>
                    <p style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{roadmap.degreeDuration}</p>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>💰 Salary Range</h4>
                    <p style={{ fontWeight: 700, color: '#34d399' }}>{roadmap.salaryRange}</p>
                </div>
            </div>

            {/* Career growth */}
            <div className="card" style={{ padding: 20, marginBottom: 28, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#34d399' }}>📈 Career Growth Path</h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{roadmap.careerGrowth}</p>
            </div>

            {/* Timeline */}
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🗺️ Step-by-Step Timeline</h3>
            <div className="timeline">
                {roadmap.milestones.map((m, i) => (
                    <div key={i} className="timeline-item">
                        <div className="timeline-dot" style={{ background: `linear-gradient(135deg, ${roadmap.color}, ${roadmap.color}99)`, boxShadow: `0 0 20px ${roadmap.color}50` }}>
                            {i + 1}
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-year" style={{ color: roadmap.color }}>{m.year}</div>
                            <div className="timeline-title">{m.title}</div>
                            <div className="timeline-desc">{m.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Colleges */}
            <div className="card" style={{ padding: 20, marginTop: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>🏛️ Top National Colleges</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {roadmap.topColleges.map(c => (
                        <span key={c} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{c}</span>
                    ))}
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>📍 Find Nearby Colleges</h4>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input
                        type="text"
                        placeholder="Enter your City or State..."
                        className="form-input"
                        value={locationInput}
                        onChange={e => setLocationInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLocalColleges()}
                        style={{ flex: 1, padding: '10px 14px', fontSize: 14 }}
                    />
                    <button className="btn btn-primary" onClick={handleLocalColleges} disabled={loadingColleges || !locationInput}>
                        {loadingColleges ? '⏳' : '🔍 Search'}
                    </button>
                </div>
                {localColleges && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {localColleges.map((c, i) => (
                            <div key={i} style={{ padding: 14, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <strong style={{ color: 'var(--primary-light)', fontSize: 15 }}>{c.name}</strong>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {c.location}</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.info}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Job Roles & Hiring Companies ─── */}
            {CAREER_JOB_DATA[selectedKey] && (
                <div style={{ marginTop: 28 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>💼 Job Roles & Hiring Companies</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
                        Real data on who hires, what they pay, and your chances of landing the role.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {CAREER_JOB_DATA[selectedKey].roles.map((role, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                                flexWrap: 'wrap',
                            }}>
                                {/* Role + companies */}
                                <div style={{ minWidth: 200, flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{role.title}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {role.companies.slice(0, 4).map(c => (
                                            <span key={c} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.15)' }}>{c}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Placement bar */}
                                <div style={{ minWidth: 150 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        <span>Placement Rate</span>
                                        <span style={{ fontWeight: 700, color: role.placedPct >= 70 ? '#34d399' : role.placedPct >= 40 ? '#fbbf24' : '#f87171' }}>
                                            {role.placedPct}%
                                        </span>
                                    </div>
                                    <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${role.placedPct}%`,
                                            background: role.placedPct >= 70 ? '#34d399' : role.placedPct >= 40 ? '#fbbf24' : '#f87171',
                                            borderRadius: 4, transition: 'width 0.8s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                        {role.placedPct >= 70 ? '✅ Good odds' : role.placedPct >= 40 ? '⚠️ Competitive' : '🔴 Very competitive'}
                                    </div>
                                </div>

                                {/* Salary + frequency */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: 15 }}>{role.salary}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>📋 Openings: {role.freq}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tip box */}
                    <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 20 }}>💡</span>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            <strong style={{ color: 'var(--primary-light)' }}>Pro Tip:</strong> Placement rate shows % of qualified candidates who successfully landed this role. Building a strong portfolio or GitHub profile significantly improves your odds above the average.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};


// ─── Chatbot Panel ───────────────────────────────────────────────────
const ChatbotPanel = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hello! I'm **LakshyaBot** 🎓 — your AI career guide. Ask me about engineering, medicine, law, business, or design careers!\n\nYou can also toggle **Parent Mode** to get answers formatted for your parents." }
    ]);
    const [input, setInput] = useState('');
    const [lang, setLang] = useState(localStorage.getItem('preferredLang') || 'en');
    const [parentMode, setParentMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        const handleLangChange = () => setLang(localStorage.getItem('preferredLang') || 'en');
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        setMessages(m => [...m, { role: 'user', text }]);
        setLoading(true);
        try {
            const res = await sendChatMessage(text, lang, parentMode);
            setMessages(m => [...m, { role: 'bot', text: res.data.response, rag: res.data.rag, rag_sources: res.data.rag_sources || [] }]);
        } catch {
            setMessages(m => [...m, { role: 'bot', text: '❌ Sorry, I encountered an error. Please try again.' }]);
        }
        setLoading(false);
    };

    const SUGGESTIONS = ['What is JEE Advanced?', 'How to prepare for NEET?', 'Best MBA colleges in India?', 'Explain UI/UX career to my parents'];

    const renderText = (text) => {
        // Basic markdown bold
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    return (
        <div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chat Language:</span>
                    <select
                        value={lang}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setLang(newLang);
                            localStorage.setItem('preferredLang', newLang);
                            window.dispatchEvent(new Event('languageChange'));
                            const googleSelect = document.querySelector('.goog-te-combo');
                            if (googleSelect) {
                                googleSelect.value = newLang;
                                googleSelect.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                            } else {
                                document.cookie = `googtrans=/en/${newLang}; path=/;`;
                                window.location.reload();
                            }
                        }}
                        style={{
                            background: 'rgba(10, 10, 15, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none'
                        }}
                    >
                        {[
                            { code: "en", name: "English" },
                            { code: "hi", name: "Hindi (हिन्दी)" },
                            { code: "te", name: "Telugu (తెలుగు)" },
                            { code: "ta", name: "Tamil (தமிழ்)" },
                            { code: "mr", name: "Marathi (मराठी)" },
                            { code: "bn", name: "Bengali (বাংলা)" },
                            { code: "gu", name: "Gujarati (ગુજરાતી)" },
                            { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
                            { code: "ml", name: "Malayalam (മലയാളം)" },
                            { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
                            { code: "ur", name: "Urdu (اردو)" },
                            { code: "or", name: "Odia (ଓଡ଼ିଆ)" },
                            { code: "as", name: "Assamese (অসমীয়া)" },
                            { code: "mai", name: "Maithili (मैथिली)" },
                            { code: "sa", name: "Sanskrit (संस्कृत)" }
                        ].map(l => (
                            <option key={l.code} value={l.code}>{l.name}</option>
                        ))}
                    </select>
                </div>
                <button onClick={() => setParentMode(!parentMode)}
                    style={{
                        padding: '9px 18px', borderRadius: 8, border: `1.5px solid ${parentMode ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        background: parentMode ? 'rgba(245,158,11,0.12)' : 'transparent', color: parentMode ? '#fbbf24' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Inter', transition: 'all 0.2s'
                    }}>
                    👨‍👩‍👧 Parent Mode {parentMode ? 'ON' : 'OFF'}
                </button>
                {parentMode && <span className="badge badge-warning">Answers formatted for parents</span>}
            </div>

            <div className="chatbot-container">
                <div className="chatbot-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>LakshyaBot</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AI Career Advisor • RAG-Powered • {lang === 'te' ? 'తెలుగు' : 'English'} {parentMode ? '• 👨‍👩‍👧 Parent Mode' : ''}</div>
                        </div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                </div>

                <div className="chatbot-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-msg ${m.role}`}>
                            {m.role === 'bot' && <div className="chat-avatar">🤖</div>}
                            <div>
                                <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: renderText(m.text).replace(/\n/g, '<br/>') }} />
                                {m.role === 'bot' && m.rag && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>🔍 RAG</span>
                                        {m.rag_sources?.map(s => (
                                            <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {m.role === 'user' && <div className="chat-avatar" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>👤</div>}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-msg bot">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '14px 20px' }}>
                                {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: `bounce 0.8s ${i * 0.15}s infinite alternate`, opacity: 0.6 }} />)}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="chatbot-input-row">
                    <textarea className="chatbot-input" rows={1} placeholder="Ask me about any career path..." value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                    <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
                        {loading ? '⏳' : '➤'}
                    </button>
                </div>
            </div>

            {/* Quick suggestions */}
            <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>QUICK QUESTIONS</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => { setInput(s); }} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>{s}</button>
                    ))}
                </div>
            </div>

            <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-5px); } }`}</style>
        </div>
    );
};

// ─── Opportunities Panel (Education-Level Aware) ─────────────────────
const OpportunitiesPanel = ({ recommendedDomain, user }) => {
    const [opps, setOpps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [aiMode, setAiMode] = useState(false);

    // Determine student tier from profile
    const edu = user?.education_level || '';
    const isBTech = edu === 'B.Tech';
    const isSchool = ['10th', '11th', '12th', '9th'].includes(edu);

    // Set type filters based on education level
    const SCHOOL_TYPES = [
        { value: '', label: 'All' },
        { value: 'scholarship', label: '🎓 Scholarships' },
        { value: 'olympiad', label: '🏅 Olympiads' },
        { value: 'quiz', label: '❓ Quizzes' },
        { value: 'exam', label: '📝 Exams' },
    ];
    const BTECH_TYPES = [
        { value: '', label: 'All' },
        { value: 'internship', label: '💼 Internships' },
        { value: 'hackathon', label: '⚡ Hackathons' },
    ];
    const TYPES = isBTech ? BTECH_TYPES : (isSchool ? SCHOOL_TYPES : [
        { value: '', label: 'All' },
        { value: 'internship', label: '💼 Internships' },
        { value: 'hackathon', label: '⚡ Hackathons' },
        { value: 'scholarship', label: '🎓 Scholarships' },
        { value: 'olympiad', label: '🏅 Olympiads' },
        { value: 'exam', label: '📝 Exams' },
    ]);

    const [typeFilter, setTypeFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState(recommendedDomain || '');

    useEffect(() => {
        setLoading(true);
        if (aiMode) {
            // AI mode: tell Gemini the education level and relevant types
            const typeHint = isBTech ? 'internship or hackathon' : isSchool ? 'scholarship or quiz or olympiad or exam' : '';
            getAIOpportunities(user?.stream || '', user?.education_level || '', typeHint)
                .then(res => {
                    // filter out expired from AI results too
                    const live = (res.data.opportunities || []).filter(o => !o.is_expired);
                    setOpps(live); setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            getOpportunities(domainFilter, typeFilter)
                .then(res => {
                    let list = res.data.opportunities || [];
                    // ── Education-level filter ──
                    if (isBTech) {
                        list = list.filter(o => ['internship', 'hackathon'].includes(o.type));
                    } else if (isSchool) {
                        list = list.filter(o => ['scholarship', 'olympiad', 'quiz', 'exam'].includes(o.type));
                    }
                    // ── Remove expired ──
                    list = list.filter(o => !o.is_expired);
                    setOpps(list); setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [typeFilter, domainFilter, aiMode]);

    const oppTypeColor = (type) => ({
        scholarship: 'badge-success',
        hackathon: 'badge-warning',
        internship: 'badge-primary',
        olympiad: 'badge-primary',
        quiz: 'badge-warning',
        exam: 'badge-success',
    }[type] || 'badge-primary');

    const NotifModal = ({ opp, onClose }) => (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18 }}>📧 Email Notification Preview</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                    <div><strong>From:</strong> noreply@lakshyamaarg.ai</div>
                    <div><strong>To:</strong> {user?.email}</div>
                    <div><strong>Subject:</strong> 🎯 {opp.type === 'olympiad' ? 'Olympiad' : opp.type === 'quiz' ? 'Quiz' : opp.type === 'exam' ? 'Exam' : 'Opportunity'}: {opp.title}</div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                    <p>Dear {user?.name || 'Student'},</p>
                    <p style={{ marginTop: 8 }}>A new <strong>{opp.type}</strong> opportunity is available:</p>
                    <p style={{ marginTop: 8 }}><strong>{opp.title}</strong> by {opp.organizer}</p>
                    <p>Deadline: <strong>{opp.deadline_display}</strong> ({opp.days_left} days left)</p>
                    <p>Eligibility: {opp.eligibility}</p>
                    {(opp.stipend || opp.prize) && <p>Reward: <strong>{opp.stipend || opp.prize}</strong></p>}
                    <p style={{ marginTop: 12 }}>→ Apply: <span style={{ color: 'var(--primary-light)' }}>{opp.registration_link}</span></p>
                    <p style={{ marginTop: 12 }}>Best of luck! 🚀<br />Team Lakshyamaarg</p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <a href={opp.registration_link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Register Now →</a>
                    <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Close</button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {selected && <NotifModal opp={selected} onClose={() => setSelected(null)} />}

            {/* Education-level context banner */}
            <div style={{
                padding: '12px 18px', marginBottom: 20, borderRadius: 12, fontSize: 13,
                background: isBTech ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${isBTech ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`,
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{ fontSize: 18 }}>{isBTech ? '🎓' : '📚'}</span>
                <span>
                    {isBTech
                        ? <><strong style={{ color: 'var(--primary-light)' }}>B.Tech mode:</strong> Showing internships & hackathons only. Expired listings are hidden automatically.</> : isSchool
                            ? <><strong style={{ color: '#34d399' }}>School mode:</strong> Showing scholarships, olympiads, quizzes & exams for Class {edu} students. Expired listings are hidden.</> : <>Showing all live opportunity types. Expired listings are hidden automatically.</>
                    }
                </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="tabs">
                    {TYPES.map(t => (
                        <button key={t.value} className={`tab-btn ${typeFilter === t.value ? 'active' : ''}`} onClick={() => setTypeFilter(t.value)}>{t.label}</button>
                    ))}
                </div>
                {isBTech && (
                    <button onClick={() => setAiMode(!aiMode)}
                        style={{
                            padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            fontFamily: 'Inter', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 6,
                            background: aiMode ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.05)',
                            border: aiMode ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                            color: aiMode ? '#a78bfa' : 'var(--text-secondary)',
                        }}>
                        🤖 {aiMode ? 'AI Mode ON' : 'AI-Powered'}
                        {aiMode && <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.3)', padding: '2px 6px', borderRadius: 4 }}>GEMINI</span>}
                    </button>
                )}
                {!aiMode && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input className="form-input" placeholder="Filter by domain..." value={domainFilter}
                            onChange={e => setDomainFilter(e.target.value)}
                            style={{ width: 180, padding: '8px 14px', fontSize: 13 }} />
                        {domainFilter && <button className="btn btn-ghost btn-sm" onClick={() => setDomainFilter('')}>✕ Clear</button>}
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : opps.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p>No live opportunities found for this filter.</p>
                    <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>All expired listings are hidden. Try a different type filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {opps.map(opp => (
                        <div key={opp.id} className="opp-card" style={opp.ai_generated ? { borderTop: '2px solid rgba(99,102,241,0.5)' } : {}}>
                            <div className="opp-card-header">
                                <div>
                                    <div className="opp-card-title">{opp.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{opp.organizer}</div>
                                </div>
                                <span className={`badge ${oppTypeColor(opp.type)}`} style={{ flexShrink: 0, fontSize: 11 }}>{opp.type}</span>
                            </div>
                            <div className="opp-card-meta">
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🎯 {opp.domain}</span>
                                {(opp.stipend || opp.prize) && <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>💰 {opp.stipend || opp.prize}</span>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{opp.description}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📋 {opp.eligibility}</div>
                            <div className="opp-card-footer">
                                <div className={`deadline-pill ${opp.days_left <= 10 ? 'urgent' : ''}`}>
                                    ⏰ {opp.days_left}d left · {opp.deadline_display}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(opp)} title="Preview notification">📧</button>
                                    <a href={opp.registration_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Apply →</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Job Market Inline Panel (embedded inside Dashboard tab) ─────────────
const JobMarketInlinePanel = ({ navigate }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);

    const INLINE_DOMAINS = [
        { key: '', label: '🌐 All' },
        { key: 'ai_ml', label: '🤖 AI/ML' },
        { key: 'data', label: '📊 Data' },
        { key: 'web_dev', label: '💻 Web Dev' },
        { key: 'uiux', label: '🎨 UI/UX' },
        { key: 'management', label: '💼 Management' },
        { key: 'govt_jobs', label: '🏛️ Govt' },
        { key: 'finance', label: '📈 Finance' },
        { key: 'hardware', label: '🔧 Hardware' },
    ];

    useEffect(() => {
        setLoading(true);
        getJobRolesByDomain(selectedDomain)
            .then(res => { setRoles(res.data.roles || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [selectedDomain]);

    // Quick detail modal
    const RoleQuickModal = ({ role, onClose }) => (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 30, maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{role.jobRole}</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)', fontWeight: 700 }}>#{role.domain}</span>
                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: role.riskLevel === 'Low' ? 'rgba(16,185,129,0.15)' : role.riskLevel === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: role.riskLevel === 'Low' ? '#34d399' : role.riskLevel === 'High' ? '#f87171' : '#fbbf24' }}>{role.riskLevel} Risk</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>💰 {role.avgSalaryIndia}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{role.description}</p>

                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                        { label: 'Demand', value: `${role.jobDemandScore}/10`, color: '#34d399' },
                        { label: 'Competition', value: `${role.competitionScore}/10`, color: '#f87171' },
                        { label: 'Selection', value: `${role.selectionProbability}%`, color: '#60a5fa' },
                    ].map(m => (
                        <div key={m.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Companies */}
                <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Top Hiring Companies</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {role.typicalCompanies.map(c => <span key={c} style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: 7, fontSize: 12, border: '1px solid rgba(99,102,241,0.15)' }}>{c}</span>)}
                    </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Skills You Need</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {role.requiredSkills.map(s => <span key={s} className="badge badge-success" style={{ fontSize: 11 }}>{s}</span>)}
                    </div>
                </div>

                {/* Courses */}
                <div>
                    <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Learning Path</h5>
                    {role.recommendedCourses.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                            {c}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {selectedRole && <RoleQuickModal role={selectedRole} onClose={() => setSelectedRole(null)} />}

            {/* Domain filter chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {INLINE_DOMAINS.map(d => (
                    <button key={d.key} onClick={() => setSelectedDomain(d.key)}
                        style={{
                            padding: '7px 14px', borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            background: selectedDomain === d.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${selectedDomain === d.key ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                            color: selectedDomain === d.key ? '#fff' : 'var(--text-secondary)',
                        }}>{d.label}
                    </button>
                ))}
                <button onClick={() => navigate('jobmarket')}
                    style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--primary-light)' }}>
                    Full View ↗
                </button>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {roles.map(role => (
                        <div key={role.id} onClick={() => setSelectedRole(role)}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{role.jobRole}</div>
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)' }}>#{role.domain}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: 14 }}>{role.avgSalaryIndia}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>💹 {role.growthForecast}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>DEMAND {role.jobDemandScore}/10</div>
                                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                                        <div style={{ height: '100%', width: `${role.jobDemandScore * 10}%`, background: '#34d399', borderRadius: 3 }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>COMPETITION {role.competitionScore}/10</div>
                                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                                        <div style={{ height: '100%', width: `${role.competitionScore * 10}%`, background: '#f87171', borderRadius: 3 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, color: role.riskLevel === 'Low' ? '#34d399' : role.riskLevel === 'High' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
                                {role.riskLevel === 'Low' ? '🟢' : role.riskLevel === 'High' ? '🔴' : '🟡'} {role.riskLevel} Risk &bull; {role.selectionProbability}% Selection Rate
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};



// ─── Profile Panel ──────────────────────────────────────────────────
const STREAM_OPTIONS_PROFILE = {
    '10th': ['SSC', 'CBSE', 'ICSE', 'Other'],
    '11th': ['MPC', 'BiPC', 'MEC', 'CEC', 'HEC', 'Other'],
    '12th': ['MPC', 'BiPC', 'MEC', 'CEC', 'HEC', 'Other'],
    'B.Tech': ['CSE', 'CSM', 'CSD', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'],
};

const ProfilePanel = ({ user, onProfileUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const [form, setForm] = useState({
        name: user?.name || '',
        education_level: user?.education_level || '',
        stream: user?.stream || '',
    });

    const currentStreams = STREAM_OPTIONS_PROFILE[form.education_level] || [];

    const handleSave = async () => {
        if (!form.name.trim()) { setToast('Name is required'); return; }
        if (!form.education_level) { setToast('Select education level'); return; }
        if (!form.stream) { setToast('Select stream'); return; }
        setLoading(true);
        try {
            const res = await updateProfile(form);
            onProfileUpdate(res.data.user);
            setToast('Profile updated! ✅');
            setEditing(false);
        } catch (err) {
            setToast(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setForm({ name: user?.name || '', education_level: user?.education_level || '', stream: user?.stream || '' });
        setEditing(false);
    };

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const selectStyle = {
        background: '#0f0f1a', color: '#f1f5f9', border: '1.5px solid rgba(99,102,241,0.25)',
        borderRadius: 10, padding: '13px 14px', fontSize: 15, fontFamily: 'Inter, sans-serif',
        width: '100%', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23a0aec0' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px', paddingRight: 40,
    };

    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ maxWidth: 600 }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 20px', borderRadius: 12,
                    fontWeight: 600, fontSize: 14, background: toast.includes('✅') ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                    border: `1px solid ${toast.includes('✅') ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    color: toast.includes('✅') ? '#34d399' : '#f87171', backdropFilter: 'blur(10px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}>
                    {toast}
                </div>
            )}

            {/* Profile Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 24, padding: '28px 32px', marginBottom: 28,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20,
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800, color: '#fff', flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 24, fontFamily: 'Outfit', marginBottom: 4 }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <span className="badge badge-primary" style={{ fontSize: 12 }}>{user?.education_level}</span>
                        <span className="badge" style={{ fontSize: 12, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{user?.stream}</span>
                    </div>
                </div>
                {!editing && (
                    <button className="btn btn-outline" onClick={() => setEditing(true)}
                        style={{ flexShrink: 0, gap: 6 }}>
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Details / Edit Form */}
            <div className="card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
                    {editing ? '✏️ Edit Your Profile' : '👤 Profile Details'}
                </h3>

                {!editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {[
                            { icon: '👤', label: 'Full Name', value: user?.name },
                            { icon: '📧', label: 'Email', value: user?.email, note: '(cannot be changed)' },
                            { icon: '🎓', label: 'Education Level', value: user?.education_level },
                            { icon: '📚', label: 'Stream / Branch', value: user?.stream },
                            { icon: '📅', label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                            { icon: '✅', label: 'Email Verified', value: user?.otp_verified ? 'Yes' : 'No' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                                        {item.value}
                                        {item.note && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>{item.note}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" value={user?.email} disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Email cannot be changed</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Education Level</label>
                            <select style={selectStyle} value={form.education_level}
                                onChange={e => setForm(f => ({ ...f, education_level: e.target.value, stream: '' }))}>
                                <option value="" style={{ background: '#0f0f1a' }}>Select...</option>
                                {Object.keys(STREAM_OPTIONS_PROFILE).map(k => (
                                    <option key={k} value={k} style={{ background: '#0f0f1a' }}>{k}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                {form.education_level === '10th' ? 'Board Type' : form.education_level === 'B.Tech' ? 'Department' : 'Stream'}
                            </label>
                            <select style={selectStyle} value={form.stream}
                                onChange={e => setForm(f => ({ ...f, stream: e.target.value }))}>
                                <option value="" style={{ background: '#0f0f1a' }}>Select...</option>
                                {currentStreams.map(s => (
                                    <option key={s} value={s} style={{ background: '#0f0f1a' }}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                                onClick={handleSave} disabled={loading}>
                                {loading ? '⏳ Saving...' : '✅ Save Changes'}
                            </button>
                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                                onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────────
const Dashboard = ({ navigate }) => {
    const { user, assessment, logout, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [recommendation, setRecommendation] = useState(null);

    useEffect(() => {
        getRecommendation()
            .then(res => setRecommendation(res.data.recommendation))
            .catch(() => { });
    }, []);

    const DOMAIN_COLORS = { analytical: '#6366f1', creativity: '#ec4899', leadership: '#f59e0b', medical: '#10b981', business: '#8b5cf6' };
    const DOMAIN_ICONS = { analytical: '🧠', creativity: '🎨', leadership: '⚡', medical: '🏥', business: '💼' };

    const NAV_ITEMS = [
        { key: 'overview', icon: '🏠', label: 'Overview' },
        { key: 'profile', icon: '👤', label: 'My Profile' },
        { key: 'assessment', icon: '🧠', label: 'Assessment', action: () => navigate('psychometric') },
        { key: 'roadmap', icon: '🗺️', label: 'Career Roadmap' },
        { key: 'jobmarket', icon: '📊', label: 'Job Market' },
        { key: 'chatbot', icon: '🤖', label: 'AI Advisor' },
        { key: 'opportunities', icon: '🎯', label: 'Opportunities' },
        { key: 'govjobs', icon: '🏛️', label: 'Govt Jobs' },
    ];

    const scores = assessment?.scores || {};
    const sortedDomains = Object.entries(scores).sort(([, a], [, b]) => b - a);

    const OverviewPanel = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Welcome */}
            <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20 }}>
                <h2 style={{ fontSize: 26, fontFamily: 'Outfit', marginBottom: 6 }}>
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    {assessment ? `Your recommended path: ${assessment.top_domain}` : 'Complete your psychometric assessment to get personalized career recommendations.'}
                </p>
                {!assessment && (
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('psychometric')}>
                        🧠 Start Assessment Now →
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                    { icon: '🎓', label: 'Education Level', value: user?.education_level || '—' },
                    { icon: '📚', label: 'Stream', value: user?.stream || '—' },
                    { icon: '🏆', label: 'Top Domain', value: assessment ? assessment.top_domain?.split('/')[0]?.trim() : 'Pending' },
                    { icon: '✅', label: 'Assessment', value: assessment ? 'Completed' : 'Pending' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value" style={{ fontSize: 20, color: assessment ? 'var(--primary-light)' : 'var(--text-primary)' }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Domain scores if available */}
            {assessment && sortedDomains.length > 0 && (
                <div className="card">
                    <h3 style={{ fontSize: 17, marginBottom: 20 }}>📊 Your Domain Profile</h3>
                    <div className="score-bar-wrapper">
                        {sortedDomains.map(([domain, score]) => (
                            <div key={domain} className="score-bar-item">
                                <div className="score-bar-label">
                                    <span>{DOMAIN_ICONS[domain] || '📌'} {domain.charAt(0).toUpperCase() + domain.slice(1)}</span>
                                    <span style={{ color: DOMAIN_COLORS[domain] || 'var(--primary)', fontWeight: 700 }}>{score}%</span>
                                </div>
                                <div className="score-bar-track">
                                    <div className="score-bar-fill" style={{ width: `${score}%`, background: DOMAIN_COLORS[domain] || 'var(--primary)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('results')}>View Full Results →</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('roadmap')}>View Roadmap →</button>
                    </div>
                </div>
            )}

            {/* Quick access */}
            <div>
                <h3 style={{ fontSize: 17, marginBottom: 16 }}>🚀 Project Features Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {[
                        { icon: '🗺️', label: 'Career Roadmap', desc: 'View your personalized path', tab: 'roadmap', color: '#6366f1' },
                        { icon: '📊', label: 'Job Market Engine', desc: 'Demand, salary & companies', tab: 'jobmarket', color: '#818cf8' },
                        { icon: '🤖', label: 'Ask AI Advisor', desc: 'Get career guidance instantly', tab: 'chatbot', color: '#8b5cf6' },
                        { icon: '🎯', label: 'Opportunities', desc: 'Internships & scholarships', tab: 'opportunities', color: '#10b981' },
                        { icon: '🏛️', label: 'Govt Jobs', desc: 'Explore civil services & exams', tab: 'govjobs', color: '#ef4444' },
                        { icon: '🧠', label: 'New Assessment', desc: 'Retake psychometric test', action: () => navigate('psychometric'), color: '#f59e0b' },
                    ].map(item => (
                        <button key={item.label} onClick={() => item.action ? item.action() : setActiveTab(item.tab)}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'var(--bg-card)', border: `1px solid ${item.color}25`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', fontFamily: 'Inter' }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${item.color}10`; e.currentTarget.style.borderColor = `${item.color}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = `${item.color}25`; e.currentTarget.style.transform = ''; }}>
                            <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const PAGE_TITLES = { overview: 'Dashboard', profile: 'My Profile', roadmap: 'Career Roadmap', jobmarket: '📊 Job Market Intelligence', chatbot: 'AI Career Advisor', opportunities: 'Opportunities', govjobs: 'Government Jobs & Exams' };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 28, padding: '0 4px', marginTop: '8px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '40px', width: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }} />
                    <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Lakshyamaarg</span>
                </div>
                {NAV_ITEMS.map(item => (
                    <button key={item.key} className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => item.action ? item.action() : setActiveTab(item.key)}>
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                <div style={{ flexGrow: 1 }} />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <div style={{ padding: '10px 14px', marginBottom: 8, cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    <button className="sidebar-item" onClick={() => { logout(); navigate('landing'); }}
                        style={{ color: '#f87171', width: '100%' }}>
                        <span className="icon">🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dashboard-main">
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit' }}>{PAGE_TITLES[activeTab]}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <LanguageSelector />
                        {assessment && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999 }}>
                                <span style={{ fontSize: 14 }}>🏆</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>{assessment.top_domain}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panels */}
                {activeTab === 'overview' && <OverviewPanel />}
                {activeTab === 'profile' && <ProfilePanel user={user} onProfileUpdate={(updatedUser) => { refreshProfile(); }} />}
                {activeTab === 'roadmap' && <RoadmapPanel topDomain={assessment?.top_domain} />}
                {activeTab === 'jobmarket' && <JobMarketInlinePanel navigate={navigate} />}
                {activeTab === 'chatbot' && <ChatbotPanel />}
                {activeTab === 'opportunities' && <OpportunitiesPanel recommendedDomain={recommendation?.roadmap?.key || ''} user={user} />}
                {activeTab === 'govjobs' && <GovJobsPanel user={user} assessment={assessment} />}
            </main>
        </div>
    );
};

// ─── Govt Jobs Panel ─────────────────────────────────────────────────
const GovJobsPanel = ({ user }) => {
    const isAdmin = user?.email?.includes('admin');
    const [jobs, setJobs] = useState([
        { id: 1, title: 'UPSC Civil Services', category: 'Administration', exam: 'UPSC CSE', eligibility: 'UG/PG', link: 'https://testbook.com/upsc-civil-services' },
        { id: 2, title: 'SSC Combined Graduate Level', category: 'Staff Selection', exam: 'SSC CGL', eligibility: 'UG', link: 'https://testbook.com/ssc-cgl' },
        { id: 3, title: 'NDA / Naval Academy', category: 'Defense', exam: 'NDA', eligibility: '12th', link: 'https://testbook.com/nda' },
        { id: 4, title: 'Indian Engineering Services', category: 'Engineering', exam: 'UPSC IES', eligibility: 'B.Tech', link: 'https://testbook.com/upsc-ese' },
        { id: 5, title: 'Railway Recruitment Board', category: 'Railways', exam: 'RRB NTPC', eligibility: '12th/UG', link: 'https://testbook.com/rrb-ntpc' },
        { id: 6, title: 'IBPS PO', category: 'Banking', exam: 'IBPS PO', eligibility: 'UG', link: 'https://testbook.com/ibps-po' },
        { id: 7, title: 'SBI Probationary Officer', category: 'Banking', exam: 'SBI PO', eligibility: 'UG', link: 'https://testbook.com/sbi-po' },
        { id: 8, title: 'RBI Grade B', category: 'Banking', exam: 'RBI Grade B', eligibility: 'UG/PG', link: 'https://testbook.com/rbi-grade-b' },
        { id: 9, title: 'SSC CHSL', category: 'Staff Selection', exam: 'SSC CHSL', eligibility: '12th', link: 'https://testbook.com/ssc-chsl' },
        { id: 10, title: 'AFCAT', category: 'Defense', exam: 'AFCAT', eligibility: 'UG', link: 'https://testbook.com/afcat' },
        { id: 11, title: 'LIC AAO', category: 'Insurance', exam: 'LIC AAO', eligibility: 'UG', link: 'https://testbook.com/lic-aao' },
        { id: 12, title: 'State PSC Exams', category: 'State Administration', exam: 'State PSC', eligibility: 'UG', link: 'https://testbook.com/state-psc' },
        { id: 13, title: 'GATE (PSU Recruitment)', category: 'Engineering', exam: 'GATE', eligibility: 'B.Tech', link: 'https://testbook.com/gate' },
    ]);
    const [adding, setAdding] = useState(false);
    const [newJob, setNewJob] = useState({ title: '', category: '', exam: '', eligibility: '' });
    const [mockModal, setMockModal] = useState(null);
    const [roadmapModal, setRoadmapModal] = useState(null);

    const suggestExams = () => {
        const edu = user?.education_level || '';
        if (edu.includes('B.Tech') || edu.includes('Engineering')) return jobs.filter(j => j.eligibility.includes('B.Tech') || j.eligibility.includes('UG'));
        if (edu.includes('12') || edu.includes('11')) return jobs.filter(j => j.eligibility.includes('12th'));
        return jobs;
    };

    const suggested = suggestExams();

    const handleAdd = () => {
        setJobs([...jobs, { ...newJob, id: Date.now(), link: '#' }]);
        setAdding(false);
        setNewJob({ title: '', category: '', exam: '', eligibility: '' });
    };

    const handleDelete = (id) => setJobs(jobs.filter(j => j.id !== id));

    return (
        <div>
            {isAdmin && (
                <div style={{ marginBottom: 20, padding: 20, background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: adding ? 16 : 0 }}>
                        <h4 style={{ color: '#ef4444', fontWeight: 700 }}>🔒 Admin Control Panel</h4>
                        <button className="btn btn-primary btn-sm" style={{ background: '#ef4444' }} onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : '+ Add New Job'}</button>
                    </div>
                    {adding && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <input className="form-input" placeholder="Job Title" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
                            <input className="form-input" placeholder="Category" value={newJob.category} onChange={e => setNewJob({ ...newJob, category: e.target.value })} />
                            <input className="form-input" placeholder="Exam Name" value={newJob.exam} onChange={e => setNewJob({ ...newJob, exam: e.target.value })} />
                            <input className="form-input" placeholder="Eligibility (e.g. 12th, B.Tech)" value={newJob.eligibility} onChange={e => setNewJob({ ...newJob, eligibility: e.target.value })} />
                            <button className="btn btn-primary" onClick={handleAdd} style={{ gridColumn: '1 / -1' }}>Save Job Listing</button>
                        </div>
                    )}
                </div>
            )}

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>🎯 Suggested for You (Based on {user?.education_level})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                {suggested.map(job => (
                    <div key={job.id} className="card" style={{ padding: 20, borderTop: '4px solid var(--primary-light)' }}>
                        <div className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', marginBottom: 12 }}>{job.category}</div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{job.title}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Exam: {job.exam} • Eligibility: {job.eligibility}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" style={{ flex: 1, minWidth: '120px', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => setMockModal(job)}>📝 Mock Tests</button>
                            <button className="btn btn-outline btn-sm" style={{ flex: 1, minWidth: '120px', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }} onClick={() => setRoadmapModal(job)}>🗺️ Roadmap</button>
                            {isAdmin && <button className="btn btn-outline btn-sm" onClick={() => handleDelete(job.id)}>🗑️</button>}
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>🏛️ All Government Job Categories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {jobs.map(job => (
                    <div key={job.id} className="card" style={{ padding: 20 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{job.title}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Exam: {job.exam}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Eligibility: <span style={{ color: 'var(--primary-light)' }}>{job.eligibility}</span></p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" style={{ flex: 1, minWidth: '120px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.2)' }} onClick={() => setMockModal(job)}>📝 Mock Tests</button>
                            <button className="btn btn-outline btn-sm" style={{ flex: 1, minWidth: '120px', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }} onClick={() => setRoadmapModal(job)}>🗺️ Roadmap</button>
                            {isAdmin && <button className="btn btn-outline btn-sm" onClick={() => handleDelete(job.id)}>🗑️</button>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mock Test Selection Modal */}
            {mockModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 450, padding: 32, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 20, margin: 0 }}>Select Platform for {mockModal.exam}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setMockModal(null)}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Choose a platform to start your mock tests for {mockModal.title}.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button className="btn btn-outline" style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)' }} onClick={() => window.open(mockModal.link, '_blank')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📘</span> Testbook</span><span>↗</span>
                            </button>
                            <button className="btn btn-outline" style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)' }} onClick={() => window.open(`https://www.adda247.com/search?q=${mockModal.exam}`, '_blank')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🔴</span> Adda247</span><span>↗</span>
                            </button>
                            <button className="btn btn-outline" style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)' }} onClick={() => window.open(`https://www.oliveboard.in/exams/?q=${mockModal.exam}`, '_blank')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🌿</span> Oliveboard</span><span>↗</span>
                            </button>
                            <button className="btn btn-outline" style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)' }} onClick={() => window.open(`https://cracku.in/search?q=${mockModal.exam}`, '_blank')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🎯</span> Cracku</span><span>↗</span>
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Roadmap Modal */}
            {
                roadmapModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 20, margin: 0 }}>Preparation Roadmap</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setRoadmapModal(null)}>✕</button>
                            </div>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px 16px', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(16,185,129,0.2)' }}>
                                <h4 style={{ color: '#10b981', margin: 0, fontSize: 15 }}>{roadmapModal.title}</h4>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, marginTop: 4 }}>Exam: {roadmapModal.exam}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, background: 'rgba(255,255,255,0.1)' }} />

                                {[
                                    { title: '1. Understand the Syllabus & Pattern', desc: 'Thoroughly analyze previous year papers and exact exam syllabus.' },
                                    { title: '2. Gather Standard Resources', desc: 'Collect NCERTs, specific recommended books, and clear fundamental concepts.' },
                                    { title: '3. Daily Practice & Mock Tests', desc: 'Enroll in test series (Testbook/Adda247) and give weekly mocks.' },
                                    { title: '4. Current Affairs & Revision', desc: 'Read daily news, make short notes, and keep revising subjects cyclically.' },
                                    { title: '5. Clear Prelims & Mains (if applicable)', desc: 'Focus strictly on mock analysis leading up to the main exam dates.' }
                                ].map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: '#000', flexShrink: 0 }}>{i + 1}</div>
                                        <div>
                                            <h5 style={{ margin: '0 0 4px', fontSize: 15 }}>{step.title}</h5>
                                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 28 }} onClick={() => setRoadmapModal(null)}>Got it, Let's start!</button>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Dashboard;
