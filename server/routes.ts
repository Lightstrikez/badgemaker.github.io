import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBadgeSchema, insertBadgeApplicationSchema, insertEvidenceSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos, and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use proper session management here
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/progress", async (req, res) => {
    try {
      const progress = await storage.getGraduateProfileProgress(req.params.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req, res) => {
    try {
      const { graduateProfile } = req.query;
      let badges;
      
      if (graduateProfile && typeof graduateProfile === 'string') {
        badges = await storage.getBadgesByGraduateProfile(graduateProfile as any);
      } else {
        badges = await storage.getAllBadges();
      }
      
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/badges/:id", async (req, res) => {
    try {
      const badge = await storage.getBadge(req.params.id);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      res.json(badge);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/badges", async (req, res) => {
    try {
      const badgeData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error) {
      res.status(400).json({ message: "Invalid badge data" });
    }
  });

  // Badge Application routes
  app.get("/api/users/:userId/applications", async (req, res) => {
    try {
      const applications = await storage.getUserApplications(req.params.userId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const applicationData = insertBadgeApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { status, reviewedBy, feedback } = req.body;
      const application = await storage.updateApplicationStatus(
        req.params.id,
        status,
        reviewedBy,
        feedback
      );
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid status update" });
    }
  });

  app.get("/api/applications/review", async (req, res) => {
    try {
      const applications = await storage.getApplicationsForReview();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Evidence routes
  app.get("/api/applications/:applicationId/evidence", async (req, res) => {
    try {
      const evidence = await storage.getApplicationEvidence(req.params.applicationId);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/evidence", upload.single('file'), async (req, res) => {
    try {
      const evidenceData = {
        ...req.body,
        metadata: req.file ? {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : null,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null
      };
      
      const validatedData = insertEvidenceSchema.parse(evidenceData);
      const evidence = await storage.createEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      res.status(400).json({ message: "Invalid evidence data" });
    }
  });

  app.delete("/api/evidence/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvidence(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Evidence not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
