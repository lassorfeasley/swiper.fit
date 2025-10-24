// Toast replacement utility - logs to console instead of showing UI toasts
export const toast = {
  success: (message: string, options?: any) => {
    console.log(`✅ SUCCESS: ${message}`, options || '');
  },
  error: (message: string, options?: any) => {
    console.error(`❌ ERROR: ${message}`, options || '');
  },
  info: (message: string, options?: any) => {
    console.info(`ℹ️ INFO: ${message}`, options || '');
  },
  warning: (message: string, options?: any) => {
    console.warn(`⚠️ WARNING: ${message}`, options || '');
  },
  message: (message: string, options?: any) => {
    console.log(`📝 MESSAGE: ${message}`, options || '');
  }
};
