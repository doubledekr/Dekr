import { Client } from "figma-api";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'figma.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

if (!FIGMA_TOKEN) {
  console.error("❌ FIGMA_TOKEN not found in environment variables");
  console.log("Please create a figma.env file with your Figma token:");
  console.log("FIGMA_TOKEN=your_token_here");
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node fetchFigmaFrame.js <FILE_KEY> <FRAME_ID>");
  console.log("");
  console.log("FILE_KEY: From Figma URL https://www.figma.com/file/FILE_KEY/...");
  console.log("FRAME_ID: From Figma frame link node-id parameter");
  console.log("");
  console.log("Example:");
  console.log("node fetchFigmaFrame.js ABC123def456 1-23");
  process.exit(1);
}

const FILE_KEY = args[0];
const FRAME_ID = args[1];

const api = new Client({ personalAccessToken: FIGMA_TOKEN });

async function run() {
  try {
    console.log(`🔍 Fetching Figma file: ${FILE_KEY}`);
    console.log(`🎯 Looking for frame: ${FRAME_ID}`);
    
    const file = await api.file(FILE_KEY);
    
    // Recursively search for the frame
    function findFrame(node, targetId) {
      if (node.id === targetId) {
        return node;
      }
      
      if (node.children) {
        for (const child of node.children) {
          const found = findFrame(child, targetId);
          if (found) return found;
        }
      }
      
      return null;
    }
    
    const frame = findFrame(file.document, FRAME_ID);
    
    if (!frame) {
      console.error(`❌ Frame with ID "${FRAME_ID}" not found in file`);
      console.log("Available frame IDs:");
      
      function listFrames(node, depth = 0) {
        const indent = "  ".repeat(depth);
        if (node.type === "FRAME" || node.type === "COMPONENT") {
          console.log(`${indent}${node.name} (${node.id})`);
        }
        if (node.children) {
          node.children.forEach(child => listFrames(child, depth + 1));
        }
      }
      
      listFrames(file.document);
      process.exit(1);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "..", "figma-exports");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the frame data
    const outputPath = path.join(outputDir, "figma-frame.json");
    fs.writeFileSync(outputPath, JSON.stringify(frame, null, 2));
    
    console.log(`✅ Figma frame exported to: ${outputPath}`);
    console.log(`📊 Frame: "${frame.name}" (${frame.type})`);
    console.log(`📐 Size: ${frame.absoluteBoundingBox?.width || 'N/A'} x ${frame.absoluteBoundingBox?.height || 'N/A'}`);
    console.log(`🧩 Children: ${frame.children?.length || 0}`);
    
    // Also save the full file for reference
    const fullFilePath = path.join(outputDir, "figma-file.json");
    fs.writeFileSync(fullFilePath, JSON.stringify(file, null, 2));
    console.log(`📁 Full file saved to: ${fullFilePath}`);
    
  } catch (error) {
    console.error("❌ Error fetching Figma data:", error.message);
    if (error.message.includes("403")) {
      console.log("💡 This might be a permissions issue. Make sure:");
      console.log("   - Your Figma token is valid");
      console.log("   - You have access to the file");
      console.log("   - The file is not private or restricted");
    }
    process.exit(1);
  }
}

run();
