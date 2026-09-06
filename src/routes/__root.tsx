import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { BootSplash, BootSplashDismiss } from "@/components/boot-splash";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import appCss from "../styles.css?url";

const APP_NAME = "Database";

const SPLASH = [
  { href: "/splash-1179x2556.png", width: 393, height: 852, dpr: 3 },
  { href: "/splash-1290x2796.png", width: 430, height: 932, dpr: 3 },
  { href: "/splash-1170x2532.png", width: 390, height: 844, dpr: 3 },
  { href: "/splash-1284x2778.png", width: 428, height: 926, dpr: 3 },
  { href: "/splash-1125x2436.png", width: 375, height: 812, dpr: 3 },
] as const;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#ffffff" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      {
        name: "description",
        content: "把值得留下的，先收进来。",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/icon-192.png?v=4" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=4" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      ...SPLASH.map((item) => ({
        rel: "apple-touch-startup-image",
        href: `${item.href}?v=1`,
        media: `screen and (device-width: ${item.width}px) and (device-height: ${item.height}px) and (-webkit-device-pixel-ratio: ${item.dpr}) and (orientation: portrait)`,
      })),
    ],
  }),
  component: () => (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <BootSplash />
        <BootSplashDismiss />
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
