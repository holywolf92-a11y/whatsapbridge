# Backend PR: Add signed photo URLs to candidates list

Goal: Ensure `GET /api/candidates` includes `profile_photo_signed_url` for each candidate when a profile photo exists, matching the behavior of `GET /api/candidates/:id`.

## Summary
- Generate a time-limited Supabase signed URL for each candidate that has `profile_photo_path` (preferred) or a derivable path from `profile_photo_url`.
- Attach `profile_photo_signed_url` to each candidate object returned by the list endpoint.
- TTL: 10 minutes (consistent with single-candidate endpoint).

## Suggested Changes (TypeScript / Node + Express)

Assuming controller file: `src/controllers/candidateController.ts`

```ts
// imports used elsewhere in controller
import { supabaseClient } from '../lib/supabase';

async function signPhotoPath(profile_photo_path?: string | null, profile_photo_url?: string | null): Promise<string | undefined> {
  try {
    let path = profile_photo_path || '';
    if (!path && profile_photo_url) {
      // Derive storage path if URL is a public path to the same bucket
      // Example: https://<proj>.supabase.co/storage/v1/object/public/documents/<id>/profile.jpeg
      const idx = profile_photo_url.indexOf('/object/public/');
      if (idx > -1) {
        path = profile_photo_url.split('/object/public/')[1];
      }
    }
    if (!path) return undefined;

    const [bucket, ...segments] = path.split('/');
    const objectPath = segments.join('/');
    if (!bucket || !objectPath) return undefined;

    const { data, error } = await supabaseClient
      .storage
      .from(bucket)
      .createSignedUrl(objectPath, 600); // 10 minutes

    if (error || !data?.signedUrl) return undefined;
    return data.signedUrl;
  } catch {
    return undefined;
  }
}

export const listCandidatesController = async (req: Request, res: Response) => {
  const { results, pagination } = await candidateService.listCandidates(/* existing args */);

  const enriched = await Promise.all(results.map(async (c) => {
    const signedUrl = await signPhotoPath(c.profile_photo_path, c.profile_photo_url);
    return { ...c, profile_photo_signed_url: signedUrl };
  }));

  res.json({
    candidates: enriched,
    pagination,
  });
};
```

## Notes
- Do not mutate DB. Only enrich the response.
- If signing fails, omit the field (UI already falls back to `profile_photo_url`).
- Keep TTL short; UI re-requests data frequently.

## Checklist
- [ ] Add unit test for list controller: when `profile_photo_path` exists, response includes `profile_photo_signed_url`.
- [ ] Confirm no performance issues for typical page sizes (consider batching if needed).
- [ ] Deploy to prod via Railway; verify candidates list includes signed URLs.

## Verification
After deploy, run:

```bash
# 1) List candidates and confirm field present
curl -s "$API_BASE/api/candidates?search=Usman" | jq '.candidates[] | {name, profile_photo_url, profile_photo_signed_url}'

# 2) Validate signed URL is accessible (200 OK)
URL=$(curl -s "$API_BASE/api/candidates?search=Usman" | jq -r '.candidates[] | select(.name | test("USMAN"; "i")) | .profile_photo_signed_url' | head -n1)
[ -n "$URL" ] && curl -I "$URL" | head -n1
```
