# Frontend asset license audit (PLAN-0014)

Date: 2026-07-31  
Scope: `apps/frontend/public` and referenced remote media in the Emergent snapshot.

## Findings

| Asset class | Location / usage | License / provenance note | Action |
|---|---|---|---|
| App icons / favicon | `public/` CRA defaults and snapshot assets | Inherited from Emergent snapshot; treat as product-owned after import | Keep; replace if licensing becomes unclear before public marketing use |
| Recipe / pantry imagery | Remote URLs embedded in mock fixtures (`src/lib/mockData.js`) | Third-party stock/demo URLs used only for mock prototype | Do not ship mock remote imagery as production marketing assets without replacement or explicit license |
| UI icons | `lucide-react` | ISC | Keep |
| Fonts | CSS / Tailwind stack from snapshot | Verify webfont licenses when swapping to production brand fonts | Document any future font license in this file |

## Conclusion

No secret credentials or Emergent private assets were found in `public/`. Mock remote images remain prototype-only and must not be treated as cleared production photography. A follow-up plan should replace fixture imagery before a public marketing launch.
