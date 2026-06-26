import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
const token = localStorage.getItem('business_nexus_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Users API
export const usersApi = {
  // Get all users with optional filters
  getAll: async (filters?: { role?: 'entrepreneur' | 'investor'; industry?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.location) params.append('location', filters.location);

    const response = await axios.get(`${API_URL}/users?${params.toString()}`);
    return response.data;
  },

  // Get user by ID
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  },

  // Update own profile
  updateProfile: async (updates: any) => {
    const response = await axios.put(`${API_URL}/users/profile`, updates);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/auth/me`);
    return response.data;
  }
};

// Messages API
export const messagesApi = {
  // Get conversation with specific user
  getConversation: async (userId: string) => {
    const response = await axios.get(`${API_URL}/messages/${userId}`);
    return response.data;
  },

  // Send a message
  send: async (receiverId: string, content: string) => {
    const response = await axios.post(`${API_URL}/messages`, { receiverId, content });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (userId: string) => {
    const response = await axios.put(`${API_URL}/messages/read/${userId}`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/messages/unread/count`);
    return response.data;
  }
};

// Meetings API
export const meetingsApi = {
  // Get all meetings
  getAll: async () => {
    const response = await axios.get(`${API_URL}/meetings`);
    return response.data;
  },

  // Create meeting
  create: async (meetingData: {
    guestId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
  }) => {
    const response = await axios.post(`${API_URL}/meetings`, meetingData);
    return response.data;
  },

  // Get meeting by ID
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/meetings/${id}`);
    return response.data;
  },

  // Update meeting
  update: async (id: string, updates: any) => {
    const response = await axios.put(`${API_URL}/meetings/${id}`, updates);
    return response.data;
  },

  // Delete meeting
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/meetings/${id}`);
    return response.data;
  }
};

// Documents API
export const documentsApi = {
  // Upload document
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all documents
  getAll: async (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(`${API_URL}/documents?${params.toString()}`);
    return response.data;
  },

  // Get document by ID
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/documents/${id}`);
    return response.data;
  },

  // Download document
  download: async (id: string, filename: string) => {
    const response = await axios.get(`${API_URL}/documents/${id}/download`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Update document
  update: async (id: string, updates: any) => {
    const response = await axios.put(`${API_URL}/documents/${id}`, updates);
    return response.data;
  },

  // Delete document
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/documents/${id}`);
    return response.data;
  },

  // Sign document (upload signature image)
  sign: async (id: string, signatureFile: File) => {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await axios.post(`${API_URL}/documents/${id}/sign`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Payments API
export const paymentsApi = {
  // Deposit funds
  deposit: async (amount: number, paymentMethod?: string, description?: string) => {
    const response = await axios.post(`${API_URL}/payments/deposit`, {
      amount,
      paymentMethod,
      description,
    });
    return response.data;
  },

  // Withdraw funds
  withdraw: async (amount: number, paymentMethod?: string, description?: string) => {
    const response = await axios.post(`${API_URL}/payments/withdraw`, {
      amount,
      paymentMethod,
      description,
    });
    return response.data;
  },

  // Transfer funds to another user
  transfer: async (amount: number, receiverId: string, description?: string) => {
    const response = await axios.post(`${API_URL}/payments/transfer`, {
      amount,
      receiverId,
      description,
    });
    return response.data;
  },

  // Get transaction history
  getHistory: async (filters?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await axios.get(`${API_URL}/payments/history?${params.toString()}`);
    return response.data;
  },

  // Get wallet balance
  getBalance: async () => {
    const response = await axios.get(`${API_URL}/payments/balance`);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  // Get entrepreneur dashboard statistics
  getEntrepreneurStats: async () => {
    const response = await axios.get(`${API_URL}/dashboard/entrepreneur`);
    return response.data;
  },

  // Get investor dashboard statistics
  getInvestorStats: async () => {
    const response = await axios.get(`${API_URL}/dashboard/investor`);
    return response.data;
  },
};

// Collaboration Requests API
export const collaborationApi = {
  // Get all collaboration requests for current user
  getAll: async () => {
    const response = await axios.get(`${API_URL}/collaborations`);
    return response.data;
  },

  // Create a collaboration request (investor to entrepreneur)
  create: async (entrepreneurId: string, message: string) => {
    const response = await axios.post(`${API_URL}/collaborations`, {
      entrepreneurId,
      message,
    });
    return response.data;
  },

  // Get collaboration request by ID
  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/collaborations/${id}`);
    return response.data;
  },

  // Update collaboration request status (accept/reject)
  updateStatus: async (id: string, status: 'accepted' | 'rejected') => {
    const response = await axios.put(`${API_URL}/collaborations/${id}`, { status });
    return response.data;
  },

  // Delete collaboration request
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/collaborations/${id}`);
    return response.data;
  },
};

export default {
  users: usersApi,
  messages: messagesApi,
  meetings: meetingsApi,
  documents: documentsApi,
  payments: paymentsApi,
  dashboard: dashboardApi,
  collaborations: collaborationApi,
};
