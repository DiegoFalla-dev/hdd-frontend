/**
 * Color Constants - CinePlus Palette
 * Centralized color definitions for consistent branding
 */

export const COLORS = {
  // Primary Palette
  primary: '#BB2228',        // Rojo brillante
  primaryDark: '#5C1214',    // Rojo oscuro
  
  // Background
  bgLight: '#EFEFEE',        // Fondo claro
  bgMuted: '#E3E1E2',        // Fondo atenuado
  
  // Text & Gray
  textDefault: '#393A3A',    // Texto por defecto
  textStrong: '#141113',     // Texto fuerte
  
  // Semantic
  success: '#22c55e',        // Verde para éxito
  error: '#ef4444',          // Rojo para error
  warning: '#f59e0b',        // Naranja para advertencia
  
  // UI Elements
  border: '#3f3f46',         // Bordes
  surface: '#27272a',        // Superficies
  
  // Text Secondary
  textSecondary: '#a1a1a1',  // Texto secundario
  textMuted: '#808080',      // Texto desatenuado
  textLight: '#d1d1d1',      // Texto claro
} as const;

export type ColorKey = keyof typeof COLORS;
