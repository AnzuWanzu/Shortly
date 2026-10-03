export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email or password is incorrect');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super('Verify your email before logging in');
    this.name = 'EmailNotVerifiedError';
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication is required');
    this.name = 'UnauthenticatedError';
  }
}
