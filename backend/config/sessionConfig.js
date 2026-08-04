import session from 'express-session';
import MySQLSessionStore from './mysqlSessionStore.js';

const createSessionConfig = () => {
  const store = new MySQLSessionStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  return session({
    name: process.env.SESSION_COOKIE_NAME || 'ecommerce.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
};

export default createSessionConfig;
