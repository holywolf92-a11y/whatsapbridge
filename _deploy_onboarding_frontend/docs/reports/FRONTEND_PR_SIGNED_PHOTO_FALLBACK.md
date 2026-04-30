# Frontend PR: Lazy fetch signed profile photos for list view

Goal: Ensure candidate cards render profile photos even when the list API doesn’t include `profile_photo_signed_url` and the raw public URL returns 400.

## Summary
- In `src/components/CandidateManagement_ENHANCED.tsx`, add a small cache and `useEffect` to lazily fetch per-candidate details using `apiClient.getCandidate(id)` for candidates that:
  - have `photo_received = true`,
  - do not have `profile_photo_signed_url` in the list response, and
  - do not already have a cached URL.
- Cache results in component state to avoid repeated calls while scrolling/filtering.
- Cards continue to prefer `profile_photo_signed_url || profile_photo_url` for the `<img src>`.

## Diff (high-level)
- Add `photoUrls` state: `Record<string, string>`
- Add `useEffect` to fetch missing signed URLs and store by candidate id.

## Notes
- This is a mitigation until the backend list endpoint returns `profile_photo_signed_url`.
- Network overhead is limited to candidates missing the field and only once per id per mount.
- Modal (`CandidateDetailsModal.tsx`) already works because single-candidate endpoint includes the signed URL.

## Verification
- Load Candidate Management list; for candidates with private photos, images should appear after a brief fetch.
- Specifically check "Muhammad Usman" card image renders.

## Follow-up
- Once backend returns the field in list response, we can keep this as a nice-to-have fallback (it’s harmless), or remove the `useEffect` to save a few requests.
