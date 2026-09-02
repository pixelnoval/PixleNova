/**
 * Input validation utilities.
 * Used by controllers to validate and sanitize incoming request data
 * independently of any ORM or frontend validation.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitizes a string: trims whitespace and removes null bytes.
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\0/g, '');
}

/**
 * Validates and normalizes a contact form submission.
 * Returns { errors, data } — errors is an array of strings,
 * data contains sanitized values.
 */
export function validateContact(body) {
  const errors = [];

  const name = sanitizeString(body?.name ?? '');
  const email = sanitizeString(body?.email ?? '').toLowerCase();
  const message = sanitizeString(body?.message ?? '');

  if (!name) {
    errors.push('Name is required.');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters.');
  } else if (name.length > 100) {
    errors.push('Name must not exceed 100 characters.');
  }

  if (!email) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address.');
  } else if (email.length > 254) {
    errors.push('Email address is too long.');
  }

  if (!message) {
    errors.push('Message is required.');
  } else if (message.length < 10) {
    errors.push('Message must be at least 10 characters.');
  } else if (message.length > 5000) {
    errors.push('Message must not exceed 5000 characters.');
  }

  return {
    errors,
    data: { name, email, message },
  };
}

/**
 * Validates admin login credentials.
 */
export function validateLogin(body) {
  const errors = [];

  const email = sanitizeString(body?.email ?? '').toLowerCase();
  const password = body?.password ?? '';

  if (!email) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (typeof password !== 'string') {
    errors.push('Invalid password format.');
  }

  return { errors, data: { email, password } };
}

/**
 * Validates a contact status update.
 */
const VALID_STATUSES = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];

export function validateStatusUpdate(body) {
  const status = sanitizeString(body?.status ?? '').toUpperCase();

  if (!VALID_STATUSES.includes(status)) {
    return {
      error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      status: null,
    };
  }

  return { error: null, status };
}

/**
 * Validates creating a new Admin.
 */
export function validateCreateAdmin(body) {
  const errors = [];

  const name = sanitizeString(body?.name ?? '');
  const email = sanitizeString(body?.email ?? '').toLowerCase();
  const password = body?.password ?? '';

  if (!name) {
    errors.push('Name is required.');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters.');
  }

  if (!email) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  return { errors, data: { name, email, password } };
}

/**
 * Validates updating an Admin.
 */
export function validateUpdateAdmin(body) {
  const errors = [];

  const name = sanitizeString(body?.name ?? '');
  const email = sanitizeString(body?.email ?? '').toLowerCase();

  if (name && name.length < 2) {
    errors.push('Name must be at least 2 characters.');
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address.');
  }

  return { errors, data: { name, email } };
}

/**
 * Validates admin password reset.
 */
export function validatePasswordReset(body) {
  const errors = [];
  const password = body?.password ?? '';

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  return { errors, data: { password } };
}

/**
 * Validates admin status update.
 */
export function validateAdminStatusUpdate(body) {
  const errors = [];
  let isActive = body?.isActive;

  if (typeof isActive !== 'boolean') {
    if (isActive === 'true') isActive = true;
    else if (isActive === 'false') isActive = false;
    else errors.push('isActive must be a boolean.');
  }

  return { errors, data: { isActive } };
}
