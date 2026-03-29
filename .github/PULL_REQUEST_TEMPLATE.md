## Summary

<!-- What does this PR do? Keep it brief (1-3 sentences). -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Refactor (no functional change)
- [ ] Documentation / translation update
- [ ] Data update (toolsData, mbcData, etc.)
- [ ] Dependency update

## Related Issues

<!-- Closes #123 -->

## Changes

<!-- List the key changes made. -->

-

## Checklist

- [ ] `npm run lint` — no errors
- [ ] `npm run typecheck` — no errors
- [ ] `npm run build` — build succeeds
- [ ] Manual testing in browser (describe below)

**Tested:** <!-- What did you test and how? -->

## Architecture

- [ ] No file exports both React components and non-component utilities (HMR rule)
- [ ] Hook imports use `@/hooks/*`, not `@/contexts/*`
- [ ] New utilities placed in `src/lib/` (not inside component files)

## Translations

- [ ] No user-visible strings added
- [ ] New strings added to both `en.ts` and `vn.ts`

## Screenshots

<!-- For UI changes, include before/after screenshots. -->

## Notes for Reviewer

<!-- Anything the reviewer should pay special attention to? -->
