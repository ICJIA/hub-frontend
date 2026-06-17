export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  preview: {
    enabled: false,
    config: {
      // …
      async handler(uid, { documentId, locale, status }) {
        const document = await strapi.documents(uid).findOne({ documentId });
        const pathname = getPreviewPathname(uid,status, { locale, document });
       strapi.log.info("Preview pathname:", pathname);
        return `${env('PREVIEW_URL')}${pathname}`
      },
    }
  },
});

function getPreviewPathname(uid,status, parameter ) {

 var locale = parameter.locale;
 var document = parameter.document;
  var id  = document.id;
  
  // Handle different content types with their specific URL patterns
  switch (uid) {

    case "api::article.article": {
      if (!id) {
        return "/previewreadonly"; // Blog listing page
      }
      return `/previewreadonly/${id}?status=${status}`; // Individual article page
    }
    default: {
      return null;
    }
  }
};


