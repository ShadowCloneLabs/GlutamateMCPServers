import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const DEFAULT_PORT = 7896;

// Puppeteer configuration
export const PUPPETEER_SKIP_DOWNLOAD = process.env.PUPPETEER_SKIP_DOWNLOAD === 'true' || process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' || true;
export const ALLOW_DANGEROUS_ARGS = process.env.ALLOW_DANGEROUS === 'false' || false;
export const DOCKER_CONTAINER = process.env.DOCKER_CONTAINER === 'false' || false;
export const PUPPETEER_HEADLESS = process.env.PUPPETEER_HEADLESS === 'true' || false;

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

export function getPuppeteerEnvConfig() {
  try {
    return JSON.parse(process.env.PUPPETEER_ENV_CONFIG || "{}");
  } catch (error) {
    console.warn('Failed to parse PUPPETEER_ENV_CONFIG:', error);
    return {};
  }
} 