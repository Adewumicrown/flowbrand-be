Here is the lean, updated version of your PR. I removed all the unchecked boxes so it looks much cleaner and updated the testing section with exactly what you did.

---

### **PR Title**

`ci(security): harden TruffleHog scan and pin Trivy version`

---

# Pull Request

## Description

This PR hardens `_security.yml` pipeline by ensuring that if a scanning tool crashes, it fails the build and is not swallowed.

**Key updates:**

* **TruffleHog:** Replaced the `|| true` trap with explicit exit code capturing (`set +e`). Actual crashes (any exit code other than 0 or 1) will now fail the pipeline loudly.
* **JSON Validation:** Added a `jq` pre-validation step to prevent cryptic parsing errors if TruffleHog outputs plaintext crash logs instead of JSON.
* **Artifact Upload:** Ensured the TruffleHog report is always uploaded (`if: always()`) even if the step fails.
* **Trivy Stability:** Pinned `trivy-action` to `v0.36.0` (removed `@master`) to protect our pipeline from upstream breaking changes.

## Related Issue

N/A

## Type of Change

* [x] fix: Bug fix *(prevents silent CI passes on tool crash)*
* [x] ci: CI configuration changes

## How Has This Been Tested?

* [x] Manual tests: Manually triggered the workflow action for the security pipeline and verified that it successfully passed.

## Test Evidence

*(Attach a screenshot of the GitHub Actions green checkmark from your manual run here)*

## Checklist

* [x] My code follows the project's coding style
* [x] I have commented my code, particularly in hard-to-understand areas *(Added inline comments explaining exit codes and dev dep tradeoffs)*
* [x] My changes generate no new warnings
* [x] New and existing unit tests pass locally with my changes
* [x] Any dependent changes have been merged and published

## Additional Notes

* **NPM Audit:** Documented the `--omit=dev` trade-off inline. We are intentionally excluding dev dependencies (like Webpack/Jest) to reduce noise, accepting the minor risk of dev-dep vulnerabilities on the runner.
