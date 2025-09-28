import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://10.0.0.230:4001/api/tips"; // Use localhost for iOS simulator to access host machine

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.error || 'INTERNAL_SERVER_ERROR';
        throw new Error(errorMessage);
    }
    return data;
};

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export const createPool = async (poolData) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/pools`, {
        method: 'POST',
        headers,
        body: JSON.stringify(poolData),
    });
    return handleResponse(response);
};

export const updatePool = async (poolId, updates) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/pools/${poolId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
    });
    return handleResponse(response);
};

export const calculateDistribution = async (poolId) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/pools/${poolId}/calculate-distribution`, {
        method: 'POST',
        headers,
    });
    return handleResponse(response);
};

export const getPoolHistory = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/pools/history`, {
        method: 'GET',
        headers,
    });
    return handleResponse(response);
};

export const getEmployeeTipHistory = async (employeeId) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/tips`, {
        method: 'GET',
        headers,
    });
    return handleResponse(response);
};

export const getPoolReport = async (poolId) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/pools/${poolId}/report`, {
        method: 'GET',
        headers,
    });
    return handleResponse(response);
};

export const getPoolSummaryByMonth = async (year, month) => {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/pools/summary-by-month?year=${year}`;
    if (month) {
        url += `&month=${month}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers,
    });
    return handleResponse(response);
};
