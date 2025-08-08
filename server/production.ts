import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import path from "path";
import fs from "fs";

// Simple log function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Production static file serving function
function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  // Serve the app for all non-API routes (SPA fallback)
  app.get("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("App not found");
    }
  });
}

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    return originalSend.call(this, data);
  };

  next();
});

registerRoutes(app);

// error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log(`❌ ${message}`);
  res.status(status).json({ message });
  throw err;
});

// Serve static files in production
serveStatic(app);

app.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});