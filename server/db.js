const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASS     || '',
  database:         process.env.DB_NAME     || 'lunarae_db',
  port:             parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '+00:00',
})

pool.getConnection()
  .then(conn => { conn.release(); console.log('✓ MySQL connected') })
  .catch(err  => console.warn('⚠ MySQL not connected — auth will fail:', err.message))

module.exports = pool
