import rateLimit from 'express-rate-limit';

// 🚀 Global Rate Limiter: General API abuse prevention
// Stores hit counts in MEMORY (RAM). Does NOT query the Database.
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

// 🔐 Auth Limiter: Brute-force protection for Login/Signup
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/signup attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many login attempts, please try again later.',
    },
});
