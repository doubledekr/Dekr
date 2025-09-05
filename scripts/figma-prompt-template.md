# Figma to React Native - Cursor Prompt Templates

## 🚀 Quick Start Prompt
```
I've just converted a Figma frame to React Native using the automated scripts. Please:

1. Review the generated component in figma-exports/
2. Integrate it into my app structure at [SPECIFY_PATH]
3. Fix any styling issues to match the Figma design exactly
4. Add proper TypeScript types and interfaces
5. Ensure it follows React Native best practices
6. Add any missing functionality (onPress handlers, navigation, etc.)

The component should be production-ready and match the Figma design as closely as possible.
```

## 🎨 Styling Refinement Prompt
```
The Figma conversion created a component but the styling needs refinement. Please:

- Adjust spacing, padding, and margins to match the design exactly
- Fix any color or typography discrepancies
- Optimize for different screen sizes (responsive design)
- Add proper flexbox layout if needed
- Ensure proper contrast and accessibility
- Handle dark/light mode if applicable

Component location: figma-exports/[COMPONENT_NAME].tsx
```

## ⚡ Functionality Addition Prompt
```
The Figma component is visually correct but needs functionality. Please add:

- Touch interactions and proper onPress handlers
- Navigation to other screens
- State management for dynamic content
- Loading states and error handling
- Proper accessibility features (accessibilityLabel, accessibilityHint)
- Form validation if it's an input component
- Animation and transitions where appropriate

Component: figma-exports/[COMPONENT_NAME].tsx
```

## 🔧 Integration Prompt
```
Please integrate this Figma-generated component into my React Native app:

1. Move the component to the appropriate location in my app structure
2. Create proper imports and exports
3. Add it to my navigation or routing system
4. Connect it to my existing state management (Redux/Context)
5. Ensure it works with my existing theme system
6. Add proper error boundaries and loading states

Generated component: figma-exports/[COMPONENT_NAME].tsx
Target location: [SPECIFY_PATH]
```

## 🎯 Customization Prompt
```
I need to customize this Figma-generated component for my specific use case:

- Change [SPECIFIC_ELEMENT] to [NEW_REQUIREMENT]
- Add [NEW_FEATURE] functionality
- Modify the layout to work better on [DEVICE_TYPE]
- Integrate with my [API/SERVICE] for dynamic data
- Add [SPECIFIC_ANIMATION] animation
- Handle [SPECIFIC_EDGE_CASE] edge case

Component: figma-exports/[COMPONENT_NAME].tsx
```

## 🐛 Debugging Prompt
```
The Figma-generated component has issues. Please help debug:

- [DESCRIBE_THE_PROBLEM]
- Check for common React Native styling issues
- Verify TypeScript types are correct
- Ensure proper component lifecycle
- Check for memory leaks or performance issues
- Validate accessibility compliance

Component: figma-exports/[COMPONENT_NAME].tsx
Error details: [PASTE_ERROR_MESSAGE]
```

## 📱 Responsive Design Prompt
```
Please make this Figma component responsive for different screen sizes:

- Optimize for iPhone (small screens)
- Ensure it works on tablets (large screens)
- Handle landscape orientation
- Use proper flexbox and responsive units
- Test on different device densities
- Add proper safe area handling

Component: figma-exports/[COMPONENT_NAME].tsx
```

## 🎨 Theme Integration Prompt
```
Please integrate this component with my existing theme system:

- Use my theme colors instead of hardcoded values
- Apply my typography system
- Use my spacing and sizing constants
- Ensure it works with dark/light mode
- Follow my design system patterns
- Use my existing component library where possible

Component: figma-exports/[COMPONENT_NAME].tsx
Theme files: [SPECIFY_THEME_LOCATION]
```

## 🔄 Batch Processing Prompt
```
I have multiple Figma components to integrate. Please:

1. Process all components in figma-exports/
2. Create a consistent structure for all components
3. Set up proper imports and exports
4. Create a component index file
5. Ensure consistent styling patterns
6. Add proper TypeScript types for all components

Components: [LIST_ALL_COMPONENTS]
```

## 📋 Usage Instructions

1. **Copy the relevant prompt** from above
2. **Replace placeholders** like `[COMPONENT_NAME]`, `[SPECIFY_PATH]`, etc.
3. **Paste into Cursor** after running your Figma conversion
4. **Customize further** based on your specific needs

## 💡 Pro Tips

- Always specify the exact component name and path
- Include relevant context about your app structure
- Mention any specific requirements or constraints
- Be specific about what needs to be changed or added
- Include error messages when debugging
