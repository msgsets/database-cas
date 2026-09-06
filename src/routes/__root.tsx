import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import appCss from "../styles.css?url";

const APP_NAME = "Database";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#f5f5f7" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "description",
        content: "把值得留下的，先收进来。",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/icon-192.png?v=3" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=3" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <ServiceWorkerRegister />
        <AuthProvider>
          <Providers>
            <Outlet />
          </Providers>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
