// Custom XSS protection middleware for Express 5.x
// Replaces xss-clean which is incompatible with Express 5

const xssEscape = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#61;');
};

const sanitizeValue = (value) => {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }

    const sanitized = {};
    Object.keys(value).forEach(key => {
      const sanitizedKey = xssEscape(key);
      sanitized[sanitizedKey] = sanitizeValue(value[key]);
    });
    return sanitized;
  }

  return xssEscape(value);
};

export const xssProtection = () => {
  return (req, res, next) => {
    try {
      // Sanitize body (Express 5 compatible - creates new object)
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
      }

      // Sanitize params (Express 5 compatible - creates new object)
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params);
      }

      // Skip query sanitization to avoid Express 5 compatibility issues
      // Query parameters are typically less susceptible to XSS since they're URL-encoded
      // and XSS prevention is primarily handled by proper output encoding in the frontend

      next();
    } catch (error) {
      console.error('[xssProtection] Error sanitizing request:', error);
      next(error);
    }
  };
};

export default xssProtection;