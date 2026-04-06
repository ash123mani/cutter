import passport from 'passport';
import { ObjectId } from 'mongodb';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from './db.js';

export function setupAuth() {
  // ── Serialize — what to store in the session cookie ──
  passport.serializeUser((user: any, done) => {
    done(null, user._id.toString());
  });

  // ── Deserialize — load user from DB on every request ──
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
      console.log('deserializeUser', user);
      if (!user) {
        console.log('Deserialization failed: No user found for ID', id);
        return done(null, false);
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // ── GitHub Strategy ──
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/auth/github/callback',
    },
    // @ts-ignore
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const users = db.collection('users');

        // Find existing user
        let user = await users.findOne({ githubId: profile.id });

        if (!user) {
          // Create new user on first login
          const result = await users.insertOne({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value ?? '',
            avatar: profile.photos?.[0]?.value ?? '',
            createdAt: new Date(),
          });

          user = await users.findOne({ _id: result.insertedId });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ));

  return passport;
}
