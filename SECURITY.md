# Security Policy

## Supported Versions

Only the latest release receives security updates.

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ |
| < 1.0 | ❌ |

## Scope

MalFrame is a **client-side only** web application — all data stays in your browser (IndexedDB for case data, localStorage for settings and UI state). There is no backend server, no database, and no user accounts.

**In scope:**
- XSS vulnerabilities in the UI
- Unsafe handling of user-supplied input (file hashes, IOC values, notes)
- Malicious content injection via JSON import
- Dependency vulnerabilities with realistic exploit paths
- Build-time supply chain issues

**Out of scope:**
- Issues requiring physical access to the user's machine
- Self-XSS (user injecting into their own browser)
- Theoretical vulnerabilities with no realistic attack path

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report privately via one of the following:

1. **GitHub Private Advisory** (preferred):
   [https://github.com/MWE-HaTN/MalFrame/security/advisories/new](https://github.com/MWE-HaTN/MalFrame/security/advisories/new)

### What to Include

- Description of the vulnerability and its potential impact
- Steps to reproduce
- Affected version(s)
- Any suggested mitigations

### Response Timeline

- **Acknowledgement**: Within 72 hours
- **Initial assessment**: Within 7 days
- **Fix or mitigation**: Depends on severity; critical issues are prioritized

## Dependency Vulnerabilities

Run `npm audit` to check for known vulnerabilities in dependencies. Pull requests that address `npm audit` findings are welcome.
