import App from "./classes/core/App";

/**
 * Main application entry point
 *
 * This file serves as the clean entry point for the Synta application.
 * All Electron logic, window management, and app lifecycle is handled
 * by the App class itself.
 */
try {
  // Initialize the main application
  const app = new App();

  // Log successful startup
  console.log("🚀 Synta application started successfully");
} catch (error) {
  console.error("❌ Failed to start Synta application:", error);
  process.exit(1);
}
