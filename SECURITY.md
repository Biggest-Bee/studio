# Security Policy

This document outlines the security policies and procedures for this project.

## Reporting a Vulnerability

To report a vulnerability, please email us at [email protected] with a detailed description of the issue, the steps to reproduce it, and the potential impact.

## Security Best Practices

*   **API Key Management**: Never commit API keys to version control. Use environment variables to store sensitive information.
*   **Content Security Policy (CSP)**: The current CSP is restrictive to prevent XSS attacks. Any new external resources must be added to the policy in `next.config.js`.
*   **Incident Response**: In the event of a security breach, we will notify affected users within 72 hours. We will also provide a post-mortem analysis of the incident and the steps taken to prevent it from happening again.

## Future Security Recommendations

*   Implement a server-side proxy for all API calls to avoid exposing API keys to the browser.
*   Add user authentication (e.g., OAuth2/OIDC) to track usage and enforce per-user rate limiting.
*   Enhance monitoring and logging to detect and alert on unusual patterns and potential abuse.
*   Implement Subresource Integrity (SRI) for all external scripts and stylesheets.
*   Use a secrets management solution like AWS Secrets Manager or Google Secret Manager to store and rotate API keys.
