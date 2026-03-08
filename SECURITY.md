# Security Policy & Guidelines

*This document has been updated to reflect the project's "Bring Your Own Key" (BYOK) architecture.*

## Overview
This document outlines the security policies, best practices, and architecture for CodeFlow AI. The application is designed to allow users to bring their own API key, which is handled securely on the client-side and for each serverless AI request.

## Security Model: Bring Your Own Key (BYOK)

### 1. **API Key Storage & Handling**
- **Issue**: Storing API keys in `localStorage` is vulnerable to Cross-Site Scripting (XSS) and persists indefinitely.
- **Fix**: The application now uses `sessionStorage` for key management.
  - **Benefit**: Keys are automatically cleared when the browser tab is closed.
  - **Defense-in-Depth**: The application actively removes any legacy keys that might have been stored in `localStorage`.
- **Note**: The key is sent from the client with each AI request. This is a fundamental part of the BYOK model.

### 2. **Secure API Key Transmission**
- **Issue**: Passing the API key as part of the main prompt input could cause it to be logged or exposed.
- **Fix**: The API key is passed in a separate `config` object for each Genkit flow request.
- **Impact**: This ensures the key is used for authentication with the AI provider but is not treated as part of the user's prompt content.

### 3. **Input Validation and Sanitization**
- **File Path Validation**: To prevent directory traversal attacks, all file paths provided in AI operations are strictly validated. Any paths containing `../`, `~`, or null bytes are rejected.
- **File Size & Count Limits**: To prevent resource abuse, analysis requests are limited to a maximum of 50 files and a total size of 500KB.
- **API Key Validation**: A basic client-side check ensures the API key has a plausible minimum length before it is used.

### 4. **Build-Time Security**
- **Issue**: Disabling TypeScript error checking (`ignoreBuildErrors: true` in `next.config.js`) can hide bugs and potential security issues.
- **Fix**: TypeScript error checking is enabled for all builds to catch issues early.

### 5. **Dependency Vulnerability Management**
- **Auditing**: The project is regularly scanned with `npm audit` to identify and fix vulnerabilities in third-party packages.
- **Maintenance**: Dependencies, especially `genkit` and `next`, are kept up to date to receive the latest security patches.

## Reporting a Vulnerability
To report a vulnerability, please email us at **[email protected]** with a detailed description of the issue, the steps to reproduce it, and the potential impact.

## Future Security Recommendations

While the BYOK model has been hardened, the highest level of security is achieved by moving key management to a server-side proxy. The following are recommendations for a future production-grade version:

1.  **Server-Side Proxy**: Implement a backend proxy for all AI API calls.
    - This would completely eliminate client-side key exposure.
    - It enables centralized rate-limiting, logging, and monitoring.
2.  **User Authentication**: Add a user authentication layer (e.g., OAuth2/OIDC).
    - This allows for per-user rate limiting, usage tracking, and quotas.
3.  **Stricter Content Security Policy (CSP)**: Implement a more robust CSP in `next.config.js` to restrict connections and scripts to only trusted domains.
4.  **HTTPS Enforcement**: Ensure all production traffic is encrypted with HTTPS and HSTS headers.
