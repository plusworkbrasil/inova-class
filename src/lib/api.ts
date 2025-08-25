// API base URL - Configuração para produção
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://seudominio.com.br/api'  // ⚠️ Altere para seu domínio real
  : 'http://localhost/escola-app/api'; // Desenvolvimento local

// Classe para gerenciar chamadas da API
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.request('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async register(name: string, email: string, password: string, role: string = 'student') {
    const data = await this.request('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  logout() {
    this.removeToken();
  }

  // CRUD endpoints
  async get(table: string, id?: string) {
    const endpoint = id ? `/crud/${table}.php?id=${id}` : `/crud/${table}.php`;
    return this.request(endpoint);
  }

  async create(table: string, data: any) {
    return this.request(`/crud/${table}.php`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(table: string, id: string, data: any) {
    return this.request(`/crud/${table}.php`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  }

  async delete(table: string, id: string) {
    return this.request(`/crud/${table}.php`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);