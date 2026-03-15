const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../../services/emailService');

// Register
const register = async (req, res) => {
    try {
        const { name, email, education_level, stream, password } = req.body;

        if (!name || !email || !education_level || !stream || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save user with OTP
        const result = await pool.query(
            `INSERT INTO users (name, email, education_level, stream, password, otp)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, education_level, stream`,
            [name.trim(), email.toLowerCase(), education_level, stream, hashedPassword, otp_code]
        );

        // Send real OTP email
        try {
            await sendOtpEmail(email.toLowerCase(), name.trim(), otp_code);
        } catch (emailErr) {
            console.error('❌ Email send failed:', emailErr.message);
            // Don't block registration — log but continue
        }

        console.log(`📧 OTP for ${email}: ${otp_code}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Check your email for OTP.',
            user: result.rows[0],
            // Only expose OTP in development as fallback
            otp: process.env.NODE_ENV !== 'production' ? otp_code : undefined,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP required' });
        }

        const result = await pool.query('SELECT id, otp FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        if (!user.otp) {
            return res.status(400).json({ success: false, message: 'Account already verified. Please login.' });
        }
        if (user.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
        }

        await pool.query('UPDATE users SET otp_verified = 1, otp = NULL WHERE id = $1', [user.id]);
        res.json({ success: true, message: 'Email verified successfully! You can now login.' });
    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'No account found with this email' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        if (!user.otp_verified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first. Check your inbox for the OTP.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                education_level: user.education_level,
                stream: user.stream,
                otp_verified: user.otp_verified,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// Get profile
const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, education_level, stream, otp_verified, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const assessment = await pool.query(
            'SELECT scores, top_domain, explanation, created_at FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );
        const assessmentRow = assessment.rows[0] || null;
        if (assessmentRow && typeof assessmentRow.scores === 'string') {
            try { assessmentRow.scores = JSON.parse(assessmentRow.scores); } catch (_) { }
        }
        res.json({ success: true, user: result.rows[0], assessment: assessmentRow });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Forgot Password — send OTP to email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with this email' });
        }

        const user = result.rows[0];
        const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in the user's otp column (reuse existing column)
        await pool.query('UPDATE users SET otp = $1 WHERE id = $2', [otp_code, user.id]);

        // Send OTP email
        try {
            await sendOtpEmail(email.toLowerCase(), user.name, otp_code);
        } catch (emailErr) {
            console.error('❌ Reset email send failed:', emailErr.message);
        }

        console.log(`🔑 Password reset OTP for ${email}: ${otp_code}`);

        res.json({
            success: true,
            message: 'Password reset OTP sent to your email.',
            otp: process.env.NODE_ENV !== 'production' ? otp_code : undefined,
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reset Password — verify OTP and set new password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const result = await pool.query('SELECT id, otp FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        if (!user.otp || user.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password = $1, otp = NULL WHERE id = $2', [hashedPassword, user.id]);

        console.log(`✅ Password reset successful for ${email}`);

        res.json({ success: true, message: 'Password reset successful! You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { name, education_level, stream } = req.body;
        if (!name || !education_level || !stream) {
            return res.status(400).json({ success: false, message: 'Name, education level, and stream are required' });
        }

        await pool.query(
            'UPDATE users SET name = $1, education_level = $2, stream = $3 WHERE id = $4',
            [name.trim(), education_level, stream, req.user.id]
        );

        const result = await pool.query(
            'SELECT id, name, email, education_level, stream, otp_verified, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        console.log(`\u2705 Profile updated for user #${req.user.id}`);

        res.json({ success: true, message: 'Profile updated successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { register, verifyOtp, login, getProfile, forgotPassword, resetPassword, updateProfile };
