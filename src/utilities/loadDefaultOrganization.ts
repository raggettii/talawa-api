import fs from "fs/promises";
import path from "path";
const dirname: string = path.dirname(new URL(import.meta.url).pathname);
import { connect, disconnect, db } from "../db";
import { usersTable, organizationsTable } from "../drizzle/schema";

/**
 * Loads default organization data into the PostgreSQL database.
 * @param dbName - Optional name of the database to connect to.
 * @returns Promise<void>
 */
export async function loadDefaultOrganization(): Promise<void> {
  try {
    // Connect to the PostgreSQL database
    await connect();

    // Read and insert default user data
    const userData = await fs.readFile(
      path.join(dirname, `../../sample_data/defaultUsersTable.json`),
      "utf8",
    );
    const userDocs = JSON.parse(userData);

    // Insert user data into PostgreSQL using Drizzle's query builder
    for (const user of userDocs) {
      await db.insert(usersTable).values(user);
    }

    // Read and insert default organization data
    const organizationData = await fs.readFile(
      path.join(dirname, `../../sample_data/defaultOrganization.json`),
      "utf8",
    );
    const organizationDocs = JSON.parse(organizationData);

    // Insert organization data into PostgreSQL using Drizzle's query builder
    for (const organization of organizationDocs) {
      await db.insert(organizationsTable).values(organization);
    }

    // Log success message
    console.log("Default organization loaded");
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);
  } finally {
    await disconnect(); // Close the database connection
  }
}
