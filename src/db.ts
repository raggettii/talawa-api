import { drizzle } from 'drizzle-orm/d1';
import { logger } from './libraries';
import { checkReplication } from './utilities/checkReplicaSet'; // If you need similar functionality for Postgres.
import pg from 'pg'
const { Pool } = pg
let pool = new Pool();
let db: ReturnType<typeof drizzle>;

export const connect = async (): Promise<void> => {
  // Check if a connection to the database already exists.
  if (pool) {
    logger.info('Database connection already established.');
    return;
  }

  const databaseUrl = process.env.POSTGRES_DB_URL; 

  // If no connection exists, attempt to establish a new connection.
  try {
    pool = new Pool({
      connectionString: databaseUrl,
    });

    db = drizzle(pool);

    // Check if connected to a replica set (or similar functionality for Postgres, if needed)
    const replicaSet = await checkReplication(); // Modify or replace this function for Postgres.
    if (replicaSet) {
      logger.info('Connected to a Postgres replica set!');
    } else {
      logger.info('Connected to a single Postgres instance.');
    }
  } catch (error) {
    logger.error('Error while connecting to the Postgres database:', error);
    process.exit(1);
  }
};

export const disconnect = async (): Promise<void> => {
  if (!pool) {
    logger.warn('No active database connection to disconnect.');
    return;
  }
  await pool.end();
  logger.info('Database connection closed.');
};

export { db };
