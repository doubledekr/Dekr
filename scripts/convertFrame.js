import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the Figma frame data
const framePath = path.join(__dirname, "..", "figma-exports", "figma-frame.json");

if (!fs.existsSync(framePath)) {
  console.error("❌ figma-frame.json not found. Run fetchFigmaFrame.js first.");
  process.exit(1);
}

const frame = JSON.parse(fs.readFileSync(framePath, "utf8"));

// Helper function to convert Figma color to React Native color
function figmaColorToRN(figmaColor, opacity = 1) {
  if (!figmaColor) return "transparent";
  
  const r = Math.round(figmaColor.r * 255);
  const g = Math.round(figmaColor.g * 255);
  const b = Math.round(figmaColor.b * 255);
  const a = opacity || figmaColor.a || 1;
  
  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Helper function to get text style properties
function getTextStyle(node) {
  if (node.type !== "TEXT") return {};
  
  const style = node.style || {};
  const fills = node.fills?.[0];
  
  return {
    fontSize: style.fontSize || 16,
    fontWeight: style.fontWeight || "normal",
    fontFamily: style.fontFamily || "System",
    color: fills ? figmaColorToRN(fills.color, fills.opacity) : "#000000",
    textAlign: style.textAlign || "left",
    lineHeight: style.lineHeightPx || undefined,
    letterSpacing: style.letterSpacing || undefined,
  };
}

// Helper function to get layout properties
function getLayoutStyle(node) {
  const bounds = node.absoluteBoundingBox;
  if (!bounds) return {};
  
  return {
    width: bounds.width,
    height: bounds.height,
    position: "absolute",
    left: bounds.x,
    top: bounds.y,
  };
}

// Helper function to get background and border styles
function getVisualStyle(node) {
  const fills = node.fills?.[0];
  const strokes = node.strokes?.[0];
  const cornerRadius = node.cornerRadius;
  
  const style = {};
  
  // Background
  if (fills && fills.type === "SOLID") {
    style.backgroundColor = figmaColorToRN(fills.color, fills.opacity);
  } else if (fills && fills.type === "GRADIENT_LINEAR") {
    // For gradients, we'll use a solid color approximation
    const firstStop = fills.gradientStops[0];
    style.backgroundColor = figmaColorToRN(firstStop.color, firstStop.opacity);
  }
  
  // Border
  if (strokes && strokes.type === "SOLID") {
    style.borderWidth = node.strokeWeight || 1;
    style.borderColor = figmaColorToRN(strokes.color, strokes.opacity);
  }
  
  // Border radius
  if (cornerRadius) {
    style.borderRadius = cornerRadius;
  }
  
  return style;
}

// Convert a Figma node to React Native style
function nodeToStyle(node) {
  const layoutStyle = getLayoutStyle(node);
  const visualStyle = getVisualStyle(node);
  const textStyle = getTextStyle(node);
  
  return {
    ...layoutStyle,
    ...visualStyle,
    ...textStyle,
  };
}

// Generate component name from node name
function generateComponentName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
    .replace(/^[0-9]/, "_$&"); // Prefix with underscore if starts with number
}

// Convert frame to React Native component structure
function convertToRNComponent(node, depth = 0) {
  const indent = "  ".repeat(depth);
  const componentName = generateComponentName(node.name);
  const style = nodeToStyle(node);
  
  let jsx = "";
  
  // Determine the component type
  let componentType = "View";
  if (node.type === "TEXT") {
    componentType = "Text";
  } else if (node.type === "IMAGE") {
    componentType = "Image";
  }
  
  // Generate JSX
  if (node.children && node.children.length > 0) {
    // Container with children
    jsx += `${indent}<${componentType} style={styles.${componentName}}>\n`;
    node.children.forEach(child => {
      jsx += convertToRNComponent(child, depth + 1);
    });
    jsx += `${indent}</${componentType}>\n`;
  } else {
    // Leaf node
    if (node.type === "TEXT") {
      jsx += `${indent}<${componentType} style={styles.${componentName}}>${node.characters || ""}</${componentType}>\n`;
    } else if (node.type === "IMAGE") {
      jsx += `${indent}<${componentType} style={styles.${componentName}} source={{ uri: "YOUR_IMAGE_URL" }} />\n`;
    } else {
      jsx += `${indent}<${componentType} style={styles.${componentName}} />\n`;
    }
  }
  
  return jsx;
}

// Generate styles object
function generateStyles(node) {
  const styles = {};
  
  function collectStyles(n) {
    const componentName = generateComponentName(n.name);
    styles[componentName] = nodeToStyle(n);
    
    if (n.children) {
      n.children.forEach(child => collectStyles(child));
    }
  }
  
  collectStyles(node);
  return styles;
}

// Main conversion
try {
  console.log("🔄 Converting Figma frame to React Native...");
  
  const componentName = generateComponentName(frame.name);
  const jsx = convertToRNComponent(frame);
  const styles = generateStyles(frame);
  
  // Generate the complete React Native component
  const componentCode = `import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ${componentName}() {
  return (
${jsx}  );
}

const styles = StyleSheet.create(${JSON.stringify(styles, null, 2)});
`;

  // Save the component
  const outputDir = path.join(__dirname, "..", "figma-exports");
  const componentPath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(componentPath, componentCode);
  
  // Save styles separately for reference
  const stylesPath = path.join(outputDir, "figma-styles.json");
  fs.writeFileSync(stylesPath, JSON.stringify(styles, null, 2));
  
  console.log(`✅ React Native component generated: ${componentPath}`);
  console.log(`📊 Component: ${componentName}`);
  console.log(`🎨 Styles: ${Object.keys(styles).length} style objects`);
  console.log(`📁 Styles JSON: ${stylesPath}`);
  
  // Print summary
  console.log("\n📋 Component Summary:");
  console.log(`   - Name: ${componentName}`);
  console.log(`   - Type: ${frame.type}`);
  console.log(`   - Size: ${frame.absoluteBoundingBox?.width || 'N/A'} x ${frame.absoluteBoundingBox?.height || 'N/A'}`);
  console.log(`   - Children: ${frame.children?.length || 0}`);
  
  // List all generated styles
  console.log("\n🎨 Generated Styles:");
  Object.keys(styles).forEach(styleName => {
    const style = styles[styleName];
    const props = Object.keys(style).join(", ");
    console.log(`   - ${styleName}: {${props}}`);
  });
  
} catch (error) {
  console.error("❌ Error converting frame:", error.message);
  process.exit(1);
}
