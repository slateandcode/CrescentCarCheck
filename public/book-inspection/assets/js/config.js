window.CRESCENT_CONFIG = {
  // POST endpoint for the lead form (CRM, Make / Zapier webhook, etc).
  // Empty = nothing is sent anywhere: the form hands the details to WhatsApp instead, so no lead is lost.
  formEndpoint: '',

  // Tracking: Google Tag Manager GTM-P6FFFH9H is in the <head> of index.html and holds every tag.
  // The page pushes these dataLayer events for GTM triggers (Custom Event):
  //   whatsapp_form_open  a WhatsApp button was tapped and the details form opened
  //   whatsapp_click      details completed, WhatsApp opening (the main conversion)
  //   call_click          a call button was tapped
  //   form_submit         the contact form reached formEndpoint
  //   popup_open          the callout popup was shown
  // Each carries cta_location (or trigger), plus package and emirate where known.

  // Callout popup: shown once per visit, after this delay, 40% scroll or exit intent on desktop.
  popupDelayMs: 10000,

  whatsapp: '971588425010'
};
