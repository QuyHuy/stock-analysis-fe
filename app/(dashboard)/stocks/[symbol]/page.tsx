"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Activity,
  Globe,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type RechartsValue = string | number | readonly (string | number)[] | undefined;

interface PriceRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Signals {
  stance: string;
  stance_key: string;
  score: number;
  indicators: { label: string; value: string }[];
  warnings: string[];
  opportunities: string[];
  disclaimer: string;
}

interface LiveQuote {
  match_price?: number;
  foreign_buy_volume?: number | null;
  foreign_sell_volume?: number | null;
  foreign_net_volume?: number | null;
  percent_change?: number;
  total_value_bil?: number;
  exchange_board?: string;
}

interface StockPayload {
  info: {
    symbol?: string;
    name?: string;
    exchange?: string;
    industry?: string;
    market_cap?: number;
    pe?: number;
    pb?: number;
    ps?: number;
    eps?: number;
    bvps?: number;
    roe?: number;
  };
  history: PriceRecord[];
  live_quote: LiveQuote | null;
  signals: Signals;
  tradingview_symbol: string;
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<StockPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    stockApi
      .get(symbol)
      .then((res) => setData(res.data))
      .catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  const tvSrc = useMemo(() => {
    if (!data?.tradingview_symbol) return "";
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    const s = encodeURIComponent(data.tradingview_symbol);
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?autosize=true&symbol=${s}&interval=D&timezone=Asia%2FHo_Chi_Minh&theme=${theme}&style=1&locale=vi&hide_top_toolbar=false&allow_symbol_change=false&save_image=false`;
  }, [data?.tradingview_symbol, resolvedTheme]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Đang tải dữ liệu {symbol}...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy dữ liệu cho <strong>{symbol}</strong>. Cổ phiếu này có thể
          chưa được sync.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại
        </Button>
      </div>
    );
  }

  const chartData = [...(data.history || [])].reverse().slice(-40);
  const latest = data.history?.[0];
  const prev = data.history?.[1];
  const priceChange = latest && prev ? latest.close - prev.close : 0;
  const priceChangePct = prev?.close ? (priceChange / prev.close) * 100 : 0;
  const isPositive = priceChange >= 0;
  const live = data.live_quote;
  const sig = data.signals;
  const info = data.info || {};

  const stanceColor =
    sig.stance_key === "positive"
      ? "border-green-500/40 bg-green-500/5"
      : sig.stance_key === "caution"
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-border bg-muted/20";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto pb-10">
      <div>
        <Link href="/stocks">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} className="mr-1" /> Danh sách
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">{symbol}</h1>
              {info.exchange && (
                <Badge variant="outline" className="text-xs">
                  {info.exchange}
                </Badge>
              )}
              {data.tradingview_symbol && (
                <Badge variant="secondary" className="text-xs font-mono">
                  TV {data.tradingview_symbol}
                </Badge>
              )}
            </div>
            {info.name && (
              <p className="text-sm text-muted-foreground mt-0.5">{info.name}</p>
            )}
            {info.industry && (
              <p className="text-xs text-muted-foreground mt-1">{info.industry}</p>
            )}
          </div>
          {latest && (
            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold">{latest.close.toLocaleString()}</p>
              <div
                className={`flex items-center gap-1 text-sm ${
                  isPositive ? "text-green-600" : "text-red-500"
                }`}
              >
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {priceChange > 0 ? "+" : ""}
                {priceChange.toFixed(1)} ({priceChangePct > 0 ? "+" : ""}
                {priceChangePct.toFixed(2)}%) <span className="text-muted-foreground">vs phiên trước</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chỉ báo tổng hợp */}
      <Card className={`border-2 ${stanceColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity size={18} />
            Chỉ báo & nhận định nhanh (thuật toán rule-based)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Xu hướng gợi ý:</span>
            <Badge
              variant={sig.stance_key === "positive" ? "default" : "secondary"}
              className={
                sig.stance_key === "caution" ? "bg-amber-600 hover:bg-amber-600" : ""
              }
            >
              {sig.stance}
            </Badge>
            <span className="text-xs text-muted-foreground">(điểm {sig.score})</span>
          </div>
          {sig.indicators.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
              {sig.indicators.map((x) => (
                <div key={x.label} className="rounded-md bg-muted/50 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">{x.label}</p>
                  <p className="font-medium">{x.value}</p>
                </div>
              ))}
            </div>
          )}
          {sig.opportunities.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                <Sparkles size={12} /> Tín hiệu tích cực
              </p>
              <ul className="text-sm list-disc list-inside text-muted-foreground">
                {sig.opportunities.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {sig.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Lưu ý / cảnh báo
              </p>
              <ul className="text-sm list-disc list-inside text-muted-foreground">
                {sig.warnings.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground border-t pt-2">{sig.disclaimer}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cơ bản & vốn hóa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            {[
              ["Vốn hóa (ước)", info.market_cap != null ? info.market_cap.toLocaleString() : "—"],
              ["P/E", info.pe ?? "—"],
              ["P/B", info.pb ?? "—"],
              ["P/S", info.ps ?? "—"],
              ["EPS", info.eps ?? "—"],
              ["BVPS", info.bvps ?? "—"],
              ["ROE", info.roe != null ? `${info.roe}%` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-border/50 py-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-right">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe size={16} />
              Khối ngoại & phiên (KBS realtime)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {!live ? (
              <p className="text-muted-foreground text-xs">
                Không lấy được bảng giá realtime (thử lại sau hoặc kiểm tra mã/sàn).
              </p>
            ) : (
              <>
                {live.exchange_board && (
                  <p className="text-xs text-muted-foreground">Sàn bảng giá: {live.exchange_board}</p>
                )}
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NN mua (KL)</span>
                    <span>{live.foreign_buy_volume?.toLocaleString() ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NN bán (KL)</span>
                    <span>{live.foreign_sell_volume?.toLocaleString() ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">NN ròng</span>
                    <span
                      className={
                        (live.foreign_net_volume ?? 0) > 0
                          ? "text-green-600"
                          : (live.foreign_net_volume ?? 0) < 0
                            ? "text-red-500"
                            : ""
                      }
                    >
                      {live.foreign_net_volume != null
                        ? live.foreign_net_volume.toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  {live.match_price != null && (
                    <div className="flex justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Giá khớp bảng</span>
                      <span>{live.match_price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Mở cửa", value: latest.open.toLocaleString() },
            { label: "Cao nhất", value: latest.high.toLocaleString() },
            { label: "Thấp nhất", value: latest.low.toLocaleString() },
            { label: "Khối lượng", value: latest.volume.toLocaleString() },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tvSrc && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Biểu đồ TradingView</CardTitle>
            <p className="text-xs text-muted-foreground">
              Nhúng từ TradingView — đồ thị đầy đủ chỉ báo kỹ thuật
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-[420px] min-h-[360px] border-t border-border">
              <iframe
                title={`TradingView ${symbol}`}
                src={tvSrc}
                className="w-full h-full border-0"
                allow="clipboard-write"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Giá đóng cửa (Firestore) — {chartData.length} phiên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[260px] min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v.toLocaleString()}
                  />
                  <Tooltip
                    formatter={(v: RechartsValue) => {
                      const display =
                        typeof v === "number" ? v.toLocaleString() : String(v ?? "");
                      return [display, "Đóng cửa"] as [string, string];
                    }}
                    labelFormatter={(l) => `Ngày: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
