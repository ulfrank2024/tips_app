const { AuthModel } = require("../models/authModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const AuthController = {
    createCompany: async (req, res) => {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "COMPANY_NAME_REQUIRED" });
        }
        try {
            const company = await AuthModel.createCompany(name);
            res.status(201).json({ message: "Company created successfully.", company });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    signup: async (req, res) => {
        const { email, password, companyName, firstName, lastName } = req.body;
        if (!email || !password || !companyName || !firstName || !lastName) {
            return res.status(400).json({ error: "SIGNUP_FIELDS_REQUIRED" });
        }
        try {
            let user = await AuthModel.findUserByEmail(email);
            if (user && user.email_validated) {
                return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
            } else if (user && !user.email_validated) {
                const otp = await AuthModel.createEmailVerificationOtp(user.id);
                const mailOptions = {
                    from: process.env.SMTP_FROM_EMAIL,
                    to: email,
                    subject: "Verify your account",
                    html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
                };
                await transporter.sendMail(mailOptions);
                return res.status(200).json({
                    message: "Account already exists but email is not verified. A new verification code has been sent to your email.",
                });
            }

            const company = await AuthModel.createCompany(companyName);
            user = await AuthModel.createUser(email, password, 'manager', company.id, null, firstName, lastName);
            const otp = await AuthModel.createEmailVerificationOtp(user.id);
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Verify your account",
                html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
            };
            await transporter.sendMail(mailOptions);
            res.status(201).json({
                message: "Manager account created. A verification code has been sent to your email.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    verifyOtp: async (req, res) => {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "EMAIL_OTP_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }
            const otpData = await AuthModel.findEmailVerificationOtp(user.id, otp);
            if (!otpData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_OTP" });
            }
            await AuthModel.validateUserEmail(user.id);
            await AuthModel.deleteEmailVerificationOtp(user.id, otp);
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Bienvenue !",
                html: `<p>Bienvenue sur notre plateforme ! Votre compte est maintenant activé.</p>`,
            };
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "Email vérifié avec succès !" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    resendOtp: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "EMAIL_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }
            const otp = await AuthModel.createEmailVerificationOtp(user.id);
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Nouveau code de vérification",
                html: `<p>Votre nouveau code de vérification est : <strong>${otp}</strong></p>`,
            };
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "Un nouveau code a été envoyé." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "LOGIN_FIELDS_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ error: "INVALID_CREDENTIALS" });
            }
            if (!user.email_validated) {
                return res.status(401).json({ error: "EMAIL_NOT_VALIDATED" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "INVALID_CREDENTIALS" });
            }
            const payload = { id: user.id, role: user.role, company_id: user.company_id };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(200).json({ message: "Connexion réussie.", token, user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "EMAIL_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "FORGOT_PASSWORD_USER_NOT_FOUND" });
            }
            await AuthModel.deletePasswordResetOtp(user.id);
            const otp = await AuthModel.createPasswordResetOtp(user.id);
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Code de réinitialisation de votre mot de passe",
                html: `<p>Votre code de réinitialisation de mot de passe est : <strong>${otp}</strong></p>`,
            };
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "Password reset link sent successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    resetPassword: async (req, res) => {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res.status(400).json({ error: "EMAIL_OTP_PASSWORD_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }
            const otpData = await AuthModel.findPasswordResetOtp(user.id, otp);
            if (!otpData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_OTP" });
            }
            await AuthModel.updatePassword(user.id, password);
            await AuthModel.deletePasswordResetOtp(user.id, otp);
            res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    inviteEmployee: async (req, res) => {
        const manager = req.user;
        const { email, category_id } = req.body;
        if (!email || !category_id) {
            return res.status(400).json({ error: "INVITE_FIELDS_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);

            if (user) {
                // Case 1: User exists and is already active in another company.
                if (user.company_id) {
                    return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
                }
                // Case 2: User exists but is un-linked (company_id is NULL). This is our re-invite case.
                else if (user.password && user.email_validated) {
                    await AuthModel.relinkUserToCompany(user.id, manager.company_id, category_id);
                    
                    // TODO: Get company name for the email
                    const mailOptions = {
                        from: process.env.SMTP_FROM_EMAIL,
                        to: email,
                        subject: "Vous avez été ajouté à une nouvelle équipe !",
                        html: `<p>Bonjour,</p><p>Vous faites maintenant partie d'une nouvelle équipe. Vous pouvez vous connecter à l'application pour voir les détails.</p>`,
                    };
                    await transporter.sendMail(mailOptions);
                    
                    return res.status(200).json({ message: "Existing employee added to your company." });
                }
                // Case 3: User exists but never finished initial setup.
                else {
                    await AuthModel.deleteInvitationCodeByUserId(user.id);
                    const code = await AuthModel.createInvitationCode(user.id);
                    const mailOptions = {
                        from: process.env.SMTP_FROM_EMAIL,
                        to: email,
                        subject: "Vous êtes invité à rejoindre une équipe !",
                        html: `<p>Bonjour,</p><p>Vous avez été invité à rejoindre une équipe. Utilisez le code ci-dessous dans l'application pour finaliser votre inscription :</p><h2>${code}</h2>`,
                    };
                    await transporter.sendMail(mailOptions);
                    return res.status(200).json({ message: "Invitation re-sent successfully." });
                }
            }

            // Case 4: User does not exist at all.
            const category = await AuthModel.getCategoryById(category_id);
            if (!category || category.company_id !== manager.company_id) {
                return res.status(400).json({ error: "INVALID_CATEGORY_ID" });
            }

            const newUser = await AuthModel.createUser(email, null, 'employee', manager.company_id, category_id);
            const code = await AuthModel.createInvitationCode(newUser.id);

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Vous êtes invité à rejoindre une équipe !",
                html: `<p>Bonjour,</p><p>Vous avez été invité à rejoindre une équipe. Utilisez le code ci-dessous dans l'application pour finaliser votre inscription :</p><h2>${code}</h2>`,
            };
            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Invitation sent successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    setupPassword: async (req, res) => {
        const { token, password, firstName, lastName } = req.body;
        if (!token || !password || !firstName || !lastName) {
            return res.status(400).json({ error: "TOKEN_PASSWORD_REQUIRED" });
        }
        try {
            const tokenData = await AuthModel.findPasswordSetupToken(token);
            if (!tokenData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
            }
            await AuthModel.updatePassword(tokenData.user_id, password);
            await AuthModel.updateUserName(tokenData.user_id, firstName, lastName);
            await AuthModel.validateUserEmail(tokenData.user_id);
            await AuthModel.deletePasswordSetupToken(token);
            res.status(200).json({ message: "Password set up successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    verifyInvitation: async (req, res) => {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: "EMAIL_CODE_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }
            const codeData = await AuthModel.findInvitationCode(user.id, code);
            if (!codeData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_CODE" });
            }
            const token = await AuthModel.createPasswordSetupToken(user.id);
            await AuthModel.deleteInvitationCode(user.id, code);
            res.status(200).json({ message: "Invitation code verified.", setupToken: token });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    getUserEmail: async (req, res) => {
        const { userId } = req.params;
        try {
            const user = await AuthModel.findUserById(userId);
            if (!user) {
                return res.status(404).json({ error: "USER_NOT_FOUND" });
            }
            res.status(200).json({ email: user.email });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    unlinkEmployee: async (req, res) => {
        const { employeeId } = req.params;
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        try {
            const employee = await AuthModel.findUserById(employeeId);
            if (!employee || employee.company_id !== company_id) {
                return res.status(404).json({ error: "EMPLOYEE_NOT_FOUND_IN_COMPANY" });
            }
            const unlinkedUser = await AuthModel.unlinkUserFromCompany(employeeId);
            res.status(200).json({ message: "Employee unlinked successfully.", user: unlinkedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    getCompanyEmployees: async (req, res) => {
        const { company_id } = req.user;
        try {
            const employees = await AuthModel.getCompanyEmployees(company_id);
            res.status(200).json(employees);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "PASSWORD_FIELDS_REQUIRED" });
        }
        try {
            const user = await AuthModel.findUserById(userId);
            if (!user) {
                return res.status(404).json({ error: "USER_NOT_FOUND" });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "INVALID_CURRENT_PASSWORD" });
            }
            await AuthModel.updatePassword(userId, newPassword);
            res.status(200).json({ message: "Password changed successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    updateProfile: async (req, res) => {
        const { firstName, lastName } = req.body;
        const userId = req.user.id;
        if (!firstName || !lastName) {
            return res.status(400).json({ error: "NAME_FIELDS_REQUIRED" });
        }
        try {
            const success = await AuthModel.updateUserName(userId, firstName, lastName);
            if (!success) {
                return res.status(404).json({ error: "USER_NOT_FOUND" });
            }
            const updatedUser = await AuthModel.findUserById(userId);
            res.status(200).json({ message: "Profile updated successfully.", user: updatedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    createCategory: async (req, res) => {
        const { name, description, effects_supplements } = req.body;
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        if (!name) {
            return res.status(400).json({ error: "CATEGORY_NAME_REQUIRED" });
        }
        try {
            const category = await AuthModel.createCategory(company_id, name, description, effects_supplements);
            res.status(201).json({ message: "Category created successfully.", category });
        } catch (err) {
            console.error(err);
            if (err.code === '23505') {
                return res.status(409).json({ error: "CATEGORY_NAME_ALREADY_EXISTS" });
            }
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    getCompanyCategories: async (req, res) => {
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        try {
            const categories = await AuthModel.getCompanyCategories(company_id);
            res.status(200).json(categories);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    getCategoryById: async (req, res) => {
        const { categoryId } = req.params;
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        try {
            const category = await AuthModel.getCategoryById(categoryId);
            if (!category || category.company_id !== company_id) {
                return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });
            }
            res.status(200).json(category);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    updateCategory: async (req, res) => {
        const { categoryId } = req.params;
        const { name, description, effects_supplements } = req.body;
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        if (!name) {
            return res.status(400).json({ error: "CATEGORY_NAME_REQUIRED" });
        }
        try {
            const existingCategory = await AuthModel.getCategoryById(categoryId);
            if (!existingCategory || existingCategory.company_id !== company_id) {
                return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });
            }
            const updatedCategory = await AuthModel.updateCategory(categoryId, name, description, effects_supplements);
            res.status(200).json({ message: "Category updated successfully.", category: updatedCategory });
        } catch (err) {
            console.error(err);
            if (err.code === '23505') {
                return res.status(409).json({ error: "CATEGORY_NAME_ALREADY_EXISTS" });
            }
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    deleteCategory: async (req, res) => {
        const { categoryId } = req.params;
        const { company_id, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        try {
            const existingCategory = await AuthModel.getCategoryById(categoryId);
            if (!existingCategory || existingCategory.company_id !== company_id) {
                return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });
            }
            await AuthModel.deleteCategory(categoryId);
            res.status(200).json({ message: "Category deleted successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    updateUserCategory: async (req, res) => {
        const { userId } = req.params;
        const { category_id } = req.body;
        const { company_id: authCompanyId, role } = req.user;
        if (role !== 'manager') {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }
        try {
            const userToUpdate = await AuthModel.findUserById(userId);
            if (!userToUpdate || userToUpdate.company_id !== authCompanyId) {
                return res.status(404).json({ error: "USER_NOT_FOUND" });
            }
            const category = await AuthModel.getCategoryById(category_id);
            if (!category || category.company_id !== authCompanyId) {
                return res.status(400).json({ error: "INVALID_CATEGORY_ID" });
            }
            const updatedUser = await AuthModel.updateUserCategory(userId, category_id);
            res.status(200).json({ message: "User category updated successfully.", user: updatedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    getUserDetails: async (req, res) => {
        const { userId } = req.params;
        try {
            const userDetails = await AuthModel.getUserDetailsById(userId);
            if (!userDetails) {
                return res.status(404).json({ error: "USER_NOT_FOUND" });
            }
            res.status(200).json(userDetails);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },
};

module.exports = AuthController;