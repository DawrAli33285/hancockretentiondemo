export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || 'Hancock Health',
  tagline: import.meta.env.VITE_BRAND_TAGLINE || 'Health Care As Unique As You.',
  product: import.meta.env.VITE_PRODUCT_NAME || 'Workforce Intelligence',
  // Official Hancock Health logo (mark and wordmark) in public/brand/logo.png.
  // The logo already contains the name, so the text name is hidden by default.
  logoUrl: import.meta.env.VITE_BRAND_LOGO_URL || '/brand/logo.png',
  showName: (import.meta.env.VITE_BRAND_SHOW_NAME || 'false') === 'true',
  poweredBy: import.meta.env.VITE_POWERED_BY ?? 'Powered by PrognostiCare',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || '',
};
