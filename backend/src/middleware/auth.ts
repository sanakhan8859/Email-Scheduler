import { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Always proceed, but attach user if authenticated
  next();
};
