Plan:

1. Update the hero intro block in `src/routes/dashboard.tsx` so the status pill is anchored as a normal left-aligned block instead of relying on `inline-flex` behavior.
2. Compensate for the visible whitespace inside the logo image by applying a small negative left offset to the large hero logo/glow only, so the logo, status pill, paragraph, and AI-runs line visually share the same left edge.
3. Verify the dashboard hero at the current desktop viewport to confirm the elements line up visually without shifting the surrounding layout.