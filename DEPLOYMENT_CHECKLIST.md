# W-CSAP Security Deployment Checklist
## Complete Pre-Deployment Security Validation

**Use this checklist before deploying to production to ensure all security measures are in place.**

---

## ✅ PHASE 1: CRITICAL SECURITY REQUIREMENTS

### 1.1 Secret Key Management
- [ ] W_CSAP_SECRET_KEY is set (not using default)
- [ ] Secret key is at least 64 characters (256 bits)
- [ ] Secret key is stored securely (not in code/version control)
- [ ] Secret key is unique per environment (dev/staging/prod)
- [ ] Secret key rotation schedule is documented
- [ ] Backup of secret key is stored in secure location

**Verification Command:**
```bash
python -c "import os; k=os.getenv('W_CSAP_SECRET_KEY'); print(f'✅ Length: {len(k)}' if k and len(k)>=64 else '❌ NOT SET or TOO SHORT')"
```

---

### 1.2 Redis Configuration
- [ ] Redis is installed and running
- [ ] Redis URL is configured (W_CSAP_REDIS_URL)
- [ ] Redis password is set (requirepass in redis.conf)
- [ ] Redis is bound to localhost or internal network only
- [ ] Redis persistence is enabled (RDB or AOF)
- [ ] Redis maxmemory and eviction policy are configured
- [ ] Redis backup strategy is in place

**Verification Command:**
```bash
redis-cli ping  # Should return PONG
redis-cli CONFIG GET requirepass  # Should show password
```

---

