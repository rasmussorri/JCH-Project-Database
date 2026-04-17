# Samsung QM32R-T Info Screen Capabilities & Optimizations

## Hardware Specifications
- **Firmware Reference**: MAIN ver. 2460.1 (Latest update)
- **Operating System**: Tizen 4.0 / Samsung Smart Signage Platform (SSSP 6.0)
- **Processor (SoC)**: ARM Cortex-A72 Quad-Core processor @ up to 1.7 GHz
- **RAM**: 2.5 GB LPDDR4
- **Storage**: 8 GB Flash Memory (~3.88 GB occupied by Tizen OS)
- **Browser Engine**: Chromium 56 (Early 2017)

## Performance Implications
With Chromium 56 running on an ARM Cortex-A72 SoC with limited usable RAM, web applications face several compounding bottlenecks that cause noticeable latency and crashing:

1. **JavaScript Execution (V8 Engine)**: The V8 engine version corresponding to Chromium 56 lacks optimizations for modern Javascript paradigms stringently used by React. Heavy client-side rendering, deep component trees, and complicated reconciliation cause high CPU usage and significant event-loop blocking, leading to massive interaction latency.
2. **Rendering Constraints**: Chromium 56 struggles with modern CSS rendering logic. Complex layout engines, pseudo-classes like `:has()`, and heavy styling tokens (`color-mix`, `oklch`) are either entirely unsupported or partially functional. These will either be discarded or, if forced via polyfills, intensely slow down frame rendering.
3. **GPU & Compositor Weakness**: Features like `backdrop-filter: blur`, heavy z-index stacking, complex DOM overlays, and large CSS `box-shadow` values require heavy GPU compositing. The SoC's integrated graphics processing provides limited rasterization capabilities. Using these can cause framerate drops or out-right compositor crashes (e.g. rendering a black screen when keyboards or modals open).
4. **RAM Limitations**: Out of the 2.5 GB of RAM, a large chunk is sequestered for Tizen's background processes and digital-signage orchestration. Meaning, the actual RAM allocated to the browser is limited (~1 GB). Memory leaks or continuous JS memory allocation common in Single Page Applications will quickly induce an Out-Of-Memory (OOM) error or force the browser to silently crash/reload.

## Development Recommendations for Legacy Support
To resolve latency and UX degradation for this specific capability profile, continue tailoring the `isCompatibilityMode` with these best practices:

- **Disable CPU-Intensive Visuals**: Completely remove intensive CSS effects (like `backdrop-filters`, animations relying on anything other than GPU accelerated transforms/opacity) and heavy DOM repainting in compatibility mode. Flat, solid hex colors are extremely performant.
- **Utilize Lightweight Primitives**: JS-centric scroll containers (like standard Radix scroll implementations) drastically slow down rendering performance on older SOCs by manually calculating scroll positions and translating layouts. Always resort to the browser's native scrolling (`overflow-y: auto`) on legacy environments.
- **Pre-compress Assets**: Static displays with minimal rendering should be preferred over Javascript-driven layouts like carousels. Don't serve heavy image variants that the device then has to calculate scaling for. 
- **Strict Polyfill Adherence**: Make sure the Vite `@vitejs/plugin-legacy` target remains focused on generating older ES build targets (i.e. `targets: ['ie >= 11']` or `chrome >= 56`) to ensure modern JS syntactic sugar (Optional Chaining, Nullish Coalescing) is explicitly transpired prior to shipment, effectively offloading these operations to build-time overhead instead of client-time run execution.
- **Reconsider Virtual DOM Depth**: When optimizing complex components (like modals or large lists), avoid deeply nested DOM hierarchies. A shallower DOM reduces memory usage and speeds up CSS selector matching within an older browser engine like Chromium 56.
