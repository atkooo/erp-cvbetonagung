# Frontend Structure

This prototype is organized to keep navigation, feature screens, and reusable shell components separate.

## Main Folders

- `components/`
  Shared app shell and existing screen components.
- `config/`
  Cross-cutting configuration. `navigation.tsx` is the single source for sidebar menu items and topbar page titles.
- `features/`
  Feature-level prototype screens that are not generic reusable components.
- `types.ts`
  Shared TypeScript contracts used across the prototype.
- `dummyData.ts`
  Mock data for prototype-only views and interactions.

## Adding A New Page

1. Add the view id to `ViewType` in `types.ts`.
2. Add the title and sidebar item to `config/navigation.tsx`.
3. Add the screen component under `components/` or `features/<feature>/`.
4. Register the view in `App.tsx` inside `renderContent`.

Keep prototype-only screens under `features/` when they are large or domain-specific. Keep `components/` for shared layout or established modules.
