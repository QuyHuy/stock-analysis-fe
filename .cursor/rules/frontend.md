# Frontend Rules

## Tech Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Shadcn UI components (in components/ui/ — DO NOT manually edit these)
- Firebase Auth + Firestore client SDK
- Axios for API calls (with Firebase token auto-injection via lib/api.ts)
- Recharts for stock charts
- lucide-react for icons

## Conventions
- All pages in app/ directory — use App Router (not Pages Router)
- Add "use client" directive ONLY on components that use hooks, events, or browser APIs
- Server Components by default where possible (no "use client" needed)
- Protected routes: wrap in app/(dashboard)/layout.tsx which checks useAuth()
- Components organized by feature: components/chat/, components/stocks/, etc.
- lib/ for utilities, hooks, and third-party config
- Never import from components/ui/ with relative paths — always use @/components/ui/

## Auth Flow
- Login page: app/(auth)/login/page.tsx
- After login: redirect to /chat
- All API calls include Firebase ID token automatically via lib/api.ts interceptor
- useAuth() hook from lib/auth-context.tsx provides user, loading, logout

## Styling
- Use Tailwind classes only, no inline styles
- Shadcn components first, customize with Tailwind cn() utility
- Dark mode support via class strategy
