/**
 * Centralized API & App Configuration for User & Public Scanner App
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api');
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Safe Drive Vehicle Safety';
