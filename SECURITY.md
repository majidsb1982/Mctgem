# Security policy

MCT can contain sensitive personal information about group members. Treat all production data as confidential.

## Supported versions

Security fixes should target the latest version on the default branch.

## Reporting a vulnerability

Do not publish personal data, access PINs, or exploit details in public issues. Use the repository's private vulnerability reporting feature if enabled; otherwise contact the repository maintainer privately through GitHub.

## Important current limitations

- Application records are stored in the local browser profile and can be exposed to anyone with access to that profile or exported backup.
- The local PIN/role mechanism is not server-enforced authentication and must not be treated as a security boundary against a technically capable user.
- Do not commit real member data, JSON backups, screenshots containing private information, or credentials.
- Cross-device synchronization requires a separate authenticated backend with server-side authorization and conflict handling.
