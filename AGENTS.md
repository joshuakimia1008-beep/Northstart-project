<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep the public tour experience on the index route, with the tour schedule in a shared browser-safe module so factual dates can be tested independently.
- Events, logo and footer video live in Lovable Cloud (events, site_settings, private media bucket read via signed URLs); the admin is managed at /admin and the first two signed-up accounts become admins; later admins are approved or removed by existing admins via security-definer functions that check the caller is admin — public buckets are blocked by workspace policy.
