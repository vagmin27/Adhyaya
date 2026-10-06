import api from './api';

export const authService = {
  /**
   * Log in user with email/username and password
   * @param {{ email?: string, username?: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   * @param {FormData} formData
   */
  async register(formData) {
    const response = await api.post('/users/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Log out the current user
   */
  async logout() {
    const response = await api.post('/users/logout');
    return response.data;
  },

  /**
   * Get authenticated user profile details
   */
  async getCurrentUser() {
    const response = await api.get('/users/current-user');
    return response.data;
  },

  /**
   * Refresh accessToken using stored/cookie refreshToken
   * @param {string} [refreshToken]
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/users/refresh-token', { refreshToken });
    return response.data;
  },

  /**
   * Change current user's password
   * @param {{ oldPassword: string, newPassword: string }} passwords
   */
  async changePassword(passwords) {
    const response = await api.post('/users/change-password', passwords);
    return response.data;
  },

  /**
   * Update basic account details (fullName, email)
   * @param {{ fullName: string, email: string }} details
   */
  async updateAccountDetails(details) {
    const response = await api.patch('/users/update-account', details);
    return response.data;
  },

  /**
   * Update user avatar
   * @param {FormData} avatarFormData
   */
  async updateAvatar(avatarFormData) {
    const response = await api.patch('/users/avatar', avatarFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update user cover image
   * @param {FormData} coverImageFormData
   */
  async updateCoverImage(coverImageFormData) {
    const response = await api.patch('/users/cover-image', coverImageFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default authService;
