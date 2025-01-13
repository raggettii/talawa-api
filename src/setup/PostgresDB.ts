import inquirer from "inquirer";
import postgres from "postgres";

/**
 * The `checkExistingPostgres` function checks for an existing PostgreSQL URL in the environment variables and attempts to establish a connection.
 *
 * It performs the following steps:
 * 1. Retrieves the PostgreSQL URL from the environment variables.
 * 2. If no URL is found, it immediately returns null.
 * 3. If a URL is found, it attempts to establish a connection using the `checkConnection` function.
 *    - If the connection is successful (i.e., `checkConnection` returns true), it returns the URL.
 *    - If the connection fails (i.e., `checkConnection` returns false), it returns null.
 *
 * This function is used during the initial setup process to check if a valid PostgreSQL connection can be made with the existing URL in the environment variables.
 * @returns A promise that resolves to a string (if a connection could be made to the existing URL) or null (if no existing URL or connection could not be made).
 */
export async function checkExistingPostgres(): Promise<string | null> {
  const existingPostgresUrl = process.env.POSTGRES_URL;

  if (!existingPostgresUrl) {
    return null;
  }
  const isConnected = await checkConnection(existingPostgresUrl);
  if (isConnected) {
    return existingPostgresUrl;
  } else return null;
}

/**
 * The `checkConnection` function attempts to establish a connection to a PostgreSQL instance using a provided URL.
 *
 * @param url - The PostgreSQL connection URL.
 * @returns A promise that resolves to a boolean indicating whether the connection was successful (true) or not (false).
 *
 * It performs the following steps:
 * 1. Tries to establish a connection to the PostgreSQL instance using the provided URL.
 * 2. If the connection is successful, it closes the connection and returns true.
 * 3. If the connection fails, it logs an error message and returns false.
 */
export async function checkConnection(url: string): Promise<boolean> {
  console.log("\nChecking PostgreSQL connection...");
  console.log(`Attempting to connect with ${url}`)
  try {
    const sql = postgres(url, { connect_timeout: 1 });
    await sql`SELECT 1`;
    await sql.end();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`\nConnection to PostgreSQL failed with error: ${error.message}\n`);
    } else {
      console.log(`\nConnection to PostgreSQL failed. Please try again.\n`);
      console.log(error);
    }
    return false;
  }
}

import pg from 'pg';
const {Client} =pg;

export async function createDatabaseAndCheckConnection(
  host: string,
  port: number,
  username: string,
  password: string,
  database: string
): Promise<boolean> {
  try {
    console.log("hello before client.connect")
    // Connect to PostgreSQL (using a default database like postgres to create a new one)
    const client = new Client({
      host,
      port,
      user:username, // default superuser for PostgreSQL
      password, // provide the root password here
      database,// connect to the default database (postgres)
    });
    console.log("hello after new client")
    await client.connect();
    console.log("hello after client.connect")

    // Check if the database already exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (res.rows.length === 0) {
      // Database does not exist, so let's create it
      console.log(`Creating database ${database}...`);
      await client.query(`CREATE DATABASE ${database}`);
      console.log(`Database ${database} created successfully!`);
    } else {
      console.log(`Database ${database} already exists.`);
    }

    // Close the client connection after creating the database
    await client.end();

    // Now that the database is created (or exists), try to generate the connection URL
    const connectionUrl = `postgres://${username}:${password}@${host}:${port}/${database}`;

    // Check if the connection works with the generated URL
    const checkClient = new Client({
      connectionString: connectionUrl,
    });

    console.log(`Checking connection to the database ${database}...`);
    await checkClient.connect();
    await checkClient.query('SELECT 1');
    console.log(`Successfully connected to the database ${database} with user ${username}!`);

    await checkClient.end(); // Close the connection
    return true;
  } catch (error) {
    console.error('Error creating the database or checking the connection:', error);
    return false;
  }
}

// Example usage
// const host = 'localhost';
// const port = 5432;
// const username = 'myuser'; // Replace with the desired username
// const password = 'mypassword'; // Replace with the desired password
// const database = 'mynewdb'; // Replace with the desired database name

// createDatabaseAndCheckConnection(host, port, username, password, database);


/**
 * The function `askForPostgresUrl` prompts the user to enter a PostgreSQL URL and returns the entered URL
 * as a string.
 * @returns a Promise that resolves to a string.
 */
export async function askForPostgresUrl(): Promise<{host: string, port: number, database: string, user: string, password: string}> {
  const { host, port, database, user, password } = await inquirer.prompt([
    {
      type: "input",
      name: "host",
      message: "Enter your PostgreSQL host:",
      default: "localhost",
    },
    {
      type: "input",
      name: "port",
      message: "Enter your PostgreSQL port:",
      default: "5432",
    },
    {
      type: "input",
      name: "database",
      message: "Enter your PostgreSQL database name:",
      default: "postgres",
    },
    {
      type: "input",
      name: "user",
      message: "Enter your PostgreSQL username:",
      default: "postgres",
    },
    {
      type: "password",
      name: "password",
      message: "Enter your PostgreSQL password:",
    },
  ]);

  return {host,port,database,user,password};
}
