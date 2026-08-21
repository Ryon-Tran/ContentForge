const configuredApiBase =
  import.meta.env.VITE_API_BASE;

export const API_BASE =
  (
    configuredApiBase?.trim() ||
    'http://127.0.0.1:8000'
  ).replace(
    /\/$/,
    ''
  );
