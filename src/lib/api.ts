import {
  CustomerInput,
  PredictionResult,
  BatchPredictionResponse,
  ModelMetrics,
  RecentAssessmentItem,
} from './types';

// In Next.js client, default relative API endpoint /api, or fallback port 8000 when running dev
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'API request failed' }));
      throw new Error(err.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    // Only try direct port 8000 fallback in explicit local development mode
    if (process.env.NODE_ENV === 'development' && !BASE_URL && typeof window !== 'undefined' && error.message.includes('fetch')) {
      const fallbackUrl = `http://localhost:8000${endpoint}`;
      const res = await fetch(fallbackUrl, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
      });
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
    }
    throw error;
  }
}

export const api = {
  async getHealth() {
    return fetchJSON<{ status: string; champion_model: string; model_loaded: boolean }>('/api/health');
  },

  async getModelInfo(): Promise<ModelMetrics> {
    return fetchJSON<ModelMetrics>('/api/model-info');
  },

  async predict(input: CustomerInput): Promise<PredictionResult> {
    return fetchJSON<PredictionResult>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async predictBatchJSON(inputs: CustomerInput[]): Promise<BatchPredictionResponse> {
    return fetchJSON<BatchPredictionResponse>('/api/predict-batch', {
      method: 'POST',
      body: JSON.stringify(inputs),
    });
  },

  async predictBatchCSV(file: File): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${BASE_URL}/api/predict-batch`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Batch prediction failed' }));
      throw new Error(err.detail || 'Batch prediction failed');
    }
    return await res.json();
  },

  async testDataSource(config: { source_type: string; host?: string; database?: string; bucket?: string }) {
    return fetchJSON<{ success: boolean; message: string; latency_ms?: number }>('/api/data-source/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async previewData(config: { source_type: string; table_name?: string; bucket?: string }) {
    return fetchJSON<any>('/api/data/preview', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async validateData(source_type: string, column_mapping: Record<string, string>, records: any[]) {
    return fetchJSON<any>('/api/data/validate', {
      method: 'POST',
      body: JSON.stringify({ source_type, column_mapping, records }),
    });
  },

  async mergeData(primary: any[], secondary: any[], join_key = 'customer_id') {
    return fetchJSON<any>('/api/data/merge', {
      method: 'POST',
      body: JSON.stringify({ primary_dataset: primary, secondary_dataset: secondary, join_key }),
    });
  },

  async getRecentAssessments(): Promise<RecentAssessmentItem[]> {
    return fetchJSON<RecentAssessmentItem[]>('/api/results');
  },

  async getSampleCustomers(query?: string, limit = 25, offset = 0): Promise<{ customers: any[]; total?: number; limit?: number; offset?: number }> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    return fetchJSON<{ customers: any[]; total?: number; limit?: number; offset?: number }>(`/api/customers?${params.toString()}`);
  }
};
