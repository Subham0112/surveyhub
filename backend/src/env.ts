import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  adminEmail: (process.env.ADMIN_EMAIL ?? 'admin@surveybuilder.local').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin12345',
  adminName: process.env.ADMIN_NAME ?? 'Workspace Admin',
};
