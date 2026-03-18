"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { syncApi } from "@/lib/api";
import {
  MessageSquare,
  TrendingUp,
  Bell,
  Bookmark,
  LogOut,
  BarChart2,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncCreating, setSyncCreating] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const progress = useMemo(() => {
    const total = Number(syncStatus?.total_symbols || 0);
    const processed = Number(syncStatus?.processed || 0);
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
    return { total, processed, pct };
  }, [syncStatus]);

  const startPolling = (jobId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await syncApi.getJob(jobId);
        setSyncStatus(res.data);
        const st = res.data?.status;
        if (st === "done" || st === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e: any) {
        setSyncError(e?.response?.data?.detail?.message || "Không lấy được trạng thái sync job.");
      }
    }, 1200);
  };

  const openSync = () => {
    setSyncOpen(true);
    setSyncError(null);
  };

  const closeSync = () => {
    setSyncOpen(false);
  };

  const createJob = async () => {
    setSyncCreating(true);
    setSyncError(null);
    setSyncStatus(null);
    try {
      const res = await syncApi.createJob({ full_market: true });
      const jobId = res.data?.job_id;
      setSyncJobId(jobId);
      setSyncStatus(res.data);
      if (jobId) startPolling(jobId);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail?.job_id) {
        // Có job đang chạy
        setSyncJobId(detail.job_id);
        startPolling(detail.job_id);
        setSyncError(detail.message || "Đang có một sync job chạy.");
      } else {
        setSyncError(detail?.message || detail || "Tạo sync job thất bại.");
      }
    } finally {
      setSyncCreating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

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
        <div className="p-2 space-y-1">
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-9"
            onClick={openSync}
          >
            <RefreshCw size={15} />
            Sync dữ liệu
          </Button>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Giao diện</span>
            <ThemeToggle />
          </div>
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
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>

      {/* Sync progress dialog (simple modal) */}
      {syncOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSync}
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="font-semibold text-sm">Sync dữ liệu tổng thể</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tiến độ tổng quan · lỗi sẽ ghi nhận và tiếp tục sync mã tiếp theo
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeSync}>
                <X size={16} />
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {!syncJobId ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Bấm để bắt đầu sync toàn thị trường (có thể mất thời gian và bị giới hạn API).
                  </p>
                  <Button
                    onClick={createJob}
                    disabled={syncCreating}
                    className="w-full justify-center gap-2"
                  >
                    <RefreshCw size={16} className={syncCreating ? "animate-spin" : ""} />
                    {syncCreating ? "Đang tạo job..." : "Bắt đầu Sync"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Job: <span className="font-mono">{syncJobId}</span>
                  </div>

                  <div className="rounded-lg border p-3 bg-muted/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Trạng thái</span>
                      <span className="font-medium">
                        {syncStatus?.status || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Đang sync</span>
                      <span className="font-mono">
                        {syncStatus?.current_symbol || "—"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {progress.processed.toLocaleString()}/{progress.total.toLocaleString()} ({progress.pct}%)
                        </span>
                        <span>
                          OK {Number(syncStatus?.success || 0).toLocaleString()} · Lỗi {Number(syncStatus?.errors || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 mt-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {Array.isArray(syncStatus?.recent_errors) && syncStatus.recent_errors.length > 0 && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium mb-2">Lỗi gần nhất</p>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {syncStatus.recent_errors
                          .slice()
                          .reverse()
                          .map((e: any, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              <span className="font-mono font-semibold">{e.symbol}</span>{" "}
                              <span className="opacity-70">—</span>{" "}
                              <span>{String(e.error || "").slice(0, 160)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {syncError && (
                    <div className="text-xs text-red-500">{syncError}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
