module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'frame-src': ["'self'", 'https://research-hub-dev.netlify.app'],
          // optional, if the iframe loads images/scripts that also get blocked:
          'img-src': ["'self'", 'data:', 'blob:', 'https://research-hub-dev.netlify.app'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
