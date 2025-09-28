const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const TipModel = {
    async createTipPool(name, start_date, end_date, total_amount, distribution_model, company_id, created_by) {
        const result = await pool.query(
            "INSERT INTO tip_pools (name, start_date, end_date, total_amount, distribution_model, company_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, start_date, end_date, total_amount, distribution_model, company_id, created_by]
        );
        return result.rows[0];
    },

    async addEmployeesToPool(poolId, employees) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const insertedEmployees = [];
            for (const emp of employees) {
                const { user_id, hours_worked, percentage_share } = emp;
                const result = await client.query(
                    "INSERT INTO pool_employees (pool_id, user_id, hours_worked, percentage_share) VALUES ($1, $2, $3, $4) RETURNING *",
                    [poolId, user_id, hours_worked, percentage_share]
                );
                insertedEmployees.push(result.rows[0]);
            }
            await client.query('COMMIT');
            return insertedEmployees;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async updateTipPool(poolId, updates) {
        const setClauses = [];
        const values = [];
        let i = 1;

        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                setClauses.push(`${key} = ${i}`);
                values.push(updates[key]);
                i++;
            }
        }

        if (setClauses.length === 0) {
            return null; // No updates provided
        }

        values.push(poolId); // Add poolId for WHERE clause
        const query = `UPDATE tip_pools SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getTipPoolById(poolId) {
        const result = await pool.query("SELECT * FROM tip_pools WHERE id = $1", [poolId]);
        return result.rows[0];
    },

    async getPoolEmployees(poolId) {
        const result = await pool.query("SELECT * FROM pool_employees WHERE pool_id = $1", [poolId]);
        return result.rows;
    },

    async storeDistributions(distributions) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const stored = [];
            for (const dist of distributions) {
                const { pool_employee_id, distributed_amount } = dist;
                const result = await client.query(
                    "INSERT INTO tip_distributions (pool_employee_id, distributed_amount) VALUES ($1, $2) RETURNING *",
                    [pool_employee_id, distributed_amount]
                );
                stored.push(result.rows[0]);
            }
            await client.query('COMMIT');
            return stored;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getPoolHistory(companyId, managerId) {
        const result = await pool.query(
            `SELECT
                tp.id,
                tp.name,
                tp.start_date,
                tp.end_date,
                tp.total_amount,
                tp.distribution_model,
                tp.company_id,
                tp.created_by,
                tp.created_at,
                MAX(td.calculated_at) as calculated_at
            FROM
                tip_pools tp
            LEFT JOIN
                pool_employees pe ON tp.id = pe.pool_id
            LEFT JOIN
                tip_distributions td ON pe.id = td.pool_employee_id
            WHERE
                tp.company_id = $1 AND tp.created_by = $2
            GROUP BY
                tp.id
            ORDER BY
                tp.end_date DESC`,
            [companyId, managerId]
        );
        return result.rows;
    },

    async getEmployeeTipHistory(employeeId) {
        const result = await pool.query(
            `SELECT
                td.distributed_amount,
                td.calculated_at,
                tp.name AS pool_name,
                tp.start_date,
                tp.end_date
            FROM
                tip_distributions td
            JOIN
                pool_employees pe ON td.pool_employee_id = pe.id
            JOIN
                tip_pools tp ON pe.pool_id = tp.id
            WHERE
                pe.user_id = $1
            ORDER BY
                td.calculated_at DESC`,
            [employeeId]
        );
        return result.rows;
    },

    async getPoolReport(poolId) {
        const result = await pool.query(
            `SELECT
                tp.id AS pool_id,
                tp.name AS pool_name,
                tp.start_date,
                tp.end_date,
                tp.total_amount AS pool_total_amount,
                tp.distribution_model,
                pe.user_id,
                pe.hours_worked,
                pe.percentage_share,
                td.distributed_amount,
                td.calculated_at
            FROM
                tip_pools tp
            JOIN
                pool_employees pe ON tp.id = pe.pool_id
            LEFT JOIN
                tip_distributions td ON pe.id = td.pool_employee_id
            WHERE
                tp.id = $1
            ORDER BY
                pe.user_id, td.calculated_at DESC`,
            [poolId]
        );
        return result.rows;
    },

    async getPoolSummaryByMonth(companyId, managerId) {
        const result = await pool.query(
            `SELECT
                EXTRACT(YEAR FROM start_date) as year,
                EXTRACT(MONTH FROM start_date) as month,
                TO_CHAR(start_date, 'Mon YYYY') as month_year,
                COUNT(id) as pool_count,
                SUM(total_amount) as total_amount
            FROM
                tip_pools
            WHERE
                company_id = $1 AND created_by = $2
            GROUP BY
                EXTRACT(YEAR FROM start_date),
                EXTRACT(MONTH FROM start_date),
                TO_CHAR(start_date, 'Mon YYYY')
            ORDER BY
                year, month`,
            [companyId, managerId]
        );
        return result.rows;
    },
}

module.exports.TipModel = TipModel;
module.exports.pool = pool;
