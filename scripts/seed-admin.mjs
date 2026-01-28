import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to seed admin user')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10)

  await pool.query(
    `
    INSERT INTO "Admin" (username, password, role, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (username) DO NOTHING
    `,
    ['admin', passwordHash, 'admin'],
  )

  console.log('✅ Admin user ready: username=admin, password=Admin@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })

