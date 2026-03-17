"use client";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { alertApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Settings,
  Zap,
} from "lucide-react";
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
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (!user) return;
    alertApi
      .list()
      .then((res) => setAlerts(res.data))
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const id = snap.data()?.telegramChatId || "";
        setTelegramId(id);
        if (id) setShowGuide(false);
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
    <div className="p-6 space-y-6 max-w-3xl overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold">Cảnh báo Giá</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nhận thông báo Telegram khi giá chạm ngưỡng bạn đặt
        </p>
      </div>

      {/* Setup Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Hướng dẫn thiết lập cảnh báo giá
            </CardTitle>
            {showGuide ? (
              <ChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={16} className="text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showGuide && (
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-4 text-sm">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Lấy Telegram Chat ID</p>
                  <p className="text-muted-foreground mt-0.5">
                    Mở Telegram, tìm bot{" "}
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center gap-0.5"
                    >
                      @userinfobot <ExternalLink size={10} />
                    </a>{" "}
                    và nhắn{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      /start
                    </code>
                    . Bot sẽ trả về Chat ID của bạn (một dãy số).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Nhắn /start cho Bot cảnh báo</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tìm và nhắn{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      /start
                    </code>{" "}
                    cho bot cảnh báo của hệ thống. Bot sẽ xác nhận kết nối thành công.
                    Nếu chưa biết tên bot, hãy liên hệ quản trị viên.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Dán Chat ID vào ô bên dưới</p>
                  <p className="text-muted-foreground mt-0.5">
                    Paste Chat ID vừa nhận được vào ô &ldquo;Telegram Chat
                    ID&rdquo; và nhấn <strong>Lưu</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Tạo cảnh báo giá</p>
                  <p className="text-muted-foreground mt-0.5">
                    Nhập mã cổ phiếu (VD: <strong>VNM</strong>), chọn điều kiện
                    (&ldquo;Tăng trên&rdquo; hoặc &ldquo;Giảm dưới&rdquo;),
                    nhập mức giá mong muốn (đơn vị: nghìn đồng), rồi nhấn{" "}
                    <strong>Tạo cảnh báo</strong>.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  5
                </div>
                <div>
                  <p className="font-medium">Nhận thông báo tự động</p>
                  <p className="text-muted-foreground mt-0.5">
                    Hệ thống kiểm tra giá mỗi 15 phút trong giờ giao dịch
                    (9:00–14:45, thứ 2–6). Khi giá chạm ngưỡng, bạn sẽ nhận
                    tin nhắn Telegram ngay lập tức.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Badge variant="outline" className="text-xs gap-1">
                <MessageCircle size={10} /> Telegram
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Settings size={10} /> Tự động
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Zap size={10} /> Realtime
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Telegram config */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageCircle size={14} />
              Cấu hình Telegram
            </p>
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
          {telegramId && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Chat ID đã được lưu: {telegramId}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Create alert */}
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

      {/* Active alerts */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Cảnh báo đang hoạt động ({alerts.length})
        </h2>
        {loadingAlerts ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell size={32} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Chưa có cảnh báo nào. Tạo cảnh báo đầu tiên ở trên!
              </p>
            </CardContent>
          </Card>
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
                    {alert.condition === "above"
                      ? "↑ Tăng trên"
                      : "↓ Giảm dưới"}{" "}
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
