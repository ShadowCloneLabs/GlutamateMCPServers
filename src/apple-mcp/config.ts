import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const DEFAULT_PORT = 9006;

export function getConfiguredPort() {
  const args = process.argv.slice(2);
  const argPort = args
    .find((arg) => arg.startsWith("--port="))
    ?.split("=")[1];

  // Priority: env vars > command line args > default values
  return parseInt(
    process.env.PORT || argPort || DEFAULT_PORT.toString()
  );
}