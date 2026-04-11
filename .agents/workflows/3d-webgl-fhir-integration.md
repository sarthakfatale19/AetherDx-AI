---
description: Integrate 3D WebGL Framework into FHIR Inference
---

# 3D WebGL FHIR Integration Workflow

This workflow documents the process of integrating the immersive AetherDx 3D Anatomical Viewer into any FHIR/ABHA-driven AI Inference pipeline within the platform.

### Step 1: Initialize the Dynamic Import
Inject the `AnatomicalModel3D` canvas via Next.js dynamic client boundary into the target results dashboard. This prevents SSR hydration mismatches.

```javascript
import dynamic from "next/dynamic";

const AnatomicalModel3D = dynamic(
  () => import("@/components/viz/AnatomicalModel3D"), 
  { ssr: false }
);
```

### Step 2: Establish the Wide-Layout Dashboard
Ensure the parent component's wrapper breaks standard size confines to give the 3D model proper room to breathe.
Change `max-w-lg` to standard dashboard width (`max-w-4xl`) and set up a two-column `grid` or `flex` setup where the 3D viewer takes the left lane.

### Step 3: Implement the Volumetric Canvas
Provide the `AnatomicalModel3D` a dedicated constrained container block (`minHeight: 400px`) using absolute/relative positioning. Overlay necessary UI signals.

```javascript
<div className="rounded-2xl overflow-hidden relative" style={{ minHeight: "400px" }}>
    <div className="absolute inset-0">
        <AnatomicalModel3D />
    </div>
</div>
```

### Step 4: Map SHAP & Inference Props natively
Pipe the backend ML data (e.g., Risk Tier from probability mapping or the actual SHAP waterfall attributes) into the properties of the component.

```javascript
<AnatomicalModel3D 
  riskTier={tier as "HIGH" | "MODERATE" | "LOW"} 
  condition={topPred?.condition || "Healthy"}
  probability={score}
  contributingFactors={shap_explanation?.waterfall?.map((w: any) => w.feature) || []}
/>
```

### Step 5: Verify Interaction States
Check that your component is passing valid UI feedback—so if the user's fetched FHIR records highlight issues around high blood pressure, the 3D engine accurately visualizes tracking along those pathways.
