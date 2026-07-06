
# 🚀 Pre-Deployment Checklist

## ✅ Smart Contract

- [ ] Compiled without errors (`npx hardhat compile`)
- [ ] Tests passing (`npx hardhat test`)
- [ ] No reentrancy vulnerabilities
- [ ] No integer overflows (using SafeMath or Solidity 0.8+)
- [ ] Owner functions properly restricted
- [ ] Events emitted for all state changes

## ✅ Backend

- [ ] Environment variables set in `.env`
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error handling with proper status codes
- [ ] Database connection pooling configured
- [ ] Logging enabled

## ✅ Frontend

- [ ] All environment variables set
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Phantom wallet connect/disconnect flows tested
- [ ] Bet placement flow tested
- [ ] React DevTools warnings resolved

## ✅ Security

- [ ] HTTPS enabled (in production)
- [ ] JWT tokens secure (short expiry, refresh)
- [ ] No sensitive data in localStorage
- [ ] WebSocket connections authenticated
- [ ] Input sanitization on all user inputs

## ✅ Performance

- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] Bundle size checked (< 500KB)
- [ ] Lighthouse score > 90
- [ ] WebSocket reconnection logic

## ✅ Monitoring

- [ ] Error tracking (Sentry/Bugsnag)
- [ ] Analytics (Google Analytics/Plausible)
- [ ] Server monitoring (PM2/Datadog)
- [ ] Database backups configured
- [ ] Log aggregation