### 1.3 HTTPS/TLS Configuration
- [ ] SSL/TLS certificate is installed and valid
- [ ] W_CSAP_REQUIRE_HTTPS=true is set
- [ ] W_CSAP_REQUIRE_TLS_13=true is set
- [ ] HSTS header is enabled (automatic with security middleware)
- [ ] Certificate auto-renewal is configured (Let's Encrypt)
- [ ] TLS configuration test passed (SSL Labs A+ rating)

**Verification Command:**
```bash
curl -I https://your-domain.com | grep -i "strict-transport"
```

---

## ✅ PHASE 2: AUTHENTICATION SECURITY

### 2.1 DPoP Protection
- [ ] W_CSAP_DPOP_ENABLED=true is set
- [ ] ecdsa library is installed (pip install ecdsa)
- [ ] DPoP signature verification is working
- [ ] Token theft protection is tested

**Verification:**
Test DPoP authentication flow with real wallet signature.

---

### 2.2 Rate Limiting
- [ ] W_CSAP_GLOBAL_RATE_LIMIT_ENABLED=true
- [ ] Rate limits are configured appropriately
- [ ] Lockout duration is reasonable (15 minutes default)
- [ ] Rate limit testing completed (try 10 failed attempts)

**Verification Command:**
```python
# Test rate limiting
for i in range(10):
    response = requests.post("/api/auth/verify", json={
        "challenge_id": "test",
        "signature": "invalid",
        "wallet_address": "0xTest"
    })
    print(f"Attempt {i+1}: {response.status_code}")
# Should see 429 (rate limit) after 5 attempts
```

---

### 2.3 Session Management
- [ ] Sessions are encrypted in Redis (verify no plain-text)
- [ ] Session TTL is appropriate (15 minutes default)
- [ ] Refresh token rotation is enabled
- [ ] Session cleanup is working (automatic via Redis TTL)
- [ ] Revocation is enabled and tested

**Verification:**
```bash
# Check Redis - all values should be encrypted
redis-cli KEYS "wcsap:session:*"
redis-cli GET "wcsap:session:xxxxx"  # Should see encrypted binary data
```

---

## ✅ PHASE 3: APPLICATION SECURITY

### 3.1 Security Headers
- [ ] All OWASP security headers are present
- [ ] CSP (Content-Security-Policy) is configured
- [ ] X-Frame-Options is set to DENY
- [ ] X-Content-Type-Options is set to nosniff
- [ ] Server header is removed

**Verification:**
```bash
curl -I https://your-domain.com/api/health
# Should see all security headers
```

---

### 3.2 CSRF Protection
- [ ] CSRF middleware is enabled
- [ ] CSRF tokens are generated on requests
- [ ] CSRF validation is working
- [ ] Exempt paths are correctly configured

**Verification:**
Try POST request without CSRF token - should return 403.

---

### 3.3 Error Handling
- [ ] Production environment is set (ENVIRONMENT=production)
- [ ] Error messages are sanitized (no stack traces)
- [ ] Detailed errors only in logs, not responses
- [ ] 500 errors return generic messages

**Verification:**
Trigger an error and verify response doesn't leak internals.

---

## ✅ PHASE 4: DATABASE SECURITY

### 4.1 File Permissions
- [ ] Database directory has 0700 permissions
- [ ] Database file has 0600 permissions
- [ ] No group/world read permissions
- [ ] Permission verification on startup passes

**Verification:**
```bash
ls -la data/w_csap.db
# Should show: -rw------- (0600)
```

---

### 4.2 SQL Injection Prevention
- [ ] All queries use parameterized statements
- [ ] No string concatenation in SQL
- [ ] Input validation is in place
- [ ] SQL injection testing completed

---

## ✅ PHASE 5: CRYPTOGRAPHY

### 5.1 Encryption
- [ ] AES-256-GCM is used for session encryption
- [ ] PBKDF2 key derivation with 600k iterations
- [ ] Unique nonces for each encryption
- [ ] HMAC tamper detection is in place

---

### 5.2 Signature Verification
- [ ] Fail-closed architecture implemented
- [ ] ECDSA signature verification working
- [ ] Constant-time operations used
- [ ] All edge cases handled

---

### 5.3 Timing Attack Prevention
- [ ] Session validation uses constant-time operations
- [ ] HMAC comparisons use hmac.compare_digest()
- [ ] Minimum execution time guarantee (5ms)
- [ ] No information leakage through timing

---

## ✅ PHASE 6: MONITORING & LOGGING

### 6.1 Audit Logging
- [ ] W_CSAP_AUDIT_LOGGING_ENABLED=true
- [ ] All authentication events are logged
- [ ] Logs include timestamp, IP, user agent
- [ ] Log retention policy is defined
- [ ] Logs are shipped to SIEM/logging service

---

### 6.2 Health Monitoring
- [ ] /api/health endpoint is working
- [ ] Health checks include all components
- [ ] Monitoring alerts are configured
- [ ] Uptime monitoring is in place

**Verification:**
```bash
curl https://your-domain.com/api/health | jq
```

---

### 6.3 Security Monitoring
- [ ] Rate limit violations are monitored
- [ ] Failed authentication attempts are tracked
- [ ] Lockout events are alerted
- [ ] KMS access is monitored (if enabled)
- [ ] Anomaly detection is configured

---

## ✅ PHASE 7: INFRASTRUCTURE SECURITY

### 7.1 Network Security
- [ ] Firewall configured (only 443 exposed)
- [ ] WAF is enabled (Cloudflare/AWS WAF)
- [ ] DDoS protection is active
- [ ] VPN access for admin operations
- [ ] Internal services not exposed to internet

---

### 7.2 System Security
- [ ] OS is updated and patched
- [ ] Unnecessary services are disabled
- [ ] System logs are monitored
- [ ] Intrusion detection is configured
- [ ] Regular security scans scheduled

---

### 7.3 Backup & Recovery
- [ ] Database backups are automated
- [ ] Redis backups are configured
- [ ] Backup encryption is enabled
- [ ] Disaster recovery plan is documented
- [ ] Recovery testing is performed

---

## ✅ PHASE 8: COMPLIANCE & DOCUMENTATION

### 8.1 Security Documentation
- [ ] Security architecture is documented
- [ ] Threat model is created
- [ ] Incident response plan is written
- [ ] Security policies are defined
- [ ] Security training is completed

---

### 8.2 Compliance
- [ ] OWASP Top 10 compliance verified
- [ ] NIST guidelines followed
- [ ] GDPR requirements met (if applicable)
- [ ] PCI DSS requirements met (if applicable)
- [ ] Industry-specific compliance checked

---

### 8.3 Testing
- [ ] Unit tests pass (100% for security modules)
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Penetration testing completed
- [ ] Load testing completed

---

## ✅ PHASE 9: DEPLOYMENT

### 9.1 Pre-Deployment
- [ ] All dependencies installed (pip install -r requirements.txt)
- [ ] Environment variables set correctly
- [ ] Configuration validated (no warnings)
- [ ] Security initialization passes
- [ ] Smoke tests pass

---

### 9.2 Deployment
- [ ] Zero-downtime deployment strategy
- [ ] Rollback plan prepared
- [ ] Monitoring dashboard ready
- [ ] On-call team notified
- [ ] Deploy during low-traffic window

---

### 9.3 Post-Deployment
- [ ] Health checks pass
- [ ] All security components active
- [ ] Error rate is normal
- [ ] Performance metrics are acceptable
- [ ] Security monitoring alerts are working

---

## ✅ PHASE 10: ONGOING SECURITY

### 10.1 Regular Tasks
- [ ] Weekly security log review
- [ ] Monthly dependency updates
- [ ] Quarterly penetration testing
- [ ] Biannual security audit
- [ ] Annual disaster recovery drill

---

### 10.2 Security Maintenance
- [ ] Monitor CVE databases for vulnerabilities
- [ ] Update dependencies promptly
- [ ] Rotate secrets every 90 days
- [ ] Review and update security policies
- [ ] Conduct security training

---

## 📊 DEPLOYMENT SCORE

**Calculate your deployment readiness:**

- Critical Requirements (Phase 1): ___/18 ✅
- Authentication Security (Phase 2): ___/12 ✅
- Application Security (Phase 3): ___/12 ✅
- Database Security (Phase 4): ___/7 ✅
- Cryptography (Phase 5): ___/9 ✅
- Monitoring (Phase 6): ___/12 ✅
- Infrastructure (Phase 7): ___/15 ✅
- Compliance (Phase 8): ___/14 ✅
- Deployment (Phase 9): ___/14 ✅
- Ongoing Security (Phase 10): ___/10 ✅

**TOTAL: ___/123**

### Deployment Decision Matrix:

- **120-123 (97%+):** ✅ **READY FOR PRODUCTION**
- **110-119 (89-96%):** ⚠️ **READY WITH MINOR ITEMS**
- **90-109 (73-88%):** ⛔ **NOT READY - Complete critical items**
- **<90 (<73%):** 🚫 **DO NOT DEPLOY - Major gaps exist**

---

## 🚨 CRITICAL: DO NOT DEPLOY IF...

- [ ] W_CSAP_SECRET_KEY is not set
- [ ] Redis is not running or accessible
- [ ] HTTPS is not enabled (production)
- [ ] DPoP is disabled (production)
- [ ] Rate limiting is disabled
- [ ] Database permissions are insecure
- [ ] Security tests are failing

---

## ✅ FINAL SIGN-OFF

**Security Team Approval:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

**Engineering Team Approval:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

**DevOps Team Approval:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

---

## 📞 EMERGENCY CONTACTS

**Security Incidents:**
- Email: security@gigchain.io
- Phone: ___________________
- Slack: #security-incidents

**On-Call Engineer:**
- Phone: ___________________
- Slack: @oncall-engineer

**Infrastructure Team:**
- Email: devops@gigchain.io
- Phone: ___________________

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Next Review:** January 12, 2026

---

**Note:** This checklist should be completed for EVERY production deployment.
Keep a signed copy for compliance and audit purposes.
