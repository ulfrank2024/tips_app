// models/authModel.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
     ssl: {
         rejectUnauthorized: false 
    }
});

const AuthModel = {
    // Company methods
    async createCompany(name) {
        const result = await pool.query(
            "INSERT INTO companies (name) VALUES ($1) RETURNING *",
            [name]
        );
        return result.rows[0];
    },

    // User methods
    async createUser(email, password, role, company_id, category_id, firstName, lastName) {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const result = await pool.query(
            "INSERT INTO users (email, password, role, company_id, category_id, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [email, hashedPassword, role, company_id, category_id, firstName, lastName]
        );
        return result.rows[0];
    },

    async unlinkUserFromCompany(userId) {
        const result = await pool.query(
            'UPDATE users SET company_id = NULL, category_id = NULL WHERE id = $1 RETURNING id, email, first_name, last_name, role',
            [userId]
        );
        return result.rows[0];
    },

    async relinkUserToCompany(userId, companyId, categoryId) {
        const result = await pool.query(
            'UPDATE users SET company_id = $1, category_id = $2 WHERE id = $3 RETURNING id',
            [companyId, categoryId, userId]
        );
        return result.rows[0];
    },

    async findUserByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    async findUserById(id) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0];
    },

    async updatePassword(userId, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, userId]
        );
        return result.rowCount > 0;
    },

    async updateUserName(userId, firstName, lastName) {
        const result = await pool.query(
            "UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3",
            [firstName, lastName, userId]
        );
        return result.rowCount > 0;
    },

    async validateUserEmail(userId) {
        const result = await pool.query(
            "UPDATE users SET email_validated = true, last_validated_at = NOW() WHERE id = $1",
            [userId]
        );
        return result.rowCount > 0;
    },

    // Password reset token methods
    async createPasswordResetToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 3600000); // 1 hour from now
        await pool.query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordResetToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordResetToken(token) {
        await pool.query("DELETE FROM password_reset_tokens WHERE token = $1", [
            token,
        ]);
    },

    // Password setup token methods
    async createPasswordSetupToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 24 * 3600000); // 24 hours from now
        await pool.query(
            "INSERT INTO password_setup_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordSetupToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_setup_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordSetupToken(token) {
        await pool.query("DELETE FROM password_setup_tokens WHERE token = $1", [
            token,
        ]);
    },

    // Email verification OTP methods
    async createEmailVerificationOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO email_verification_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findEmailVerificationOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM email_verification_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deleteEmailVerificationOtp(userId, otp) {
        await pool.query("DELETE FROM email_verification_otps WHERE user_id = $1 AND otp = $2", [
            userId,
            otp,
        ]);
    },

    // Password reset OTP methods
    async createPasswordResetOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO password_reset_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findPasswordResetOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM password_reset_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deletePasswordResetOtp(userId, otp = null) {
        if (otp) {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1 AND otp = $2", [
                userId,
                otp,
            ]);
        } else {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1", [
                userId,
            ]);
        }
    },

    // Invitation code methods
    async createInvitationCode(userId) {
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const expires_at = new Date(Date.now() + 24 * 3600000); // 24 hours from now
        console.log("createInvitationCode: Generating code:", code, "for userId:", userId);
        const result = await pool.query(
            "INSERT INTO invitation_codes (user_id, code, expires_at) VALUES ($1, $2, $3) RETURNING *",
            [userId, code, expires_at]
        );
        console.log("createInvitationCode: Insert result:", result.rows[0]);
        return code;
    },

    async findInvitationCode(userId, code) {
        console.log("findInvitationCode: Searching for userId:", userId, "code:", code);
        const result = await pool.query(
            "SELECT * FROM invitation_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()",
            [userId, code]
        );
        console.log("findInvitationCode: Query result:", result.rows[0]);
        return result.rows[0];
    },

    async deleteInvitationCode(userId, code) {
        await pool.query("DELETE FROM invitation_codes WHERE user_id = $1 AND code = $2", [
            userId,
            code,
        ]);
    },

    async deleteInvitationCodeByUserId(userId) { // New function
        await pool.query("DELETE FROM invitation_codes WHERE user_id = $1", [
            userId,
        ]);
    },

    async getCompanyEmployees(companyId) {
        const result = await pool.query(
            `SELECT
                u.id,
                u.email,
                u.role,
                u.first_name,
                u.last_name,
                u.company_id,
                c.id AS category_id,
                c.name AS category_name,
                c.description AS category_description,
                c.effects_supplements AS category_effects_supplements
            FROM users u
            LEFT JOIN categories c ON u.category_id = c.id
            WHERE u.company_id = $1 AND u.role = 'employee'
            ORDER BY u.email`,
            [companyId]
        );
        console.log("AuthModel.getCompanyEmployees result:", result.rows); // Added console.log
        return result.rows;
    },

    // Category methods
    async createCategory(companyId, name, description, effects_supplements) {
        const result = await pool.query(
            "INSERT INTO categories (company_id, name, description, effects_supplements) VALUES ($1, $2, $3, $4) RETURNING *",
            [companyId, name, description, effects_supplements]
        );
        return result.rows[0];
    },

    async getCompanyCategories(companyId) {
        const result = await pool.query(
            "SELECT * FROM categories WHERE company_id = $1 ORDER BY name",
            [companyId]
        );
        return result.rows;
    },

    async getCategoryById(categoryId) {
        const result = await pool.query(
            "SELECT * FROM categories WHERE id = $1",
            [categoryId]
        );
        return result.rows[0];
    },

    async updateCategory(categoryId, name, description, effects_supplements) {
        const result = await pool.query(
            "UPDATE categories SET name = $1, description = $2, effects_supplements = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
            [name, description, effects_supplements, categoryId]
        );
        return result.rows[0];
    },

    async deleteCategory(categoryId) {
        const result = await pool.query(
            "DELETE FROM categories WHERE id = $1",
            [categoryId]
        );
        return result.rowCount > 0;
    },

    // User category update method
    async updateUserCategory(userId, categoryId) {
        const result = await pool.query(
            "UPDATE users SET category_id = $1 WHERE id = $2 RETURNING *",
            [categoryId, userId]
        );
        return result.rows[0];
    },

    async getUserDetailsById(userId) {
        const result = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.company_id,
                u.category_id,
                c.name AS category_name
            FROM
                users u
            LEFT JOIN
                categories c ON u.category_id = c.id
            WHERE
                u.id = $1`,
            [userId]
        );
        return result.rows[0];
    },
};

module.exports = { AuthModel, pool };