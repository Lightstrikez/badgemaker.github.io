import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBadgeSchema, insertBadgeApplicationSchema, insertEvidenceSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import PptxGenJS from "pptxgenjs";
import pdf from "html-pdf-node";
// @ts-ignore - html-pdf-node doesn't have proper types

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
  // Create slides directory if it doesn't exist
  const slidesDir = path.join(process.cwd(), 'slides');
  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }
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

  // Slide generation routes
  app.post("/api/slides/generate", async (req, res) => {
    try {
      const { badgeId, badgeName, graduateProfile, evidence, reflections } = req.body;
      
      // Get badge details
      const badge = await storage.getBadge(badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      // Create PowerPoint presentation
      const pptx = new PptxGenJS();
      
      // Define colors based on graduate profile
      const profileColors = {
        excellence: { primary: "FF6B35", secondary: "F7931E" },
        innovation: { primary: "00B4D8", secondary: "0077B6" },
        integrity: { primary: "7209B7", secondary: "A663CC" },
        inspiration: { primary: "F72585", secondary: "4CC9F0" },
        hauora: { primary: "06FFA5", secondary: "028A0F" },
        relationships: { primary: "FFB700", secondary: "FB8500" }
      };
      
      const colors = profileColors[graduateProfile as keyof typeof profileColors] || profileColors.excellence;

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText(badgeName, {
        x: 1, y: 2, w: 8, h: 1.5,
        fontSize: 36, bold: true, color: colors.primary, align: 'center'
      });
      titleSlide.addText(`Graduate Profile Badge Portfolio`, {
        x: 1, y: 3.5, w: 8, h: 0.8,
        fontSize: 24, color: '666666', align: 'center'
      });
      titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: 1, y: 6, w: 8, h: 0.5,
        fontSize: 16, color: '999999', align: 'center'
      });

      // Badge criteria slide
      const criteriaSlide = pptx.addSlide();
      criteriaSlide.addText('Badge Criteria', {
        x: 1, y: 0.5, w: 8, h: 1,
        fontSize: 32, bold: true, color: colors.primary
      });
      criteriaSlide.addText(badge.criteria, {
        x: 1, y: 1.5, w: 8, h: 4,
        fontSize: 16, valign: 'top'
      });

      // Evidence slides
      evidence.forEach((item: any, index: number) => {
        const evidenceSlide = pptx.addSlide();
        evidenceSlide.addText(`Evidence ${index + 1}: ${item.title}`, {
          x: 1, y: 0.5, w: 8, h: 1,
          fontSize: 28, bold: true, color: colors.secondary
        });
        evidenceSlide.addText(`Type: ${item.type}`, {
          x: 1, y: 1.5, w: 4, h: 0.5,
          fontSize: 14, bold: true
        });
        evidenceSlide.addText(`Source: ${item.source || 'Not specified'}`, {
          x: 5, y: 1.5, w: 4, h: 0.5,
          fontSize: 14, bold: true
        });
        evidenceSlide.addText(item.description, {
          x: 1, y: 2.2, w: 8, h: 4,
          fontSize: 16, valign: 'top'
        });
      });

      // Reflection slides
      Object.entries(reflections).forEach(([key, reflection], index) => {
        const reflectionSlide = pptx.addSlide();
        const titles = {
          learning: 'What I Learned',
          growth: 'How I Grew as a Learner',
          connection: `Connection to ${graduateProfile.charAt(0).toUpperCase() + graduateProfile.slice(1)}`,
          application: 'Real-World Applications'
        };
        
        reflectionSlide.addText(titles[key as keyof typeof titles] || `Reflection ${index + 1}`, {
          x: 1, y: 0.5, w: 8, h: 1,
          fontSize: 28, bold: true, color: colors.primary
        });
        reflectionSlide.addText(String(reflection), {
          x: 1, y: 1.5, w: 8, h: 5,
          fontSize: 16, valign: 'top'
        });
      });

      // Summary slide
      const summarySlide = pptx.addSlide();
      summarySlide.addText('Ready for Badge Panel! 🎯', {
        x: 1, y: 2, w: 8, h: 1,
        fontSize: 32, bold: true, color: colors.primary, align: 'center'
      });
      summarySlide.addText('Thank you for reviewing my portfolio', {
        x: 1, y: 4, w: 8, h: 1,
        fontSize: 20, color: '666666', align: 'center'
      });

      // Save presentation
      const filename = `badge-${badgeId}-${Date.now()}.pptx`;
      const filepath = path.join(slidesDir, filename);
      
      await pptx.writeFile({ fileName: filepath });

      // Generate slide data response
      const slideData = {
        badgeId,
        badgeName,
        graduateProfile,
        badge,
        evidence,
        reflections,
        generatedAt: new Date().toISOString(),
        filename,
        downloadUrl: `/api/slides/download/${filename}`,
        pdfUrl: `/api/slides/pdf/${filename.replace('.pptx', '.pdf')}`,
        viewUrl: `/api/slides/view/${badgeId}`,
        shareUrl: `/api/slides/share/${badgeId}`
      };

      res.json(slideData);
    } catch (error) {
      console.error('Error generating slides:', error);
      res.status(500).json({ message: "Error generating slides" });
    }
  });

  app.get("/api/slides/download/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join(slidesDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading slides:', error);
      res.status(500).json({ message: "Error downloading slides" });
    }
  });

  app.get("/api/slides/pdf/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const pdfPath = path.join(slidesDir, filename);
      
      // Check if PDF already exists
      if (fs.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const fileStream = fs.createReadStream(pdfPath);
        return fileStream.pipe(res);
      }

      // Generate PDF from badge data
      const badgeId = filename.split('-')[1];
      const badge = await storage.getBadge(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${badge.name} Badge Portfolio</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #FF6B35; text-align: center; font-size: 2.5em; margin-bottom: 20px; }
            h2 { color: #F7931E; border-bottom: 3px solid #F7931E; padding-bottom: 10px; margin-top: 30px; }
            .criteria { background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #FF6B35; margin: 20px 0; }
            .generated { text-align: center; color: #666; margin-bottom: 40px; }
            .summary { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; text-align: center; border-radius: 12px; margin: 40px 0; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <h1>${badge.name}</h1>
          <div class="generated">
            <strong>Graduate Profile Badge Portfolio</strong><br>
            Generated: ${new Date().toLocaleDateString()}
          </div>
          
          <h2>Badge Criteria</h2>
          <div class="criteria">${badge.criteria}</div>
          
          <div class="page-break">
            <h2>Portfolio Summary</h2>
            <p>This portfolio contains comprehensive evidence demonstrating achievement of the ${badge.name} badge criteria through:</p>
            <ul>
              <li>Authentic evidence from learning experiences</li>
              <li>Reflective analysis of growth and learning</li>
              <li>Connection to the ${badge.graduateProfile} Graduate Profile value</li>
              <li>Real-world applications and transferable skills</li>
            </ul>
            
            <div class="summary">
              <h2 style="color: white; margin-top: 0;">Ready for Badge Panel! 🎯</h2>
              <p>This portfolio demonstrates mastery of the badge criteria and readiness for evaluation.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const options = {
        format: 'A4',
        border: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
      };

      const pdfBuffer = await pdf.generatePdf({ content: htmlContent }, options);
      
      // Save PDF to disk
      fs.writeFileSync(pdfPath, pdfBuffer);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: "Error generating PDF" });
    }
  });

  app.get("/api/slides/view/:badgeId", async (req, res) => {
    try {
      const badge = await storage.getBadge(req.params.badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      const htmlPresentation = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${badge.name} Badge Portfolio</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            .presentation {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .slide {
              padding: 40px;
              min-height: 400px;
              border-bottom: 1px solid #eee;
            }
            .slide:last-child { border-bottom: none; }
            h1 {
              color: #FF6B35;
              font-size: 2.5em;
              text-align: center;
              margin-bottom: 20px;
            }
            h2 {
              color: #F7931E;
              font-size: 1.8em;
              border-bottom: 3px solid #F7931E;
              padding-bottom: 10px;
            }
            .criteria {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 8px;
              border-left: 4px solid #FF6B35;
              margin: 20px 0;
              font-size: 1.1em;
              line-height: 1.6;
            }
            .badge-info {
              text-align: center;
              color: #666;
              font-size: 1.1em;
              margin: 20px 0;
            }
            .highlight {
              background: linear-gradient(120deg, #FF6B35 0%, #F7931E 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="presentation">
            <div class="slide">
              <h1>${badge.name}</h1>
              <div class="badge-info">
                <strong>Graduate Profile Badge Portfolio</strong><br>
                <span class="highlight">${badge.graduateProfile.charAt(0).toUpperCase() + badge.graduateProfile.slice(1)}</span>
              </div>
              <div class="badge-info">
                Generated: ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div class="slide">
              <h2>Badge Criteria</h2>
              <div class="criteria">
                ${badge.criteria}
              </div>
            </div>
            
            <div class="slide">
              <h2>Portfolio Complete! 🎯</h2>
              <div class="badge-info">
                <p style="font-size: 1.2em; line-height: 1.8;">This portfolio contains evidence demonstrating achievement of the badge criteria.</p>
                <p style="font-size: 1.2em; line-height: 1.8;">Ready for badge panel presentation!</p>
                <p style="color: #FF6B35; font-weight: bold; font-size: 1.3em;">Download the PowerPoint or PDF version for your presentation.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(htmlPresentation);
    } catch (error) {
      console.error('Error viewing slides:', error);
      res.status(500).json({ message: "Error viewing slides" });
    }
  });

  app.get("/api/slides/share/:badgeId", async (req, res) => {
    try {
      // Sharing functionality - could generate shareable links
      const badge = await storage.getBadge(req.params.badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      const shareData = {
        badgeId: req.params.badgeId,
        badgeName: badge.name,
        shareUrl: `${req.protocol}://${req.get('host')}/api/slides/view/${req.params.badgeId}`,
        message: `Check out my ${badge.name} badge portfolio!`
      };

      res.json(shareData);
    } catch (error) {
      console.error('Error sharing slides:', error);
      res.status(500).json({ message: "Error sharing slides" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
