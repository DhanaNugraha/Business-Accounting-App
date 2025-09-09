import { invoke } from '@tauri-apps/api/core';

const DB_PATH = 'sqlite:app.db'; // This will create app.db in the default Tauri data dir

export const db = {
  async execute(sql: string, params?: any[]) {
    // For SELECT, use 'select', for INSERT/UPDATE/DELETE, use 'execute'
    const isSelect = /^\s*select/i.test(sql);
    if (isSelect) {
      return await invoke<any[]>('plugin:sql|select', {
        db: DB_PATH,
        sql,
        // params: params || []
      });
    } else {
      return await invoke<any>('plugin:sql|execute', {
        db: DB_PATH,
        sql,
        // params: params || []
      });
    }
  }
};

