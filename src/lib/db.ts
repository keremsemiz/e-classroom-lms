import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

// Database client singleton
let dbClient: Client | null = null

/**
 * Get the database client
 * Creates a new client if one doesn't exist
 */
export function getDb(): Client {
  if (dbClient) {
    return dbClient
  }

  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  console.log('[getDb] Creating database client...')
  console.log('[getDb] DATABASE_URL:', databaseUrl ? `SET (${databaseUrl.length} chars)` : 'NOT SET')
  console.log('[getDb] DATABASE_AUTH_TOKEN:', authToken ? `SET (${authToken.length} chars)` : 'NOT SET')

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  if (!authToken) {
    throw new Error('DATABASE_AUTH_TOKEN environment variable is not set')
  }

  dbClient = createClient({
    url: databaseUrl,
    authToken: authToken,
  })

  return dbClient
}

// For backward compatibility with Prisma-based code
// This creates a Prisma-like interface using raw SQL
export const db = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const client = getDb()
      const field = args.where.id ? 'id' : 'email'
      const value = args.where.id || args.where.email
      const result = await client.execute({
        sql: `SELECT * FROM User WHERE ${field} = ?`,
        args: [value!]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async (args?: { where?: any; select?: any; orderBy?: any }) => {
      const client = getDb()
      let sql = 'SELECT * FROM User'
      const argsList: any[] = []

      if (args?.where) {
        const conditions = Object.entries(args.where)
          .filter(([_, v]) => v !== undefined)
          .map(([k, _]) => `${k} = ?`)

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
          Object.values(args.where).forEach(v => {
            if (v !== undefined) argsList.push(v)
          })
        }
      }

      const result = await client.execute({ sql, args: argsList })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO User (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    update: async (args: { where: { id?: string; email?: string }; data: any }) => {
      const client = getDb()
      const field = args.where.id ? 'id' : 'email'
      const value = args.where.id || args.where.email
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), value]

      await client.execute({
        sql: `UPDATE User SET ${setClauses} WHERE ${field} = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    },
    delete: async (args: { where: { id?: string; email?: string } }) => {
      const client = getDb()
      const field = args.where.id ? 'id' : 'email'
      const value = args.where.id || args.where.email

      await client.execute({
        sql: `DELETE FROM User WHERE ${field} = ?`,
        args: [value!]
      })
    }
  },

  class: {
    findUnique: async (args: { where: { id?: string; code?: string } }) => {
      const client = getDb()
      const field = args.where.id ? 'id' : 'code'
      const value = args.where.id || args.where.code
      const result = await client.execute({
        sql: `SELECT * FROM Class WHERE ${field} = ?`,
        args: [value!]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      const client = getDb()
      let sql = 'SELECT * FROM Class'
      const argsList: any[] = []

      if (args?.where) {
        const conditions = Object.entries(args.where)
          .filter(([_, v]) => v !== undefined)
          .map(([k, _]) => `${k} = ?`)

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
          Object.values(args.where).forEach(v => {
            if (v !== undefined) argsList.push(v)
          })
        }
      }

      const result = await client.execute({ sql, args: argsList })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Class (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const client = getDb()
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), args.where.id]

      await client.execute({
        sql: `UPDATE Class SET ${setClauses} WHERE id = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    },
    delete: async (args: { where: { id: string } }) => {
      const client = getDb()
      await client.execute({
        sql: 'DELETE FROM Class WHERE id = ?',
        args: [args.where.id]
      })
    }
  },

  session: {
    findUnique: async (args: { where: { token: string } }) => {
      const client = getDb()
      const result = await client.execute({
        sql: 'SELECT * FROM Session WHERE token = ?',
        args: [args.where.token]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Session (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    delete: async (args: { where: { id?: string; token?: string } }) => {
      const client = getDb()
      if (args.where.token) {
        await client.execute({
          sql: 'DELETE FROM Session WHERE token = ?',
          args: [args.where.token]
        })
      } else if (args.where.id) {
        await client.execute({
          sql: 'DELETE FROM Session WHERE id = ?',
          args: [args.where.id]
        })
      }
    },
    deleteMany: async (args: { where: any }) => {
      const client = getDb()
      if (args.where.expiresAt) {
        await client.execute({
          sql: 'DELETE FROM Session WHERE expiresAt < ?',
          args: [args.where.expiresAt.lt]
        })
      }
    }
  },

  school: {
    findUnique: async (args: { where: { id?: string; code?: string } }) => {
      const client = getDb()
      const field = args.where.id ? 'id' : 'code'
      const value = args.where.id || args.where.code
      const result = await client.execute({
        sql: `SELECT * FROM School WHERE ${field} = ?`,
        args: [value!]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async () => {
      const client = getDb()
      const result = await client.execute('SELECT * FROM School')
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO School (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    }
  },

  enrollment: {
    findFirst: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Enrollment WHERE ${conditions.join(' AND ')} LIMIT 1`,
        args: values
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Enrollment WHERE ${conditions.join(' AND ')}`,
        args: values
      })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Enrollment (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    delete: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      await client.execute({
        sql: `DELETE FROM Enrollment WHERE ${conditions.join(' AND ')}`,
        args: values
      })
    }
  },

  assignment: {
    findUnique: async (args: { where: { id: string } }) => {
      const client = getDb()
      const result = await client.execute({
        sql: 'SELECT * FROM Assignment WHERE id = ?',
        args: [args.where.id]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      const client = getDb()
      let sql = 'SELECT * FROM Assignment'
      const argsList: any[] = []

      if (args?.where) {
        const conditions = Object.entries(args.where)
          .filter(([_, v]) => v !== undefined)
          .map(([k, _]) => `${k} = ?`)

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
          Object.values(args.where).forEach(v => {
            if (v !== undefined) argsList.push(v)
          })
        }
      }

      const result = await client.execute({ sql, args: argsList })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Assignment (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const client = getDb()
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), args.where.id]

      await client.execute({
        sql: `UPDATE Assignment SET ${setClauses} WHERE id = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    },
    delete: async (args: { where: { id: string } }) => {
      const client = getDb()
      await client.execute({
        sql: 'DELETE FROM Assignment WHERE id = ?',
        args: [args.where.id]
      })
    }
  },

  notification: {
    findMany: async (args: { where: any; orderBy?: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Notification WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC`,
        args: values
      })
      return result.rows
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const client = getDb()
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), args.where.id]

      await client.execute({
        sql: `UPDATE Notification SET ${setClauses} WHERE id = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    }
  },

  message: {
    findMany: async (args: { where: any; orderBy?: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Message WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC`,
        args: values
      })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Message (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const client = getDb()
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), args.where.id]

      await client.execute({
        sql: `UPDATE Message SET ${setClauses} WHERE id = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    }
  },

  announcement: {
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      const client = getDb()
      let sql = 'SELECT * FROM Announcement'
      const argsList: any[] = []

      if (args?.where) {
        const conditions = Object.entries(args.where)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, _]) => `${k} = ?`)

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
          Object.values(args.where).forEach(v => {
            if (v !== undefined && v !== null) argsList.push(v)
          })
        }
      }

      sql += ' ORDER BY createdAt DESC'

      const result = await client.execute({ sql, args: argsList })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Announcement (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    }
  },

  attendance: {
    findMany: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Attendance WHERE ${conditions.join(' AND ')}`,
        args: values
      })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Attendance (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    }
  },

  grade: {
    findMany: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Grade WHERE ${conditions.join(' AND ')}`,
        args: values
      })
      return result.rows
    }
  },

  submission: {
    findUnique: async (args: { where: { id: string } }) => {
      const client = getDb()
      const result = await client.execute({
        sql: 'SELECT * FROM Submission WHERE id = ?',
        args: [args.where.id]
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findFirst: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Submission WHERE ${conditions.join(' AND ')} LIMIT 1`,
        args: values
      })
      return result.rows.length > 0 ? result.rows[0] : null
    },
    findMany: async (args: { where: any }) => {
      const client = getDb()
      const conditions = Object.entries(args.where)
        .filter(([_, v]) => v !== undefined)
        .map(([k, _]) => `${k} = ?`)
      const values = Object.values(args.where).filter(v => v !== undefined)

      const result = await client.execute({
        sql: `SELECT * FROM Submission WHERE ${conditions.join(' AND ')}`,
        args: values
      })
      return result.rows
    },
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO Submission (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const client = getDb()
      const setClauses = Object.keys(args.data).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(args.data), args.where.id]

      await client.execute({
        sql: `UPDATE Submission SET ${setClauses} WHERE id = ?`,
        args: values
      })

      return { ...args.where, ...args.data }
    }
  },

  file: {
    create: async (args: { data: any }) => {
      const client = getDb()
      const id = args.data.id || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      const fields = ['id', ...Object.keys(args.data)]
      const values = [id, ...Object.values(args.data)]
      const placeholders = fields.map(() => '?').join(', ')

      await client.execute({
        sql: `INSERT INTO File (${fields.join(', ')}) VALUES (${placeholders})`,
        args: values
      })

      return { id, ...args.data }
    }
  },

  $disconnect: async () => {
    dbClient = null
  }
}
