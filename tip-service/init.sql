-- Create the tip_pools table
CREATE TABLE tip_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    distribution_model VARCHAR(50) NOT NULL CHECK (distribution_model IN ('equal', 'hours', 'percentage')),
    company_id UUID NOT NULL, -- FK to auth-service's companies table
    created_by UUID NOT NULL, -- FK to auth-service's users table (manager)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the pool_employees table
CREATE TABLE pool_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES tip_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- FK to auth-service's users table (employee)
    hours_worked DECIMAL(5, 2), -- Nullable, used if distribution_model is 'hours'
    percentage_share DECIMAL(5, 2), -- Nullable, used if distribution_model is 'percentage'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pool_id, user_id) -- An employee can only be in a pool once
);

-- Create the tip_distributions table
CREATE TABLE tip_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_employee_id UUID NOT NULL REFERENCES pool_employees(id) ON DELETE CASCADE,
    distributed_amount DECIMAL(10, 2) NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
