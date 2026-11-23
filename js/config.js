/**
 * GS Telecom ERP — frontend config
 * 1) Deploy the Apps Script as a Web App and paste its /exec URL below.
 * 2) Push this folder to GitHub Pages. Done.
 *
 * DEMO mode: when API_URL is empty, the app runs the real backend code INSIDE the browser
 * with an in-memory "Google Sheet" (saved in this browser only) — perfect for trying the UI.
 */
window.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzThbEB5W6AH355d6UOTawU0ncbQ77ewXbOmE_TwpIO4sOsq8FvTcYUh0mL3ElyTWD-UQ/exec',                       // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'
  APP_VERSION: '2.1.1',
  // Several shops on one frontend: link = index.html?shop=code → API URL from this map (overrides API_URL)
  SHOPS: { 'gstelecom': 'https://script.google.com/macros/s/AKfycbzThbEB5W6AH355d6UOTawU0ncbQ77ewXbOmE_TwpIO4sOsq8FvTcYUh0mL3ElyTWD-UQ/exec' },
  SHOP_CODE: 'gstelecom',            // used as a key for local caches (one browser can hold several shops)
  DEMO_LOGIN: { username: 'admin', password: 'admin@123' }
};
