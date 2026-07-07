import 'express';

declare global {
  namespace Express {
    // Augmenting `User` (instead of redeclaring `Request.user` with an
    // unrelated shape) keeps this compatible with @types/passport, which
    // also declares `Request.user?: Express.User`. Declaring a second,
    // structurally different `user` property on `Request` would conflict
    // with passport's declaration.
    interface User {
      id: string;
    }
  }
}
