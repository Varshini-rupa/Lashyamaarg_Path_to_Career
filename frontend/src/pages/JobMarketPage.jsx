import React, { useState, useEffect } from 'react';
import { getJobRoles, getJobRolesByDomain } from '../api';
import { useAuth } from '../context/AuthContext';

// ─── Demand bar ─────────────────────────────────────────────────────
const ScoreBar = ({ label, value, max = 10, color }) => (
    <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 700, color }}>{value}/{max}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
        </div>
    </div>
);

// ─── Risk Badge ─────────────────────────────────────────────────────
const RiskBadge = ({ level }) => {
    const config = {
        Low: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)', icon: '🟢' },
        Medium: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)', icon: '🟡' },
        High: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)', icon: '🔴' },
    };
    const c = config[level] || config.Medium;
    return (
        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {c.icon} {level} Risk
        </span>
    );
};

// ─── Frequency Badge ────────────────────────────────────────────────
const FreqBadge = ({ freq }) => {
    const config = {
        'Very High': { color: '#34d399', icon: '⚡' },
        'High': { color: '#60a5fa', icon: '📈' },
        'Medium': { color: '#fbbf24', icon: '📊' },
        'Low': { color: '#f87171', icon: '📉' },
        'N/A': { color: '#6b7280', icon: '—' },
    };
    const c = config[freq] || config.Medium;
    return (
        <span style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{c.icon} {freq}</span>
    );
};

