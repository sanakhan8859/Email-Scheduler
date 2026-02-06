import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../config/database';
import { User } from '../types';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || '';
        const avatar = profile.photos?.[0]?.value || '';

        // Check if user exists
        const existingUsers = await query(
          'SELECT * FROM users WHERE google_id = ?',
          [googleId]
        ) as User[];

        if (existingUsers.length > 0) {
          // User exists, update their info
          await query(
            'UPDATE users SET email = ?, name = ?, avatar = ? WHERE google_id = ?',
            [email, name, avatar, googleId]
          );
          return done(null, existingUsers[0]);
        } else {
          // Create new user
          const result: any = await query(
            'INSERT INTO users (google_id, email, name, avatar) VALUES (?, ?, ?, ?)',
            [googleId, email, name, avatar]
          );

          const newUser: User = {
            id: result.insertId,
            google_id: googleId,
            email,
            name,
            avatar,
            created_at: new Date(),
            updated_at: new Date(),
          };

          return done(null, newUser);
        }
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [id]) as User[];
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
