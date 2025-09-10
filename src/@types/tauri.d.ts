// Type definitions for @tauri-apps/api

declare module '@tauri-apps/api/tauri' {
  export function invoke<T>(cmd: string, args?: unknown): Promise<T>;
  export * from '@tauri-apps/api/tauri';
}
