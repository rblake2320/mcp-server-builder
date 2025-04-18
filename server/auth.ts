import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./db-storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { User } from "@shared/schema";
import { getOAuthCallbackUrl } from './utils/urlUtils';

// Extend passport interfaces to add callbackURL property
declare module 'passport' {
  interface AuthenticateOptions {
    callbackURL?: string;
  }
}

// Define the actual user structure for Express
declare global {
  namespace Express {
    // Define the User interface explicitly instead of extending
    interface User {
      id: number;
      username: string;
      createdAt: Date;
    }
    
    // Add custom properties to Request interface
    interface Request {
      callbackURL?: string;
      callbackURLSet?: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    // Generate a random session secret if not provided
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    console.log("Warning: SESSION_SECRET not set. Generated a random one for this session.");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // We need a fixed callback URL that matches what's registered in GitHub
  // This will be set to: https://workspace.rblake2320.repl.co/auth/github/callback
  const GITHUB_CALLBACK_URL = "https://workspace.rblake2320.repl.co/auth/github/callback";
  
  // Add middleware to track the original URL for login redirects
  app.use((req, res, next) => {
    // Only set this once per request
    if (!req.callbackURLSet) {
      // Get protocol from headers or default to https
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      // Get host from headers
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      
      // Set the callback URL for this request (this is just for logging)
      req.callbackURL = `${protocol}://${host}/auth/github/callback`;
      req.callbackURLSet = true;
      
      console.log("Detected request URL:", req.callbackURL);
      console.log("Using fixed callback URL:", GITHUB_CALLBACK_URL);
    }
    next();
  });
  
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log("Initializing GitHub authentication strategy");
    console.log("For GitHub OAuth settings, use your Replit domain with /auth/github/callback path");
    
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: GITHUB_CALLBACK_URL, // Use the constant to ensure consistency
          passReqToCallback: true,
          scope: ['user:email', 'repo'],
          userAgent: 'MCP-Server-Builder'
        },
        async (req: Request, accessToken: string, refreshToken: string, profile: GitHubProfile, done: (error: any, user?: any) => void) => {
          try {
            console.log("GitHub auth - Processing profile");
            console.log("GitHub auth - Dynamic callback URL: ", req.callbackURL);
            
            // Look for a user with the GitHub ID 
            const githubId = profile.id;
            const githubUsername = profile.username || `github_${profile.id}`;
            
            // First try to find by GitHub ID
            const result = await db.execute(sql`
              SELECT * FROM users WHERE github_id = ${githubId}
            `);
            
            // Use type assertion to handle the query result
            const users = (result as any).rows as any[];
            let user = users.length > 0 ? users[0] : null;
            
            if (!user) {
              // Then try to find by username
              user = await storage.getUserByUsername(githubUsername);
            }
            
            if (user) {
              // Update existing user with GitHub info
              await db.execute(sql`
                UPDATE users 
                SET github_id = ${githubId}, 
                    github_username = ${githubUsername}, 
                    github_token = ${accessToken}
                WHERE id = ${user.id}
              `);
              
              // Refresh user data
              const updatedResult = await db.execute(sql`
                SELECT * FROM users WHERE id = ${user.id}
              `);
              
              // Use type assertion to handle the query result
              const updatedUsers = (updatedResult as any).rows as any[];
              if (updatedUsers.length > 0) {
                user = updatedUsers[0];
              }
            } else {
              // If no user exists, create a new one with the GitHub username
              // Generate a random password since GitHub auth won't use it
              const randomPassword = randomBytes(32).toString('hex');
              user = await storage.createUser({
                username: githubUsername,
                password: await hashPassword(randomPassword),
              });
              
              // Add GitHub details
              await db.execute(sql`
                UPDATE users 
                SET github_id = ${githubId}, 
                    github_username = ${githubUsername}, 
                    github_token = ${accessToken}
                WHERE id = ${user.id}
              `);
              
              // Refresh user data
              const createdResult = await db.execute(sql`
                SELECT * FROM users WHERE id = ${user.id}
              `);
              
              // Use type assertion to handle the query result
              const createdUsers = (createdResult as any).rows as any[];
              if (createdUsers.length > 0) {
                user = createdUsers[0];
              }
            }
            
            return done(null, user);
          } catch (error) {
            console.error("GitHub auth error:", error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn("GitHub authentication is disabled - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
  }

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Return user info without password
        const { password, ...userInfo } = user;
        res.status(201).json(userInfo);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid username or password" });
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        // Return user info without password
        const { password, ...userInfo } = user;
        res.status(200).json(userInfo);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    // Return user info without password
    const { password, ...userInfo } = req.user as User;
    res.json(userInfo);
  });
  
  // GitHub auth routes
  app.get("/auth/github", (req: Request, res: Response, next: NextFunction) => {
    console.log("Starting GitHub authentication...");
    console.log("Full request URL:", req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    
    // Just use the fixed callback URL and scope
    passport.authenticate("github", { 
      scope: ["user:email", "repo"] 
    })(req, res, next);
  });
  
  // Manual GitHub token login route - as a fallback for testing
  app.post("/api/github-token-login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "GitHub token is required" });
      }
      
      console.log("Manual GitHub token login attempt");
      
      // Make a request to GitHub API to get user profile
      const githubRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'MCP-Server-Builder'
        }
      });
      
      if (!githubRes.ok) {
        const errorData = await githubRes.text();
        console.error("GitHub API error:", githubRes.status, errorData);
        return res.status(401).json({ error: "Invalid GitHub token" });
      }
      
      const profile = await githubRes.json();
      
      // Process like GitHub strategy would
      const githubId = profile.id.toString();
      const githubUsername = profile.login || `github_${profile.id}`;
      
      // First try to find by GitHub ID
      const result = await db.execute(sql`
        SELECT * FROM users WHERE github_id = ${githubId}
      `);
      
      // Use type assertion to handle the query result
      const users = (result as any).rows as any[];
      let user = users.length > 0 ? users[0] : null;
      
      if (!user) {
        // Then try to find by username
        user = await storage.getUserByUsername(githubUsername);
      }
      
      if (user) {
        // Update existing user with GitHub info
        await db.execute(sql`
          UPDATE users 
          SET github_id = ${githubId}, 
              github_username = ${githubUsername}, 
              github_token = ${token}
          WHERE id = ${user.id}
        `);
        
        // Refresh user data
        const updatedResult = await db.execute(sql`
          SELECT * FROM users WHERE id = ${user.id}
        `);
        
        // Use type assertion to handle the query result
        const updatedUsers = (updatedResult as any).rows as any[];
        if (updatedUsers.length > 0) {
          user = updatedUsers[0];
        }
      } else {
        // If no user exists, create a new one with the GitHub username
        // Generate a random password since GitHub auth won't use it
        const randomPassword = randomBytes(32).toString('hex');
        user = await storage.createUser({
          username: githubUsername,
          password: await hashPassword(randomPassword),
        });
        
        // Add GitHub details
        await db.execute(sql`
          UPDATE users 
          SET github_id = ${githubId}, 
              github_username = ${githubUsername}, 
              github_token = ${token}
          WHERE id = ${user.id}
        `);
        
        // Refresh user data
        const createdResult = await db.execute(sql`
          SELECT * FROM users WHERE id = ${user.id}
        `);
        
        // Use type assertion to handle the query result
        const createdUsers = (createdResult as any).rows as any[];
        if (createdUsers.length > 0) {
          user = createdUsers[0];
        }
      }
      
      // Log in the user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error after manual GitHub auth:", loginErr);
          return res.status(500).json({ error: "Login failed after token verification" });
        }
        
        console.log("Manual GitHub authentication successful");
        // Return user info without password
        const { password, ...userInfo } = user;
        return res.status(200).json(userInfo);
      });
    } catch (error: any) {
      console.error("Manual GitHub auth error:", error);
      res.status(500).json({ error: "Authentication failed", message: error.message });
    }
  });
  
  app.get(
    "/auth/github/callback",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("GitHub callback received");
      console.log("Callback URL:", req.protocol + '://' + req.get('host') + req.originalUrl);
      console.log("Query params:", req.query);
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      
      // Use try-catch to handle potential errors
      try {
        passport.authenticate("github", { 
          failureRedirect: "/auth?error=github_auth_failed"
        }, (err: any, user: any, info: any) => {
          if (err) {
            console.error("GitHub auth error:", err);
            return res.redirect(`/auth?error=github_error&message=${encodeURIComponent(err.message)}`);
          }
          
          if (!user) {
            console.error("GitHub auth failed:", info);
            return res.redirect("/auth?error=github_auth_failed");
          }
          
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error("Login error after GitHub auth:", loginErr);
              return res.redirect(`/auth?error=login_failed&message=${encodeURIComponent(loginErr.message)}`);
            }
            
            console.log("GitHub authentication successful");
            return res.redirect("/");
          });
        })(req, res, next);
      } catch (error: any) {
        console.error("Unexpected GitHub auth error:", error);
        res.redirect(`/auth?error=unexpected&message=${encodeURIComponent(error.message || "Unknown error")}`);
      }
    }
  );
  
  // Add middleware to protect routes
  app.use('/api/my-servers', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  });
}