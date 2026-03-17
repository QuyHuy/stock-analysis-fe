"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  TrendingUp,
  Bell,
  Bookmark,
  LogOut,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "Hỏi AI", icon: MessageSquare },
  { href: "/stocks", label: "Cổ phiếu", icon: TrendingUp },
  { href: "/watchlist", label: "Danh mục", icon: Bookmark },
  { href: "/alerts", label: "Cảnh báo", icon: Bell },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r flex flex-col bg-muted/30 shrink-0">
        <div className="p-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-primary" />
          <div>
            <p className="font-bold text-sm leading-none">Stock VN</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
              {user.displayName || user.email}
            </p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname.startsWith(href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2.5 h-9",
                  pathname.startsWith(href) && "font-medium"
                )}
              >
                <Icon size={15} />
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 text-muted-foreground hover:text-red-500"
            onClick={logout}
          >
            <LogOut size={15} />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
