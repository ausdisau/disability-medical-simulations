# Noah ICU integration

The new feature is self-contained under `src/features/cardiopulmonary/` and needs React/React DOM only at runtime. Import its default component:

```tsx
import NoahICU from './features/cardiopulmonary/NoahICU';

export default function App() {
  return <NoahICU />;
}
```

The component imports its scoped styles. The engine has no browser dependency: `createModel`, `advanceModel`, `normalizeSettings`, `normalizeParameters`, and `deliverManualBreath` are pure numerical APIs. The bedside runtime supplies evidence and agreement gates separately.

Call `advanceModel(state, settings, parameters, 0)` after explicit source/circulation input changes while paused to synchronize sensor and activity flags without consuming time. Call `deliverManualBreath` once per accepted activation; it queues a timed inspiration. Advancing time is a separate operation. Never infer arrest from a diagnosis or isolated number, and do not interpret compression flow as ROSC.

The feature does not read external files, personal health records, secrets or a device stream. Exports are deliberate browser downloads. Network connectors are separate authoring tools, not runtime dependencies.

The public GitHub contribution is an independent `apps/noah-icu-lab` package rather than a replacement for the repository's existing runtime. It excludes the original attachments, legacy desktop code, hosting project identity and FormHug owner-specific links. Its lockfile pins the versions actually used for the verified build.

See `docs/NOAH_ICU_GUIDE.md` for interaction details and the runtime `MODEL.md` for numerical assumptions. Source alterations require targeted verification of changed behavior; formal training content requires clinical and disability-led review.
