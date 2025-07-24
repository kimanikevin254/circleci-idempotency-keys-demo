import { createApp } from "./app";
import { initializeDatabase } from "./config/database";

const PORT = process.env.PORT || 3000;

async function startServer() { 
    try {
        // Initialize the database connection
        await initializeDatabase();

        // Create and start the Express server
        const app = createApp();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Health check endpoint: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  if (require.main === module) {
    startServer();
  }