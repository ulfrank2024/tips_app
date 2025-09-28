const { TipModel } = require("../models/tipModel");
const { default: fetch } = require('node-fetch'); // For making HTTP requests

// Function to fetch employee email from auth-service via API
async function fetchEmployeeEmailFromAuthService(userId, token) {
    const AUTH_SERVICE_URL = `http://auth-service:3000/api/auth/users/${userId}/email`; // Use service name for Docker internal network
    try {
        const response = await fetch(AUTH_SERVICE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch email for user ${userId}`);
        }
        const data = await response.json();
        return data.email;
    } catch (error) {
        console.error(`Error fetching email for user ${userId}:`, error.message);
        throw error; // Re-throw to be caught by calculateDistribution's catch block
    }
}

// Function to fetch user details (name, category) from auth-service via API
async function fetchUserDetailsFromAuthService(userId, token) {
    const AUTH_SERVICE_URL = `http://auth-service:3000/api/auth/users/${userId}/details`; // New endpoint in auth-service
    try {
        const response = await fetch(AUTH_SERVICE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch details for user ${userId}`);
        }
        const data = await response.json();
        return data; // Should contain first_name, last_name, category_name
    } catch (error) {
        console.error(`Error fetching user details for user ${userId}:`, error.message);
        return null; // Return null or throw, depending on desired error handling
    }
}

const TipController = {
    async createPool(req, res) {
        const { name, start_date, end_date, total_amount, distribution_model, employees } = req.body;
        const { company_id, id: created_by } = req.user; // From JWT

        if (!name || !start_date || !end_date || !total_amount || !distribution_model || !employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ error: "MISSING_POOL_FIELDS" });
        }

        // Basic validation for distribution_model
        const validModels = ['equal', 'hours', 'percentage'];
        if (!validModels.includes(distribution_model)) {
            return res.status(400).json({ error: "INVALID_DISTRIBUTION_MODEL" });
        }

        try {
            const newPool = await TipModel.createTipPool(name, start_date, end_date, total_amount, distribution_model, company_id, created_by);
            
            // Add employees to the newly created pool
            const poolEmployees = await TipModel.addEmployeesToPool(newPool.id, employees);

            res.status(201).json({ message: "Pool created successfully.", pool: newPool, employees: poolEmployees });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async updatePool(req, res) {
        const { poolId } = req.params;
        const { name, start_date, end_date, total_amount, distribution_model, employees } = req.body;
        const { company_id } = req.user;

        try {
            const existingPool = await TipModel.getTipPoolById(poolId);
            if (!existingPool || existingPool.company_id !== company_id) {
                return res.status(404).json({ error: "POOL_NOT_FOUND_OR_UNAUTHORIZED" });
            }

            const updates = {};
            if (name) updates.name = name;
            if (start_date) updates.start_date = start_date;
            if (end_date) updates.end_date = end_date;
            if (total_amount) updates.total_amount = total_amount;
            if (distribution_model) {
                const validModels = ['equal', 'hours', 'percentage'];
                if (!validModels.includes(distribution_model)) {
                    return res.status(400).json({ error: "INVALID_DISTRIBUTION_MODEL" });
                }
                updates.distribution_model = distribution_model;
            }

            const updatedPool = await TipModel.updateTipPool(poolId, updates);


            res.status(200).json({ message: "Pool updated successfully.", pool: updatedPool });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async calculateDistribution(req, res) {
        const { poolId } = req.params;
        const { company_id } = req.user; // From JWT

        try {
            const pool = await TipModel.getTipPoolById(poolId);
            if (!pool || pool.company_id !== company_id) {
                return res.status(404).json({ error: "POOL_NOT_FOUND_OR_UNAUTHORIZED" });
            }

            const employeesInPool = await TipModel.getPoolEmployees(poolId);
            if (employeesInPool.length === 0) {
                return res.status(400).json({ error: "NO_EMPLOYEES_IN_POOL" });
            }

            const totalAmount = parseFloat(pool.total_amount);
            const distributionModel = pool.distribution_model;
            const distributions = [];

            let totalHours = 0;
            let totalPercentage = 0;

            if (distributionModel === 'hours') {
                totalHours = employeesInPool.reduce((sum, emp) => sum + parseFloat(emp.hours_worked || 0), 0);
                if (totalHours === 0) {
                    return res.status(400).json({ error: "TOTAL_HOURS_ZERO" });
                }
            } else if (distributionModel === 'percentage') {
                totalPercentage = employeesInPool.reduce((sum, emp) => sum + parseFloat(emp.percentage_share || 0), 0);
                if (totalPercentage === 0) {
                    return res.status(400).json({ error: "TOTAL_PERCENTAGE_ZERO" });
                }
                if (totalPercentage !== 100) {
                    // Optional: enforce 100% or adjust proportionally
                    // For now, let's enforce 100% for simplicity
                    return res.status(400).json({ error: "TOTAL_PERCENTAGE_NOT_100" });
                }
            }

            for (const emp of employeesInPool) {
                let share = 0;
                if (distributionModel === 'equal') {
                    share = totalAmount / employeesInPool.length;
                } else if (distributionModel === 'hours') {
                    share = (parseFloat(emp.hours_worked) / totalHours) * totalAmount;
                } else if (distributionModel === 'percentage') {
                    share = (parseFloat(emp.percentage_share) / totalPercentage) * totalAmount;
                }
                distributions.push({
                    pool_employee_id: emp.id,
                    distributed_amount: share.toFixed(2) // Round to 2 decimal places
                });
            }

            // Validate total distributed amount (should not exceed total_amount)
            const sumDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.distributed_amount), 0);
            if (sumDistributed > totalAmount + 0.01) { // Allow for minor floating point inaccuracies
                console.warn(`Calculated sum (${sumDistributed}) exceeds total amount (${totalAmount}) for pool ${poolId}`);
                // Depending on policy, you might want to adjust or return an error
            }

            // Store distributions
            const storedDistributions = await TipModel.storeDistributions(distributions);

            // Send email notifications
            const transporter = req.app.get('transporter');
            const managerToken = req.headers.authorization.split(' ')[1]; // Get manager's token from request

            for (const dist of storedDistributions) {
                const poolEmployee = employeesInPool.find(emp => emp.id === dist.pool_employee_id);
                if (poolEmployee) {
                    const employeeUserId = poolEmployee.user_id;
                    const employeeEmail = await fetchEmployeeEmailFromAuthService(employeeUserId, managerToken);

                    const mailOptions = {
                        from: process.env.SMTP_FROM_EMAIL,
                        to: employeeEmail,
                        subject: `Vos pourboires pour le pool ${pool.name}`,
                        html: `<p>Bonjour,</p><p>Vos pourboires pour la période du ${pool.start_date.toISOString().split('T')[0]} au ${pool.end_date.toISOString().split('T')[0]} (${pool.name}) s'élèvent à : <strong>${dist.distributed_amount} $</strong>.</p><p>Cordialement,</p><p>Votre équipe de gestion des pourboires</p>`,
                    };

                    try {
                        await transporter.sendMail(mailOptions);
                        console.log(`Email sent to ${employeeEmail} for ${dist.distributed_amount}$`);
                    } catch (mailError) {
                        console.error(`Failed to send email to ${employeeEmail}:`, mailError);
                    }
                }
            }

            res.status(200).json({ message: "Distribution calculated and stored successfully.", distributions: storedDistributions });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async getPoolHistory(req, res) {
        const { company_id, id: managerId } = req.user; // From JWT

        try {
            const pools = await TipModel.getPoolHistory(company_id, managerId);
            res.status(200).json(pools);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async getEmployeeTipHistory(req, res) {
        const { employeeId } = req.params;
        const { id: authenticatedUserId, role } = req.user; // From JWT

        // An employee can only see their own tips
        // A manager can see any employee's tips within their company (not implemented yet)
        if (role === 'employee' && employeeId !== authenticatedUserId) {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }

        try {
            const history = await TipModel.getEmployeeTipHistory(employeeId);
            res.status(200).json(history);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async getPoolReport(req, res) {
        const { poolId } = req.params;
        const { company_id, role } = req.user; // From JWT

        try {
            const pool = await TipModel.getTipPoolById(poolId);
            if (!pool || pool.company_id !== company_id) {
                return res.status(404).json({ error: "POOL_NOT_FOUND_OR_UNAUTHORIZED" });
            }

            // Only managers can view full reports
            if (role !== 'manager') {
                return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
            }

            const reportData = await TipModel.getPoolReport(poolId);

            // Fetch user details for each employee in the report
            const managerToken = req.headers.authorization.split(' ')[1]; // Get manager's token from request
            const detailedReportData = await Promise.all(reportData.map(async (item) => {
                const userDetails = await fetchUserDetailsFromAuthService(item.user_id, managerToken);
                return {
                    ...item,
                    first_name: userDetails ? userDetails.first_name : 'Unknown',
                    last_name: userDetails ? userDetails.last_name : 'Unknown',
                    category_name: userDetails ? userDetails.category_name : 'N/A',
                };
            }));

            // Basic aggregation for the report
            const totalDistributed = detailedReportData.reduce((sum, item) => sum + parseFloat(item.distributed_amount || 0), 0);
            const employeeSummaries = {};

            detailedReportData.forEach(item => {
                if (!employeeSummaries[item.user_id]) {
                    employeeSummaries[item.user_id] = {
                        user_id: item.user_id,
                        total_tips: 0,
                        hours_worked: item.hours_worked,
                        percentage_share: item.percentage_share,
                        first_name: item.first_name, // Add to summary
                        last_name: item.last_name,   // Add to summary
                        category_name: item.category_name // Add to summary
                    };
                }
                employeeSummaries[item.user_id].total_tips += parseFloat(item.distributed_amount || 0);
            });

            res.status(200).json({
                pool_details: pool,
                total_distributed_amount: totalDistributed.toFixed(2),
                employee_summaries: Object.values(employeeSummaries),
                raw_report_data: detailedReportData // Use detailed report data
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async getPoolSummaryByMonth(req, res) {
        const { company_id, id: managerId } = req.user; // From JWT

        try {
            const summary = await TipModel.getPoolSummaryByMonth(company_id, managerId);
            res.status(200).json(summary);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },
};

module.exports = TipController;