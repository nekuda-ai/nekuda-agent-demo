# Security Policy

## 🔒 Reporting Security Vulnerabilities

The nekuda team takes security seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## 📧 How to Report a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
**security@nekuda.ai**

Please include the following information in your report:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## 🚀 Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a more detailed response within 7 days
- We will work on fixing the vulnerability and will keep you informed of our progress
- Once the vulnerability is fixed, we will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## 🛡️ Security Best Practices for This Demo

When using this demo application:

### API Keys
- **Never commit API keys** to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Use separate API keys for development and production

### nekuda SDK Security
- Always use the latest version of the nekuda SDK
- Follow the [nekuda security guidelines](https://docs.nekuda.ai/security)
- Use test mode for development
- Implement proper authentication before production use

### Browser Automation
- Be cautious when running browser automation with real credentials
- Use dedicated test accounts when possible
- Monitor automation logs for suspicious activity
- Implement rate limiting in production

## 📋 Security Checklist for Contributors

Before submitting a PR, ensure:
- [ ] No API keys or secrets in code
- [ ] No hardcoded credentials
- [ ] Dependencies are up to date
- [ ] No sensitive data in logs
- [ ] Input validation is implemented
- [ ] Error messages don't expose sensitive information

## 🔐 Secure Development Guidelines

### Environment Variables
```bash
# Good ✅
API_KEY=os.getenv('NEKUDA_API_KEY')

# Bad ❌
API_KEY="sk_live_1234567890abcdef"
```

### Error Handling
```python
# Good ✅
try:
    process_payment()
except Exception as e:
    logger.error("Payment processing failed")
    return {"error": "Payment failed"}

# Bad ❌
except Exception as e:
    return {"error": str(e)}  # May expose sensitive details
```

### Data Validation
Always validate and sanitize user input:
- Validate data types and formats
- Implement proper bounds checking
- Sanitize data before processing
- Use parameterized queries for any database operations

## 🏗️ Infrastructure Security

This demo is designed for development and testing. For production use:
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Enable CORS policies appropriately
- Implement rate limiting
- Add request/response logging (without sensitive data)
- Use secure session management

## 📚 Additional Resources

- [nekuda Security Documentation](https://docs.nekuda.ai/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## ✅ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest version on the main branch receives security updates.

---

Thank you for helping keep nekuda and our users safe!