import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from './env';
import { prisma } from '../lib/db/prisma';
import { authRepository } from '../modules/auth/auth.repository';
import type { UserRole } from '@credible/types';

/**
 * Passport wiring.
 * - JWT strategy: used by Passport middleware (we mostly use raw `jwt.verify` for control).
 * - Google / Facebook OAuth strategies.
 */

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.JWT_ACCESS_SECRET,
    },
    async (payload: { sub: string; email: string; role: UserRole }, done) => {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status === 'DELETED') return done(null, false);
      return done(null, user);
    },
  ),
);

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL ?? `${env.API_URL}${env.API_PREFIX}/auth/google/callback`,
      } as ConstructorParameters<typeof GoogleStrategy>[0],
      async (
        _access: string,
        _refresh: string,
        profile: { id?: string; emails?: { value: string }[]; name?: { givenName?: string; familyName?: string }; photos?: { value: string }[] },
        done: (err: Error | null, user?: unknown) => void,
      ) => {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google account has no email'));
        const providerUserId = profile.id ?? '';
        const existing = await prisma.user.findUnique({ where: { email } });
        let user = existing;
        if (!user) {
          user = await authRepository.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            avatar: profile.photos?.[0]?.value,
            role: 'CUSTOMER',
            emailVerifiedAt: new Date(),
          });
        }
        await authRepository.upsertOAuthAccount({
          userId: user.id,
          provider: 'google',
          providerUserId,
        });
        return done(null, user);
      },
    ),
  );
}

if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
        callbackURL: env.FACEBOOK_CALLBACK_URL ?? `${env.API_URL}${env.API_PREFIX}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      },
      async (_access: string, _refresh: string, profile: { id?: string; emails?: { value: string }[]; name?: { givenName?: string; familyName?: string }; photos?: { value: string }[] }, done: (err: Error | null, user?: unknown) => void) => {
        const email = profile.emails?.[0]?.value ?? `${profile.id}@facebook.local`;
        const providerUserId = profile.id ?? '';
        const existing = await prisma.user.findUnique({ where: { email } });
        let user = existing;
        if (!user) {
          user = await authRepository.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            avatar: profile.photos?.[0]?.value,
            role: 'CUSTOMER',
          });
        }
        await authRepository.upsertOAuthAccount({
          userId: user.id,
          provider: 'facebook',
          providerUserId,
        });
        return done(null, user);
      },
    ),
  );
}

export default passport;