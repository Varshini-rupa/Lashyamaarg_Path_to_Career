// Add Unstop hackathons & internships
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database/lakshyamaarg.db');

const opps = [
    [46, 'Flipkart GRiD 6.0', 'hackathon', 'technology', 'Flipkart', 'India\'s largest e-commerce hackathon. Solve problems in AI, ML, supply chain, and product design.', 'B.Tech/M.Tech students from any college', null, 'Pre-placement interview + Rs. 3,00,000', '2026-06-30', 'https://unstop.com/hackathons/flipkart-grid-60'],
    [47, 'Uber HackTag', 'hackathon', 'technology', 'Uber India', 'Solve real-world mobility and logistics challenges using AI, cloud, and data engineering.', 'Engineering students (B.Tech/M.Tech)', null, 'Rs. 5,00,000 + PPIs at Uber', '2026-07-15', 'https://unstop.com/hackathons/uber-hacktag'],
    [48, 'Amazon ML Challenge', 'hackathon', 'technology', 'Amazon India', 'Machine Learning competition to build models for e-commerce product classification.', 'B.Tech/M.Tech students with ML knowledge', null, 'Rs. 2,50,000 + Amazon interviews', '2026-05-31', 'https://unstop.com/hackathons/amazon-ml-challenge'],
    [49, 'Accenture Innovation Challenge', 'hackathon', 'technology', 'Accenture', 'Solve business problems using emerging tech — AI, blockchain, IoT, cloud.', 'All UG/PG engineering students', null, 'Rs. 3,00,000 + internship offers', '2026-08-15', 'https://unstop.com/hackathons/accenture-innovation-challenge'],
    [50, 'Tata Imagination Challenge', 'hackathon', 'business', 'Tata Group', 'Business strategy competition — create innovative solutions for Tata companies.', 'MBA/BBA/B.Com students', null, 'Rs. 5,00,000 + pre-placement', '2026-09-30', 'https://unstop.com/competitions/tata-imagination-challenge'],
    [51, 'HackerEarth Developer Challenge', 'hackathon', 'technology', 'HackerEarth via Unstop', 'Competitive coding and hackathon challenges from top tech companies.', 'All engineering and CS students', null, 'Varies (Rs. 50,000 - 5,00,000)', '2026-12-31', 'https://unstop.com/hackathons'],
    [52, 'Mahindra Rise Challenge', 'hackathon', 'business', 'Mahindra Group', 'Innovation and strategy challenge across automotive, IT, and finance sectors.', 'MBA/Engineering students', null, 'Rs. 2,00,000 + mentorship', '2026-08-31', 'https://unstop.com/competitions/mahindra-rise-challenge'],
    [53, 'L&T TechGium', 'hackathon', 'technology', 'Larsen & Toubro', 'National tech competition in AI, robotics, cybersecurity, and smart infra.', 'B.Tech final year / M.Tech students', null, 'Rs. 6,00,000 + job offers', '2026-07-31', 'https://unstop.com/hackathons/techgium-lt'],
    [54, 'Unstop Talent Park Internship', 'internship', 'technology', 'Unstop', 'Internships at 500+ companies via Unstop Talent Park — tech, marketing, design, business.', 'All college students (any stream)', 'Varies by company', null, '2026-12-31', 'https://unstop.com/internships'],
    [55, 'Wipro TalentNext Internship', 'internship', 'technology', 'Wipro', '6-week tech internship in Java, DBMS, cloud, and software engineering.', 'B.Tech 3rd/4th year students', 'Rs. 10,000 - 15,000/month', null, '2026-06-30', 'https://unstop.com/internships/wipro-talentnext'],
    [56, 'Infosys InStep Internship', 'internship', 'technology', 'Infosys', 'Global internship at Infosys campuses in AI, data science, cloud, and consulting.', 'B.Tech/M.Tech/MBA students with 70%+', 'Rs. 25,000 - 40,000/month', null, '2026-05-31', 'https://unstop.com/internships/infosys-instep'],
    [57, 'TCS CodeVita Season 12', 'hackathon', 'technology', 'TCS', 'Global coding competition — top performers get direct interview at TCS.', 'All B.Tech/MCA students', null, 'USD 20,000 grand prize + job offer', '2026-09-30', 'https://unstop.com/hackathons/tcs-codevita'],
    [58, 'Cognizant Digital Nurture Internship', 'internship', 'technology', 'Cognizant', '21-day virtual internship in Java, web dev, and AI/ML with certification.', 'B.Tech 2nd/3rd year CSE/IT students', 'Certificate + pre-placement', null, '2026-07-15', 'https://unstop.com/internships/cognizant-digital-nurture'],
    [59, 'ITC Interrobang Season 10', 'hackathon', 'business', 'ITC Limited', 'India\'s largest B-school case study competition across marketing, ops, and strategy.', 'MBA/PGDM students from top B-schools', null, 'Rs. 20,00,000 total prizes', '2026-10-31', 'https://unstop.com/competitions/itc-interrobang'],
    [60, 'Goldman Sachs Engineering Internship', 'internship', 'technology', 'Goldman Sachs via Unstop', 'Virtual internship covering software engineering, risk analysis, and fintech.', 'B.Tech/M.Tech students in CS/IT/ECE', 'Certificate + skill badges', null, '2026-12-31', 'https://unstop.com/internships/goldman-sachs-engineering'],
];

db.serialize(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO opportunities (id, title, type, domain, organizer, description, eligibility, stipend, prize, deadline, registration_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    opps.forEach(o => stmt.run(o));
    stmt.finalize(() => {
        console.log('Added ' + opps.length + ' Unstop opportunities!');
        db.all('SELECT type, COUNT(*) as count FROM opportunities GROUP BY type', (e, r) => {
            r.forEach(row => console.log('  ' + row.type + ': ' + row.count));
            db.all('SELECT COUNT(*) as total FROM opportunities', (e2, r2) => {
                console.log('TOTAL: ' + r2[0].total);
                db.close();
            });
        });
    });
});
