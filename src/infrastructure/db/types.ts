// Infrastructure types for data access layer

// Database interface (infrastructure dependency)
export interface Database {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
  getClient(): Promise<any>;
  end(): Promise<void>;
}
