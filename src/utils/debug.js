export const debugLog = (source, message, meta) => {
  if (import.meta.env.DEV) {
    console.debug(`[DEBUG] ${source}: ${message}`, meta || "");
  }
};

export const debugError = (source, message, error) => {
  if (import.meta.env.DEV) {
    console.error(`[ERROR] ${source}: ${message}`, error);
  }
};
