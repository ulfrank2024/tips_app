const express = require("express");
const router = express.Router();
const TipController = require("../controllers/tipController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Create a new tip pool (protected route)
router.post("/pools", authenticateToken, TipController.createPool);

// Update a tip pool (protected route)
router.put("/pools/:poolId", authenticateToken, TipController.updatePool);

// Calculate distribution for a tip pool
router.post("/pools/:poolId/calculate-distribution", authenticateToken, TipController.calculateDistribution);

// Get historical pools for a manager
router.get("/pools/history", authenticateToken, TipController.getPoolHistory);

// Get employee's tip history
router.get("/employees/:employeeId/tips", authenticateToken, TipController.getEmployeeTipHistory);

// Get analytical report for a pool
router.get("/pools/:poolId/report", authenticateToken, TipController.getPoolReport);

// Get pool summary by month for a manager
router.get("/pools/summary-by-month", authenticateToken, TipController.getPoolSummaryByMonth);

// Example protected route (can be removed later)
router.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: "This is a protected route in tip service", user: req.user });
});

module.exports = router;
