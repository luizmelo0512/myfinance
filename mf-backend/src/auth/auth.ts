import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';
import { Pool } from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Verifique o arquivo .env!');
}
// Inicializa o banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: db,
  session: {
    expiresIn: 60 * 60 * 3, // 3 Horas
  },
  plugins: [openAPI()],
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || [],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.SECRET_KEY || '', // Mude isso para uma string segura em produção
  baseURL: process.env.BASE_URL,
  // Configuração para permitir cookies cross-site
  disableCSRFProtection: false,
});

export type Session = typeof auth.$Infer.Session;
