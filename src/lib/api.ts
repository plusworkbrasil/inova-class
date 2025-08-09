// Cliente API para substituir o Supabase
const API_BASE_URL = 'https://seudominio.com/api'; // Altere para seu domínio

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.error || error.message || 'Erro na requisição');
    }

    return response.json();
  }

  // Métodos de autenticação
  async login(email: string, password: string) {
    const response = await this.request('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }

    return response;
  }

  async register(email: string, password: string, name: string, role: string = 'student') {
    const response = await this.request('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  getStoredUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // CRUD genérico para tabelas
  async fetchTable(table: string, query?: string) {
    return this.request(`/endpoints/${table}.php${query ? `?${query}` : ''}`);
  }

  async createRecord(table: string, data: any) {
    return this.request(`/endpoints/${table}.php`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecord(table: string, id: string, data: any) {
    return this.request(`/endpoints/${table}.php`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, id }),
    });
  }

  async deleteRecord(table: string, id: string) {
    return this.request(`/endpoints/${table}.php`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Métodos específicos para cada tabela
  async getClasses() {
    return this.fetchTable('classes');
  }

  async getSubjects() {
    return this.fetchTable('subjects');
  }

  async getGrades() {
    return this.fetchTable('grades');
  }

  async getAttendance() {
    return this.fetchTable('attendance');
  }

  async getCommunications() {
    return this.fetchTable('communications');
  }

  async getDeclarations() {
    return this.fetchTable('declarations');
  }

  async getEvasions() {
    return this.fetchTable('evasions');
  }

  async getProfiles() {
    return this.fetchTable('profiles');
  }
}

export const apiClient = new ApiClient();