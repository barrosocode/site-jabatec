/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly EMAILJS_SERVICE_ID: string;
  readonly EMAILJS_TEMPLATE_ID: string;
  readonly EMAILJS_PUBLIC_KEY: string;
  readonly EMAILJS_PRIVATE_KEY: string;
  readonly RECAPTCHA_SECRET_KEY: string;
  readonly PUBLIC_RECAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
