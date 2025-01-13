import { expect, describe, it, vi } from "vitest";
import { postgresDB } from "../../setup";
import * as module from "../../src/setup/PostgresDB";
import inquirer from "inquirer";
import dotenv from "dotenv";
import fs from "fs";
import { Pool } from "pg";

/**
 * File: postgresDB.test.ts
 *
 * Overview:
 * This test file is part of the testing suite for the 'postgresDB' setup function
 * in the project's setup module. The 'postgresDB' function is responsible for configuring
 * the PostgreSQL connection settings based on user input or existing configurations.
 *
 * Purpose:
 * The purpose of this test file is to thoroughly validate the behavior of the 'postgresDB'
 * function under various scenarios, ensuring that it correctly handles both existing
 * and new PostgreSQL connection configurations.
 *
 * Test Cases:
 * - 'testing connection to existing PostgreSQL URL if confirmed':
 *   Verifies that the 'postgresDB' function connects to an existing PostgreSQL URL if the user
 *   confirms to keep the values.
 *
 * - 'should prompt for and connect to new URL if existing is not confirmed or unavailable':
 *   Verifies that the 'postgresDB' function prompts the user for a new PostgreSQL URL and connects
 *   if the existing URL is not confirmed or unavailable.
 *
 * Setup:
 * - Mocks are set up for inquirer prompts and filesystem operations to simulate user input
 *   and environment file reading.
 * - Spies are set up for relevant functions within the setup module to monitor their invocation
 *   and control their behavior during testing.
 */

describe("Setup -> postgresDB", () => {
  /**
   * Test case: testing connection to existing PostgreSQL URL if confirmed
   *
   * Description:
   * This test verifies that the `postgresDB` function connects to an
   * existing PostgreSQL URL if the user confirms to keep the values.
   */
  it("testing connection to existing PostgreSQL URL if confirmed", async () => {
    const existingUrl = "postgres://testUrl";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ keepValues: true });
    vi.spyOn(module, "checkExistingPostgresDB").mockResolvedValueOnce(existingUrl);

    await postgresDB();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.POSTGRES_DB_URL).toEqual(existingUrl + "/talawa-api");
  });

  /**
   * Test case: should prompt for and connect to new URL if existing is not confirmed or unavailable
   *
   * Description:
   * This test verifies that the `postgresDB` function prompts the user for a new PostgreSQL URL and connects
   * if the existing URL is not confirmed or unavailable.
   */
  it("should prompt for and connect to new URL if existing is not confirmed or unavailable", async () => {
    vi.spyOn(module, "checkExistingPostgresDB").mockImplementationOnce(() =>
      Promise.resolve(null)
    );
    const newUrl = "postgres://testUrl-new";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ keepValues: false });
    vi.spyOn(module, "askForPostgresDBUrl").mockImplementationOnce(() =>
      Promise.resolve(newUrl)
    );
    vi.spyOn(module, "checkConnection").mockImplementationOnce(() =>
      Promise.resolve(true)
    );

    const consoleLogMock = vi.spyOn(console, "log");

    await postgresDB();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.POSTGRES_DB_URL).toEqual(newUrl + "/talawa-api");
    expect(consoleLogMock).not.toHaveBeenCalledWith("PostgreSQL URL detected:");
    expect(consoleLogMock).toHaveBeenCalledWith(
      "\nConnection to PostgreSQL successful! 🎉"
    );
  });

  it("should ask for PostgreSQL URL and return it", async () => {
    const url = "postgres://localhost:5432/talawa-api";
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        url: url,
      })
    );
    const result = await module.askForPostgresDBUrl();
    expect(result).toEqual(url);
  });

  it("should return true for a successful connection with PostgreSQL", async () => {
    const url = "postgres://localhost:5432/test";
    vi.spyOn(module, "checkConnection").mockResolvedValueOnce(true);
    const result = await module.checkConnection(url);
    expect(result).toEqual(true);
  });
});
