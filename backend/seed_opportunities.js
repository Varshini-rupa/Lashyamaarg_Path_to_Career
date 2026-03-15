// Script to seed expanded opportunities into the database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database/lakshyamaarg.db');

const opportunities = [
    // ═══ INTERNSHIPS ═══
    [1, 'IIT Bombay Summer Research Internship', 'internship', 'technology', 'IIT Bombay', 'Work with top IIT professors on AI and ML research projects for 8 weeks.', 'B.Tech/B.E. students, 2nd year and above, CGPA 7.5+', 'Rs. 15,000/month', null, '2026-04-30', 'https://www.iitb.ac.in/en/education/summer-research-internship-programme'],
    [2, 'Google Summer of Code 2026', 'internship', 'technology', 'Google', 'Global program connecting students with open source organizations for coding projects.', 'Students 18+ enrolled in accredited institution', 'USD 1,500 - 6,600', null, '2026-04-08', 'https://summerofcode.withgoogle.com'],
    [3, 'AIIMS Summer Student Research Programme', 'internship', 'medical', 'AIIMS New Delhi', 'Hands-on research experience in clinical and basic medical sciences at AIIMS.', 'MBBS students in 1st or 2nd year', 'Rs. 10,000/month', null, '2026-03-31', 'https://www.aiims.edu/en.html'],
    [4, 'Unilever Future Leaders Program', 'internship', 'business', 'Hindustan Unilever', 'Premium paid internship in FMCG management — sales, marketing, supply chain.', 'MBA students / Final year BBA / B.Com', 'Rs. 50,000/month', null, '2026-05-15', 'https://careers.unilever.com/in/en'],
    [5, 'ICICI Lombard Legal Internship', 'internship', 'law', 'ICICI Lombard', 'Internship in corporate legal, compliance, and regulatory affairs.', 'LLB/LLM students in penultimate or final year', 'Rs. 20,000/month', null, '2026-04-20', 'https://www.icicilombard.com/about-us/careers'],
    [6, 'INSA Summer Research Fellowship', 'internship', 'medical', 'Indian National Science Academy', 'Research fellowship in life sciences, chemistry, and physical sciences.', 'Students pursuing B.Sc/M.Sc with 60%+ marks', 'Rs. 10,000/month', null, '2026-03-15', 'https://www.insaindia.res.in/summerFellow.php'],
    [7, 'ISRO Internship Programme', 'internship', 'technology', 'ISRO', 'Internship at ISRO centres — space science, satellite tech, and rocket systems.', 'B.Tech/M.Tech/B.Sc/M.Sc students', 'Rs. 10,000/month', null, '2026-06-30', 'https://www.isro.gov.in/InternshipAtISRO.html'],
    [8, 'DRDO Internship Scheme', 'internship', 'technology', 'DRDO', 'Work on defence technology projects at DRDO labs across India.', 'B.Tech/M.Tech students with 60%+ marks', 'Rs. 15,000/month', null, '2026-05-31', 'https://www.drdo.gov.in'],
    [9, 'SEBI Legal Internship', 'internship', 'law', 'SEBI', 'Legal internship at SEBI headquarters covering capital market regulation.', 'Law students (3rd year LLB / 4th-5th year integrated)', 'Rs. 10,000/month', null, '2026-04-15', 'https://www.sebi.gov.in'],
    [10, 'Deloitte India Internship', 'internship', 'business', 'Deloitte India', 'Consulting, audit, and technology internships at a Big 4 firm.', 'Final year B.Com/BBA/MBA/CA students', 'Rs. 25,000 - 40,000/month', null, '2026-05-30', 'https://www2.deloitte.com/in/en/careers.html'],
    [11, 'AICTE Internship Portal', 'internship', 'technology', 'AICTE', 'Official AICTE portal connecting engineering students with industry internships.', 'B.Tech/B.E. students from AICTE-approved colleges', 'Varies by company', null, '2026-12-31', 'https://internship.aicte-india.org'],
    [12, 'NID Design Internship', 'internship', 'design', 'National Institute of Design', 'Design internships at premier design institutes and partner companies.', 'Students pursuing B.Des/M.Des/BFA', 'Rs. 10,000 - 25,000/month', null, '2026-06-15', 'https://www.nid.edu'],

    // ═══ HACKATHONS ═══
    [13, 'Smart India Hackathon 2026', 'hackathon', 'technology', 'Ministry of Education', 'India\'s largest hackathon — solve real government problems using tech and innovation.', 'All college students (UG & PG)', null, 'Rs. 1,00,000 per team', '2026-06-15', 'https://sih.gov.in'],
    [14, 'Adobe Design Challenge', 'hackathon', 'design', 'Adobe India', 'National UI/UX and design competition. Solve real creative briefs.', 'Students in design or engineering degree', null, 'Rs. 3,00,000 in prizes', '2026-07-01', 'https://www.adobeawards.com'],
    [15, 'Microsoft Imagine Cup 2026', 'hackathon', 'technology', 'Microsoft', 'Global student tech competition — build AI solutions for real problems.', 'Students in college/university, team of 1-4', null, 'USD 100,000 grand prize', '2026-05-30', 'https://imaginecup.microsoft.com'],
    [16, 'Tata Crucible Campus Quiz', 'hackathon', 'business', 'Tata Group', 'Premier business quiz covering current affairs, economics, and corporate world.', 'Students from any stream in UG/PG', null, 'Rs. 2,00,000 per team', '2026-08-20', 'https://www.tatacrucible.com'],
    [17, 'Bar Council Moot Court Competition', 'hackathon', 'law', 'Bar Council of India', 'National moot court on constitutional and human rights topics.', 'LLB students from any recognized law college', null, 'Trophy + Rs. 50,000', '2026-09-10', 'https://www.barcouncilofindia.org'],
    [18, 'Kavach Cybersecurity Hackathon', 'hackathon', 'technology', 'MHA + AICTE', 'Build solutions for anti-cybercrime, data protection, digital forensics.', 'B.Tech/MCA students in cybersecurity', null, 'Rs. 1,00,000 per team', '2026-07-30', 'https://kavach.mic.gov.in'],
    [19, 'NASSCOM AI Game Changer Awards', 'hackathon', 'technology', 'NASSCOM', 'Build innovative AI/ML solutions. Showcase at NASSCOM AI Summit.', 'All engineering and science students', null, 'Rs. 5,00,000 in prizes', '2026-08-15', 'https://nasscom.in'],
    [20, 'e-Yantra Robotics Competition', 'hackathon', 'technology', 'IIT Bombay + MHRD', 'National robotics competition with embedded systems and IoT challenges.', 'Engineering students in teams of 4', null, 'Certificates + cash prizes', '2026-10-15', 'https://www.e-yantra.org'],
    [21, 'NITI Aayog ATL Marathon', 'hackathon', 'technology', 'NITI Aayog', 'Innovation challenge for students at Atal Tinkering Labs.', 'School students Class 6 to 12', null, 'Rs. 20,000/team + mentorship', '2026-09-30', 'https://aim.gov.in/atl.php'],
    [22, 'Toycathon', 'hackathon', 'design', 'Ministry of Education + AICTE', 'Design innovative toys and games using Indian culture and knowledge systems.', 'School & college students', null, 'Rs. 50,000 - 5,00,000', '2026-08-31', 'https://toycathon.mic.gov.in'],

    // ═══ SCHOLARSHIPS ═══
    [23, 'National Merit Scholarship (NMSS)', 'scholarship', 'general', 'Ministry of Education', 'Merit-based scholarship for outstanding Class XI and XII students.', 'Class XI students with 80%+ in Class X boards', 'Rs. 12,000/year', null, '2026-09-30', 'https://scholarships.gov.in'],
    [24, 'PM Scholarship for CAPF Wards', 'scholarship', 'general', 'Ministry of Home Affairs', 'For wards of ex/serving CAPF personnel pursuing professional degrees.', 'Wards of CAPF/RPF personnel', 'Rs. 36,000/year', null, '2026-10-31', 'https://scholarships.gov.in'],
    [25, 'Reliance Foundation Scholarship', 'scholarship', 'technology', 'Reliance Foundation', 'Merit-cum-means for UG students in STEM and management fields.', 'UG 1st year, income < Rs. 2.5L, JEE/CLAT qualified', 'Rs. 4,00,000 over 4 years', null, '2026-07-15', 'https://www.reliancefoundation.org/rf-scholarships'],
    [26, 'INSPIRE Scholarship (DST)', 'scholarship', 'medical', 'Dept of Science & Technology', 'For students pursuing basic sciences — B.Sc/M.Sc/Integrated M.Sc.', 'Top 1% in Class XII, pursuing B.Sc/M.Sc in science', 'Rs. 80,000/year', null, '2026-09-15', 'https://www.online-inspire.gov.in'],
    [27, 'Central Sector Scholarships (CSSS)', 'scholarship', 'general', 'Ministry of Education', 'For meritorious students from low-income families in higher education.', 'Top 20th percentile in XII boards, income < Rs. 8L', 'Rs. 10,000 - 20,000/year', null, '2026-10-31', 'https://scholarships.gov.in'],
    [28, 'Post Matric Scholarship SC/ST', 'scholarship', 'general', 'Ministry of Social Justice', 'For SC/ST students from Class XI to PhD level.', 'SC/ST students, family income < Rs. 2.5 lakh', 'Full tuition + Rs. 3,500/month', null, '2026-11-30', 'https://scholarships.gov.in'],
    [29, 'Pragati Scholarship for Girls (AICTE)', 'scholarship', 'technology', 'AICTE', 'For girl students in technical education — one per family.', 'Girl students in AICTE programs, income < Rs. 8L', 'Rs. 50,000/year', null, '2026-10-31', 'https://www.aicte-india.org/schemes/students-development-schemes/pragati-scholarship'],
    [30, 'Saksham Scholarship PwD (AICTE)', 'scholarship', 'technology', 'AICTE', 'For differently-abled students in technical education.', 'PwD students, 40%+ disability, AICTE programs', 'Rs. 50,000/year', null, '2026-10-31', 'https://www.aicte-india.org/schemes/students-development-schemes/saksham-scholarship'],
    [31, 'Tata Trusts Scholarship', 'scholarship', 'general', 'Tata Trusts', 'Need-based scholarship at select partner institutions.', 'UG/PG students, family income < Rs. 4 lakh', 'Up to Rs. 1,00,000/year', null, '2026-08-31', 'https://www.tatatrusts.org/our-work/individual-grants-programme'],
    [32, 'Maulana Azad National Fellowship', 'scholarship', 'general', 'Ministry of Minority Affairs', 'Fellowship for minority community students in M.Phil/Ph.D.', 'Minority students, NET/JRF qualified', 'Rs. 31,000/month + HRA', null, '2026-12-31', 'https://scholarships.gov.in'],
    [33, 'ONGC Scholarship SC/ST', 'scholarship', 'technology', 'ONGC', 'For SC/ST students in engineering, medical, MBA, masters.', 'SC/ST with 60%+ marks, income < Rs. 2L', 'Rs. 48,000/year', null, '2026-09-30', 'https://www.ongcindia.com'],
    [34, 'Sitaram Jindal Foundation Scholarship', 'scholarship', 'general', 'Sitaram Jindal Foundation', 'For meritorious students from economically weaker sections.', 'Students Class IX to PG, income < Rs. 2L', 'Rs. 4,000 - 24,000/year', null, '2026-07-31', 'https://www.sitaramjindalfoundation.org'],
    [35, 'Vidyasaarathi Scholarship Portal', 'scholarship', 'general', 'NSDL e-Governance', 'Multiple corporate scholarships (HDFC, LIC, Kotak) on one portal.', 'Varies per scholarship', 'Rs. 10,000 - 75,000/year', null, '2026-12-31', 'https://www.vidyasaarathi.co.in/vidyasaarathi/'],
    [36, 'NID Design Talent Scholarship', 'scholarship', 'design', 'NID', 'Scholarship for underprivileged students in design programs.', 'UG design students, income < Rs. 4.5 lakh', 'Rs. 40,000/year', null, '2026-11-30', 'https://www.nid.edu'],

    // ═══ GOVERNMENT PORTALS ═══
    [37, 'National Apprenticeship Training', 'internship', 'general', 'Ministry of Skill Development', 'Govt-funded on-the-job training in 35,000+ establishments.', 'ITI/Diploma/Degree holders (all streams)', 'Rs. 7,000 - 9,000/month', null, '2026-12-31', 'https://www.apprenticeshipindia.gov.in'],
    [38, 'PMKVY Skill Training', 'scholarship', 'general', 'Ministry of Skill Development', 'Free skill training + certification in 200+ job roles.', 'Indian youth aged 15-45, any education', 'Free training + allowance', null, '2026-12-31', 'https://www.pmkvyofficial.org'],
    [39, 'Startup India Innovation Challenge', 'hackathon', 'business', 'DPIIT, Ministry of Commerce', 'Innovation challenges for student entrepreneurs to pitch startups.', 'College students with startup ideas', null, 'Incubation + Rs. 10 lakh seed', '2026-08-31', 'https://www.startupindia.gov.in'],
    [40, 'National Career Service Portal', 'internship', 'general', 'Ministry of Labour', 'Official govt portal for internships, jobs, and career counseling.', 'All students and job seekers', 'Varies', null, '2026-12-31', 'https://www.ncs.gov.in'],
];

// Clear existing and insert new
db.serialize(() => {
    db.run('DELETE FROM opportunities', (err) => {
        if (err) console.error('Delete error:', err.message);
        else console.log('Cleared old opportunities');
    });

    const stmt = db.prepare(`INSERT INTO opportunities (id, title, type, domain, organizer, description, eligibility, stipend, prize, deadline, registration_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    opportunities.forEach(opp => stmt.run(opp));

    stmt.finalize(() => {
        console.log(`\n✅ Seeded ${opportunities.length} opportunities!`);
        console.log('Categories:');
        const types = {};
        opportunities.forEach(o => { types[o[2]] = (types[o[2]] || 0) + 1; });
        Object.entries(types).forEach(([t, c]) => console.log(`   ${t}: ${c}`));

        db.close();
    });
});
