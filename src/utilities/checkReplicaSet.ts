import pg from 'pg';
import { logger } from "../libraries";
const {Pool}=pg
const pool = new Pool();

/**
 * Checks if the PostgreSQL connection is part of a replication setup.
 * This function queries the 'pg_stat_replication' view to determine if the server is configured for replication.
 *
 * @returns A promise that resolves to a boolean indicating whether the connection is part of a replication setup (true) or not (false).
 */
export const checkReplication = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_stat_replication
      );
    `);
    client.release();

    return res.rows[0].exists;
  } catch (error) {
    logger.error("Error checking replication configuration:", error);
    return false;
  }
};
