const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require("../middleware/authMiddleware");

// Route for a manager to sign up and create a company
router.post("/signup", AuthController.signup);

// Route for a manager to invite an employee
router.post("/invite-employee", authenticateToken, AuthController.inviteEmployee);

// Route for an employee to set up their password
router.post("/setup-password", AuthController.setupPassword);

// Route to create a company (for admins)
router.post("/companies", AuthController.createCompany);

// Route for user login
router.post("/login", AuthController.login);

// Route for forgot password
router.post('/forgot-password', AuthController.forgotPassword);

// Route for reset password
router.post('/reset-password', AuthController.resetPassword);

// Route for OTP verification
router.post("/verify-otp", AuthController.verifyOtp);

// Route for resending OTP
router.post("/resend-otp", AuthController.resendOtp);

// Route to verify an invitation code
router.post("/verify-invitation", AuthController.verifyInvitation);

// Get user email by ID (protected route)
router.get("/users/:userId/email", authenticateToken, AuthController.getUserEmail);

// Get all employees for a specific company (protected route)
router.get("/companies/:companyId/employees", authenticateToken, AuthController.getCompanyEmployees);

// Route for authenticated user to change their password
router.post("/change-password", authenticateToken, AuthController.changePassword);

// Route for authenticated user to update their profile (first_name, last_name)
router.put("/profile", authenticateToken, AuthController.updateProfile);

// Category Management Routes (Protected for managers)
router.post("/categories", authenticateToken, AuthController.createCategory);
router.get("/categories", authenticateToken, AuthController.getCompanyCategories);
router.get("/categories/:categoryId", authenticateToken, AuthController.getCategoryById);
router.put("/categories/:categoryId", authenticateToken, AuthController.updateCategory);
router.delete("/categories/:categoryId", authenticateToken, AuthController.deleteCategory);

// Route to update an employee's category (protected for managers)
router.put("/users/:userId/category", authenticateToken, AuthController.updateUserCategory);

// Route to get user details (first_name, last_name, category_name) by ID (protected route)
router.get('/users/:userId/details', authenticateToken, AuthController.getUserDetails);

// Route to unlink an employee from a company (soft delete)
router.delete('/employees/:employeeId', authenticateToken, AuthController.unlinkEmployee);

module.exports = router;