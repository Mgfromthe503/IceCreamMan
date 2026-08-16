/** @type {const} */
const themeColors = {
  // Modern, clean primary - vibrant but professional
  primary: { light: '#E91E63', dark: '#FF1493' },        // Vibrant Magenta
  
  // Clean, minimal backgrounds
  background: { light: '#FFFFFF', dark: '#0F0F0F' },    // Pure White / Deep Black
  
  // Subtle surface for cards and containers
  surface: { light: '#F5F5F5', dark: '#1A1A1A' },       // Light Gray / Dark Gray
  
  // Strong, readable text
  foreground: { light: '#1A1A1A', dark: '#FFFFFF' },    // Near Black / Pure White
  
  // Secondary text - subtle but readable
  muted: { light: '#666666', dark: '#AAAAAA' },         // Medium Gray
  
  // Clean borders
  border: { light: '#E0E0E0', dark: '#333333' },        // Light Border / Dark Border
  
  // Status colors - clean and clear
  success: { light: '#10B981', dark: '#34D399' },       // Emerald Green
  warning: { light: '#F59E0B', dark: '#FBBF24' },       // Amber Orange
  error: { light: '#EF4444', dark: '#F87171' },         // Red
  
  // Additional utility colors for modern design
  secondary: { light: '#6366F1', dark: '#818CF8' },     // Indigo
  accent: { light: '#EC4899', dark: '#F472B6' },        // Pink Accent
};

module.exports = { themeColors };
