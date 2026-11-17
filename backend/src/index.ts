import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env';
import { prisma } from './prisma';
import authRouter from './routes/auth.routes';
import surveysRouter from './routes/survey.routes';
import userRouter from './routes/user.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

const allowedOrigins = env.clientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api/user', userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`Survey Builder API listening on http://localhost:${env.port}`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Closing server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
