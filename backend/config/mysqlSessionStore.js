import session from 'express-session';
import mysql from 'mysql2/promise';

class MySQLSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.pool = mysql.createPool({
      host: options.host,
      port: Number(options.port || 3306),
      user: options.user,
      password: options.password,
      database: options.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    this.ready = this.initialize();
  }

  async initialize() {
    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL PRIMARY KEY,
        expires_at DATETIME NOT NULL,
        data JSON NOT NULL,
        INDEX idx_sessions_expires_at (expires_at)
      ) ENGINE=InnoDB
    `);
    await this.pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
  }

  get(sid, callback) {
    this.ready
      .then(() => this.pool.execute(
        'SELECT data FROM sessions WHERE session_id = ? AND expires_at > NOW()',
        [sid],
      ))
      .then(([rows]) => {
        if (!rows.length) return callback(null, null);
        const value = typeof rows[0].data === 'string'
          ? JSON.parse(rows[0].data)
          : rows[0].data;
        callback(null, value);
      })
      .catch(callback);
  }

  set(sid, sessionData, callback = () => {}) {
    const expires = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    this.ready
      .then(() => this.pool.execute(
        `INSERT INTO sessions (session_id, expires_at, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at), data = VALUES(data)`,
        [sid, expires, JSON.stringify(sessionData)],
      ))
      .then(() => callback(null))
      .catch(callback);
  }

  destroy(sid, callback = () => {}) {
    this.ready
      .then(() => this.pool.execute('DELETE FROM sessions WHERE session_id = ?', [sid]))
      .then(() => callback(null))
      .catch(callback);
  }

  touch(sid, sessionData, callback = () => {}) {
    const expires = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    this.ready
      .then(() => this.pool.execute(
        'UPDATE sessions SET expires_at = ? WHERE session_id = ?',
        [expires, sid],
      ))
      .then(() => callback(null))
      .catch(callback);
  }
}

export default MySQLSessionStore;
