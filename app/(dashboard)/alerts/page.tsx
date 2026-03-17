"use client";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { alertApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Alert {
  id: string;
  symbol: string;
  condition: "above" | "below";
  price: number;
  active: boolean;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);

  useEffect(() => {
    if (!user) return;
    alertApi
      .list()
      .then((res) => setAlerts(res.data))
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setTelegramId(snap.data()?.telegramChatId || "");
      }
    });
  }, [user]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price) return;
    setSaving(true);
    try {
      const res = await alertApi.create({
        symbol: symbol.toUpperCase(),
        condition,
        price: parseFloat(price),
      });
      setAlerts((prev) => [...prev, res.data]);
      setSymbol("");
      setPrice("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    await alertApi.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveTelegram = async () => {
    if (!user) return;
    setSavingTelegram(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { telegramChatId: telegramId },
        { merge: true }
      );
    } finally {
      setSavingTelegram(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold">Cảnh báo Giá</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nhận thông báo Telegram khi giá chạm ngưỡng bạn đặt
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Cấu hình Telegram</p>
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Lấy Chat ID <ExternalLink size={11} />
            </a>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Telegram Chat ID (VD: 123456789)"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTelegram}
              disabled={savingTelegram}
            >
              {savingTelegram ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nhắn{" "}
            <code className="bg-muted px-1 rounded">/start</code>{" "}
            tới{" "}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              @userinfobot
            </a>{" "}
            để lấy Chat ID của bạn.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold mb-3">Tạo cảnh báo mới</h2>
        <form
          onSubmit={handleCreateAlert}
          className="flex flex-wrap gap-3 items-end"
        >
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Mã cổ phiếu
            </label>
            <Input
              placeholder="VNM"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-24 uppercase"
              maxLength={4}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Điều kiện
            </label>
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as "above" | "below")
              }
              className="h-9 rounded-md border bg-background px-3 py-1 text-sm"
            >
              <option value="above">Tăng trên</option>
              <option value="below">Giảm dưới</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Giá (nghìn đồng)
            </label>
            <Input
              type="number"
              placeholder="85.0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-32"
              step="0.1"
              min="0"
            />
          </div>
          <Button type="submit" disabled={saving || !symbol || !price}>
            <Bell size={14} className="mr-1.5" />
            {saving ? "Đang tạo..." : "Tạo cảnh báo"}
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Cảnh báo đang hoạt động ({alerts.length})
        </h2>
        {loadingAlerts ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có cảnh báo nào.</p>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm">
                    {alert.symbol}
                  </span>
                  <Badge
                    variant={
                      alert.condition === "above" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {alert.condition === "above" ? "↑ Tăng trên" : "↓ Giảm dưới"}{" "}
                    {alert.price.toLocaleString()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDeleteAlert(alert.id)}
                >
                  <Trash2 size={13} />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
