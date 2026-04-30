/**
 * Application Constants
 * Centralized configuration for company branding and contact details
 */

export const APP_CONFIG = {
  // Company Branding
  company: {
    name: 'Falisha Manpower',
    logo: '/logo.png',
  },

  // Contact Details
  contact: {
    phone: '+92330 3333335',
    email: 'falishamanpower4035@gmail.com',
    phone_display: '+92 (330) 333-3335', // Formatted for display
    whatsapp_chat_link: import.meta.env.VITE_WHATSAPP_CHAT_LINK || '',
    whatsapp_chat_number: import.meta.env.VITE_WHATSAPP_CHAT_NUMBER || '+923125569101',
  },

  // Feature Flags
  features: {
    enableEmployerCV: true,
    enableCVParser: true,
    enablePhotoExtraction: true,
  },
};
