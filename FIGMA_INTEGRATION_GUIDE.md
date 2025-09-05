# Figma Integration Guide for React Native

This guide shows you how to convert Figma designs directly into React Native components using the automated scripts in this project.

## 🚀 Quick Start

### 1. Get Your Figma Frame Link
1. Open your Figma design
2. Select the frame you want to convert
3. Right-click → "Copy link to frame"
4. You'll get a URL like: `https://www.figma.com/file/ABC123def456/My-Design?node-id=1-23`

### 2. Extract the Required IDs
From your Figma URL:
- **FILE_KEY**: `ABC123def456` (the part after `/file/`)
- **FRAME_ID**: `1-23` (the part after `node-id=`)

### 3. Run the Conversion
```bash
# Option 1: Full automated conversion
npm run figma:full ABC123def456 1-23

# Option 2: Step by step
npm run figma:fetch ABC123def456 1-23
npm run figma:convert
```

### 4. Find Your Generated Component
Your React Native component will be created in:
- `figma-exports/YourComponentName.tsx` - The React Native component
- `figma-exports/figma-styles.json` - The extracted styles

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run figma:fetch <FILE_KEY> <FRAME_ID>` | Fetch frame data from Figma |
| `npm run figma:convert` | Convert frame data to React Native |
| `npm run figma:full <FILE_KEY> <FRAME_ID>` | Complete workflow (fetch + convert) |

## 🎨 What Gets Converted

### ✅ Supported Elements
- **Frames & Groups** → `<View>` components
- **Text** → `<Text>` components with typography
- **Images** → `<Image>` components (with placeholder URL)
- **Colors** → RGB/RGBA color values
- **Layout** → Width, height, positioning
- **Typography** → Font size, weight, family, color
- **Borders** → Border width, color, radius
- **Backgrounds** → Solid colors and gradients (approximated)

### 🔧 Generated Features
- **Component Structure**: Hierarchical JSX matching Figma layers
- **StyleSheet**: All visual properties converted to React Native styles
- **TypeScript**: Generated as `.tsx` files with proper typing
- **Naming**: Clean component names from Figma layer names

## 📁 File Structure

```
figma-exports/
├── figma-frame.json      # Raw Figma frame data
├── figma-file.json       # Full Figma file data
├── figma-styles.json     # Extracted styles
└── YourComponent.tsx     # Generated React Native component
```

## 🛠️ Configuration

### Environment Setup
Your Figma token is already configured in `figma.env`:
```
FIGMA_TOKEN=your_figma_personal_access_token_here
```

### Customization
You can modify the conversion logic in:
- `scripts/fetchFigmaFrame.js` - How data is fetched from Figma
- `scripts/convertFrame.js` - How Figma data becomes React Native

## 🎯 Cursor Integration

### Ready-to-Use Cursor Prompt
Copy and paste this prompt into Cursor after running the conversion:

```
I've just converted a Figma frame to React Native. Please:

1. Review the generated component in figma-exports/
2. Integrate it into my app structure
3. Fix any styling issues
4. Add proper TypeScript types
5. Ensure it follows React Native best practices
6. Add any missing functionality (onPress handlers, etc.)

The component should be production-ready and match the Figma design as closely as possible.
```

### Advanced Cursor Prompts

**For Styling Refinements:**
```
The Figma conversion created a component but the styling needs refinement. Please:
- Adjust spacing and layout to match the design exactly
- Fix any color or typography discrepancies
- Optimize for different screen sizes
- Add proper responsive behavior
```

**For Functionality Addition:**
```
The Figma component is visually correct but needs functionality. Please add:
- Touch interactions and navigation
- State management for dynamic content
- Proper accessibility features
- Loading states and error handling
```

## 🔍 Troubleshooting

### Common Issues

**"Frame not found"**
- Double-check your FILE_KEY and FRAME_ID
- Ensure you have access to the Figma file
- Try copying the frame link again

**"Permission denied"**
- Verify your Figma token is valid
- Check if the file is private or restricted
- Ensure you're a member of the Figma team

**"Styles look wrong"**
- Some Figma features don't translate perfectly
- Manual adjustments may be needed
- Use the generated styles as a starting point

### Debug Mode
Add `--verbose` to see detailed output:
```bash
node scripts/fetchFigmaFrame.js ABC123def456 1-23 --verbose
```

## 🚀 Pro Tips

1. **Start Simple**: Begin with basic frames before complex components
2. **Iterate**: Use the generated code as a foundation, then refine
3. **Test Early**: Check the component on different screen sizes
4. **Version Control**: Commit your generated components
5. **Documentation**: Add comments explaining any manual modifications

## 📚 Next Steps

After generating your component:
1. Import it into your app
2. Test on different devices
3. Add interactions and state
4. Optimize performance
5. Add accessibility features

Happy designing! 🎨
