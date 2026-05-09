import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync } from 'fastify';
import { forgotPasswordSchema, loginSchema, refreshTokenSchema, registerSchema } from '@garage-os/validation';
import { signJwt, verifyJwt } from '../lib/jwt.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

type AuthPayload = {
  sub: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
};

function createTokenPair(
  user: { id: string; email: string; role: string },
  secrets: { jwtSecret: string; refreshTokenSecret: string },
) {
  const accessToken = signJwt(
    { sub: user.id, email: user.email, role: user.role, tokenType: 'access' },
    secrets.jwtSecret,
    ACCESS_TOKEN_TTL_SECONDS,
  );
  const refreshToken = signJwt(
    { sub: user.id, email: user.email, role: user.role, tokenType: 'refresh' },
    secrets.refreshTokenSecret,
    REFRESH_TOKEN_TTL_SECONDS,
  );

  return { accessToken, refreshToken };
}

function publicUser(user: { id: string; name: string; email: string; phone: string | null; role: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid registration input');
    }

    const input = parsed.data;
    const existing = await app.deps.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return reply.conflict('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await app.deps.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        isActive: true,
        ...(input.role === 'customer'
          ? {
              customerProfile: {
                create: {
                  preferredContact: 'email',
                },
              },
            }
          : {}),
      },
    });

    const tokens = createTokenPair(user, app.deps);
    return reply.code(201).send({ user: publicUser(user), ...tokens });
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid login input');
    }

    const user = await app.deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return reply.notFound('User was not found');
    }

    const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!matches) {
      return reply.unauthorized('Invalid password');
    }

    const tokens = createTokenPair(user, app.deps);
    return { user: publicUser(user), ...tokens };
  });

  app.post('/refresh', async (request, reply) => {
    const parsed = refreshTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid refresh token input');
    }

    let payload: AuthPayload;
    try {
      payload = verifyJwt<AuthPayload>(parsed.data.refreshToken, app.deps.refreshTokenSecret);
    } catch {
      return reply.unauthorized('Refresh token is invalid or expired');
    }

    if (payload.tokenType !== 'refresh') {
      return reply.unauthorized('Refresh token is invalid or expired');
    }

    const user = await app.deps.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return reply.unauthorized('Refresh token is invalid or expired');
    }

    const tokens = createTokenPair(user, app.deps);
    return { user: publicUser(user), ...tokens };
  });

  app.post('/forgot-password', async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid forgot password input');
    }

    const user = await app.deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await app.deps.mailer.sendMail({
        to: user.email,
        from: process.env.MAIL_FROM ?? 'no-reply@garageos.local',
        subject: 'Reset your GarageOS password',
        text: `Use this reset token to reset your password: ${resetToken}`,
      });
    }

    return reply.code(202).send({
      message: 'If that email exists, a reset link has been sent.',
    });
  });
};
