const jobRoles = require('./jobRolesData');

// GET /api/jobmarket/roles?domain=ai_ml&tags=ai_ml,data
const getRoles = (req, res) => {
    try {
        const { domain, tags } = req.query;

        let results = jobRoles;

        if (tags) {
            // tags is a comma-separated list, e.g. "ai_ml,data,research"
            const tagList = tags.split(',').map(t => t.trim().toLowerCase());
            results = jobRoles.filter(r => tagList.includes(r.domain));
        } else if (domain) {
            results = jobRoles.filter(r => r.domain === domain);
        }

        // Sort: high demand first, then low competition
        results = results.sort((a, b) => {
            const scoreA = a.jobDemandScore - a.competitionScore;
            const scoreB = b.jobDemandScore - b.competitionScore;
            return scoreB - scoreA;
        });

        res.json({ success: true, roles: results, total: results.length });
    } catch (err) {
        console.error('Job market error:', err);
        res.status(500).json({ success: false, message: 'Error fetching job roles' });
    }
};

// GET /api/jobmarket/domains  → list all domains
const getDomains = (req, res) => {
    const domains = [...new Set(jobRoles.map(r => r.domain))];
    res.json({ success: true, domains });
};

// GET /api/jobmarket/roles/:id
const getRoleById = (req, res) => {
    const role = jobRoles.find(r => r.id === req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
};

module.exports = { getRoles, getDomains, getRoleById };
