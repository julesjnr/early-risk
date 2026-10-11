# 10. Limitations and future work

## Current limitations

- **Rule-based and not clinically validated:** the risk engine is a small set of hand-coded point rules. It must not be used as a diagnosis or relied on for treatment decisions.
- **Limited conditions:** only type 2 diabetes, heart disease, and high blood pressure are scored. Cancer risk is **not implemented**.
- **No account recovery:** password reset and email verification are **not implemented**.
- **No explicit consent workflow:** a dedicated consent screen or stored consent record is **not implemented**.
- **English-only interface:** other languages, including Swahili, are **not implemented**.
- **No generated PDF:** the user can open the browser print dialog; PDF report generation is **not implemented**.
- **No audit trail:** user role changes and staff review access are not recorded in an audit log.
- **Mock is not secure storage:** `client/src/mock.ts` keeps passwords in plain text in browser localStorage. Mock mode is for demonstrations only and is not suitable for real users or real health data.
- **No retention or deletion workflow:** assessments remain stored until removed directly from the database; retention automation and user-facing deletion are **not implemented**.
- **No model/version tracking:** assessment rows store inputs and results but do not store the scoring-rule version.
- **Client and server scoring copies:** mock scoring is duplicated in `client/src/mockScoring.ts`; automated parity checking is **not implemented**.
- **Operational controls are absent:** deployment configuration, monitoring, backups, incident response, and production database TLS settings are **not implemented** by the source repository.
- **No automated frontend tests:** the client has build and typecheck scripts but no configured automated UI test suite.

## Prioritised future work

The following is proposed work, not current functionality.

1. **Clinical and privacy review before real-patient deployment.** Validate the scoring rules with qualified clinicians and assess legal basis, consent, data minimisation, retention, hosting, and security requirements.
2. **Improve account and operational security.** Validate JWT claims, set database-level role constraints, validate route IDs, add audit logging, and document secure production topology, TLS, backups, and incident response.
3. **Add consent management.** Provide clear notices and record consent or other applicable lawful basis and relevant user choices.
4. **Build and validate an ML model using a suitable public dataset.** Confirm dataset licensing, representativeness, quality, evaluation, explainability, and clinical approval before considering a model in production. Replacing scoring is **not implemented**.
5. **Add Swahili support.** Translate and review all user-facing wording with appropriate language and clinical expertise.
6. **Generate downloadable PDF reports.** The current implementation only invokes browser printing.
7. **Add audit logging.** Record sensitive staff access and administrative role changes, with appropriate retention and access controls.
8. **Add password recovery and email verification.**
