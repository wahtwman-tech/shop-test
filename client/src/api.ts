const API_URL = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
    throw new Error(error.message || 'حدث خطأ');
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    request<{ message: string; userId: number }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    }),

  verify: (token: string) =>
    request<{ message: string }>('/auth/verify', {
      method: 'POST',
      body: { token },
    }),

  login: (email: string, password: string) =>
    request<{ message: string; user: { id: number; email: string; isAdmin: boolean } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ user: { id: number; email: string; isAdmin: boolean; isVerified: boolean } }>('/auth/me'),
};

// Products API
export const productsApi = {
  getAll: () =>
    request<{ products: Product[] }>('/products'),

  getOne: (id: number) =>
    request<{ product: Product }>(`/products/${id}`),
};

// Cart API
export const cartApi = {
  get: () =>
    request<{ items: CartItem[]; total: number }>('/cart'),

  add: (productId: number, quantity: number = 1) =>
    request<{ item: CartItem }>('/cart', {
      method: 'POST',
      body: { productId, quantity },
    }),

  update: (id: number, quantity: number) =>
    request<{ item: CartItem }>(`/cart/${id}`, {
      method: 'PUT',
      body: { quantity },
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/cart/${id}`, { method: 'DELETE' }),
};

// Orders API
export const ordersApi = {
  create: () =>
    request<{ message: string; order: Order }>('/orders', { method: 'POST' }),

  getAll: () =>
    request<{ orders: Order[] }>('/orders'),

  getOne: (id: number) =>
    request<{ order: Order }>(`/orders/${id}`),
};

// Admin API
export const adminApi = {
  getOrders: () =>
    request<{ orders: AdminOrder[] }>('/admin/orders'),

  updateOrderStatus: (id: number, status: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
};

// Types
export interface Product {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price: string;
  stock: number;
  image_url?: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product: Product;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'delivered' | 'rejected';
  totalPrice: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  product?: Product;
}

export interface AdminOrder extends Order {
  user: { id: number; email: string };
  items: (OrderItem & { product: Product })[];
}