// ─── Role Card ──────────────────────────────────────────────────────
const RoleCard = ({ role, onClick }) => {
    const netScore = role.jobDemandScore - role.competitionScore;
    const netColor = netScore >= 2 ? '#34d399' : netScore >= 0 ? '#fbbf24' : '#f87171';

    return (
        <div
            onClick={() => onClick(role)}
            style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: 20, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 14,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{role.jobRole}</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)' }}>
                        #{role.domain}
                    </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: netColor }}>{netScore > 0 ? '+' : ''}{netScore}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Opportunity Gap</div>
                </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {role.description.substring(0, 100)}…
            </p>

            {/* Mini demand/competition bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DEMAND</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ height: '100%', width: `${role.jobDemandScore * 10}%`, background: '#34d399', borderRadius: 3 }} />
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>COMPETITION</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ height: '100%', width: `${role.competitionScore * 10}%`, background: '#f87171', borderRadius: 3 }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <RiskBadge level={role.riskLevel} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{role.avgSalaryIndia}</div>
            </div>
        </div>
    );
};

// ─── Role Detail Modal ──────────────────────────────────────────────
const RoleModal = ({ role, onClose }) => {
    if (!role) return null;
    const { jobRole, description, domain, requiredSkills, typicalCompanies, avgSalaryIndia,
        jobDemandScore, competitionScore, riskLevel, jobOpeningFrequency,
        selectionProbability, growthForecast, recommendedCourses } = role;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 36, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{jobRole}</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)', fontWeight: 700 }}>#{domain}</span>
                            <RiskBadge level={riskLevel} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>💰 {avgSalaryIndia}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>{description}</p>

                {/* Metrics Charts */}
                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Market Intelligence</h4>
                    <ScoreBar label="💹 Job Demand" value={jobDemandScore} color="#34d399" />
                    <ScoreBar label="⚔️ Competition" value={competitionScore} color="#f87171" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                        <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>{selectionProbability}%</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Selection Rate</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FreqBadge freq={jobOpeningFrequency} />
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Opening Freq.</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{growthForecast}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Growth Forecast</div>
                        </div>
                    </div>
                </div>

                {/* Companies */}
                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Hiring Companies</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {typicalCompanies.map(c => (
                            <span key={c} style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{c}</span>
                        ))}
                    </div>
                </div>

                {/* Skills */}
                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Required Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {requiredSkills.map(s => (
                            <span key={s} className="badge badge-success" style={{ fontSize: 12 }}>{s}</span>
                        ))}
                    </div>
                </div>

                {/* Courses */}
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommended Learning Path</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recommendedCourses.map((c, i) => (
                            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                                <span style={{ fontSize: 14 }}>{c}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ──────────────────────────────────────────────────────
const ALL_DOMAINS = [
    { key: '', label: '🌐 All' },
    { key: 'ai_ml', label: '🤖 AI/ML' },
    { key: 'data', label: '📊 Data' },
    { key: 'web_dev', label: '💻 Web Dev' },
    { key: 'uiux', label: '🎨 UI/UX' },
    { key: 'design', label: '✏️ Design' },
    { key: 'management', label: '💼 Management' },
    { key: 'sales', label: '📢 Sales/Growth' },
    { key: 'entrepreneurship', label: '🚀 Startup' },
    { key: 'govt_jobs', label: '🏛️ Govt Jobs' },
    { key: 'finance', label: '📈 Finance' },
    { key: 'hardware', label: '🔧 Hardware/IoT' },
    { key: 'research', label: '🔬 Research' },
    { key: 'content', label: '🎥 Content' },
];

const JobMarketPage = ({ navigate }) => {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [sortBy, setSortBy] = useState('opportunity'); // opportunity | demand | salary
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        const fetcher = selectedDomain
            ? getJobRolesByDomain(selectedDomain)
            : getJobRoles('');
        fetcher
            .then(res => { setRoles(res.data.roles || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [selectedDomain]);

    const filtered = roles
        .filter(r => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return r.jobRole.toLowerCase().includes(q) || r.domain.includes(q) || r.description.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            if (sortBy === 'opportunity') return (b.jobDemandScore - b.competitionScore) - (a.jobDemandScore - a.competitionScore);
            if (sortBy === 'demand') return b.jobDemandScore - a.jobDemandScore;
            return 0;
        });

    const avgDemand = roles.length ? (roles.reduce((s, r) => s + r.jobDemandScore, 0) / roles.length).toFixed(1) : 0;
    const avgCompetition = roles.length ? (roles.reduce((s, r) => s + r.competitionScore, 0) / roles.length).toFixed(1) : 0;
    const topRole = roles.length ? roles.reduce((top, r) => r.jobDemandScore > top.jobDemandScore ? r : top, roles[0]) : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px 20px' }}>
            {selectedRole && <RoleModal role={selectedRole} onClose={() => setSelectedRole(null)} />}

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <button onClick={() => navigate('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>←</button>
                        <h1 style={{ fontSize: 28, fontWeight: 800, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            📊 Job Market Intelligence Engine
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginLeft: 40 }}>
                        Demand · Competition · Salary · Hiring Companies · Growth Forecast — all in one place.
                    </p>
                </div>

                {/* Summary Stats */}
                {!loading && roles.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Roles Shown', value: filtered.length, icon: '🎯', color: 'var(--primary)' },
                            { label: 'Avg Demand', value: `${avgDemand}/10`, icon: '📈', color: '#34d399' },
                            { label: 'Avg Competition', value: `${avgCompetition}/10`, icon: '⚔️', color: '#f87171' },
                            { label: 'Top Role', value: topRole?.jobRole?.split(' ')[0], icon: '🏆', color: '#fbbf24' },
                        ].map(s => (
                            <div key={s.label} style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                                <div style={{ fontSize: 22 }}>{s.icon}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Domain Tabs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {ALL_DOMAINS.map(d => (
                        <button key={d.key} onClick={() => setSelectedDomain(d.key)}
                            style={{
                                padding: '8px 14px', borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                background: selectedDomain === d.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${selectedDomain === d.key ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                color: selectedDomain === d.key ? '#fff' : 'var(--text-secondary)',
                            }}>
                            {d.label}
                        </button>
                    ))}
                </div>

                {/* Search + Sort */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <input
                        placeholder="Search roles, skills, companies..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: 200, padding: '10px 16px', fontSize: 14 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { key: 'opportunity', label: '⚡ Best Opportunity' },
                            { key: 'demand', label: '📈 Highest Demand' },
                        ].map(s => (
                            <button key={s.key} onClick={() => setSortBy(s.key)}
                                style={{
                                    padding: '10px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    background: sortBy === s.key ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${sortBy === s.key ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                    color: sortBy === s.key ? 'var(--primary-light)' : 'var(--text-secondary)',
                                }}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        No roles found. Try a different domain or search term.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {filtered.map(role => (
                            <RoleCard key={role.id} role={role} onClick={setSelectedRole} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobMarketPage;
