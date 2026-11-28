window.CRESCENT_CONFIG = {
  // POST endpoint for the lead form (CRM, Make / Zapier webhook, etc).
  // Empty = nothing is sent anywhere: the form hands the details to WhatsApp instead, so no lead is lost.
  formEndpoint: '',

  // Google Tag Manager (GTM-P6FFFH9H) is added to every page by Netlify snippet injection.
  // Leave gtmId empty so a second container is not injected here.
  gtmId: '',

  // GA4 / Ads tags copied from crescentcarcheck.com. They load on a real domain only, never on localhost.
  // If the same tags are set up inside the GTM container, empty these to avoid double counting.
  ga4Id: 'G-T6Q80DJJ33',
  adsId: 'AW-18241741781',

  // Google Ads conversion labels (Goals > Conversions > the action > Tag setup).
  // Empty = dataLayer events only: whatsapp_form_open, whatsapp_click, call_click, form_submit, popup_open.
  // whatsapp_click fires when the visitor continues to WhatsApp, after the details form.
  conversions: { whatsapp: '', call: '', form: '' },

  // Callout popup: shown once per visit, after this delay, 40% scroll or exit intent on desktop.
  popupDelayMs: 10000,

  // "Read all reviews on Google" link under the reviews slider. Empty = link hidden.
  // Use the Google Business Profile share link (Google Maps > the business > Share > Copy link).
  googleReviewsUrl: '',

  whatsapp: '971588425010'
};
