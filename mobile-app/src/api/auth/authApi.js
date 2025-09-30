import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://bttft2mmk7.us-east-1.awsapprunner.com/api/auth"; // Pour simulateur iOS. Pour émulateur Android, utilisez 'http://10.0.2.2:4000/api/auth'. Pour appareil physique, utilisez l'IP de votre machine (ex: 'http://10.0.0.230:4000/api/auth'). // Remplacez par l'adresse IP de votre machine si nécessaire

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        // Si le backend renvoie un code d'erreur (ex: "EMAIL_REQUIRED"), utilisez-le.
        // Sinon, utilisez un message d'erreur générique ou le message du backend.
        const errorMessage = data.error || 'INTERNAL_SERVER_ERROR';
        throw new Error(errorMessage);
    }
    return data;
};


export const signup = async (email, password, companyName, firstName, lastName) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, companyName, firstName, lastName }),
    });
    return handleResponse(response);
};

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

export const verifyOtp = async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
};

export const resendOtp = async (email) => {
    const response = await fetch(`${API_BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

export const forgotPassword = async (email) => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

export const resetPassword = async (email, otp, password) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
    });
    return handleResponse(response);
};

export const inviteEmployee = async (email, category_id) => {
    const token = await AsyncStorage.getItem('userToken');
    console.log("Sending invite with token:", token);
    const authHeader = `Bearer ${token}`;
    console.log("Sending invite with Authorization header:", authHeader);
    const response = await fetch(`${API_BASE_URL}/invite-employee`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
        },
        body: JSON.stringify({ email, category_id }),
    });
    return handleResponse(response);
};

export const setupPassword = async (token, password, firstName, lastName) => {
    const response = await fetch(`${API_BASE_URL}/setup-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, firstName, lastName }),
    });
    return handleResponse(response);
};

export const verifyInvitation = async (email, code) => {
    const response = await fetch(`${API_BASE_URL}/verify-invitation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
    });
    return handleResponse(response);
};

export const getCompanyEmployees = async (companyId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/employees`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const changePassword = async (currentPassword, newPassword) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
};

export const updateProfile = async (firstName, lastName) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName }),
    });
    return handleResponse(response);
};

// Category API functions
export const createCategory = async (name, description, effects_supplements) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, effects_supplements }),
    });
    return handleResponse(response);
};

export const getCompanyCategories = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const getCategoryById = async (categoryId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const updateCategory = async (categoryId, name, description, effects_supplements) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, effects_supplements }),
    });
    return handleResponse(response);
};

export const deleteCategory = async (categoryId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const updateUserCategory = async (userId, categoryId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/users/${userId}/category`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ category_id: categoryId }),
    });
    return handleResponse(response);
};

export const unlinkEmployee = async (employeeId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};