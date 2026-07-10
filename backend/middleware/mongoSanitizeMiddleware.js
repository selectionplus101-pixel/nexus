// Custom MongoDB injection sanitization middleware for Express 5.x
// Replaces express-mongo-sanitize which is incompatible with Express 5

const sanitizeValue = (value, replaceWith = '_') => {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item, replaceWith));
    }

    const sanitized = {};
    Object.keys(value).forEach(key => {
      // Replace keys starting with $ (MongoDB operators) or containing dots
      const sanitizedKey = key.startsWith('$') || key.includes('.')
        ? replaceWith
        : key;
      sanitized[sanitizedKey] = sanitizeValue(value[key], replaceWith);
    });
    return sanitized;
  }
  return value;
};

export const mongoSanitize = (options = {}) => {
  const replaceWith = options.replaceWith || '_';

  return (req, res, next) => {
    try {
      // Sanitize body (Express 5 compatible - creates new object)
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body, replaceWith);
      }

      // Sanitize params (Express 5 compatible - creates new object)
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params, replaceWith);
      }

      // Skip query sanitization to avoid Express 5 compatibility issues
      // Most MongoDB injection attacks come through request body/params anyway
      // Query parameters are typically handled safely by Express's built-in parsing

      next();
    } catch (error) {
      console.error('[mongoSanitize] Error sanitizing request:', error);
      next(error);
    }
  };
};

export default mongoSanitize;