"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
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

interface StockData {
  info: {
    symbol: string;
    name?: string;
    exchange?: string;
    sector?: string;
  };
  history: PriceRecord[];
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const [data, setData] = useState<StockData | null>(null);
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
          Không tìm thấy dữ liệu cho <strong>{symbol}</strong>. Cổ phiếu này
          có thể chưa được sync.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại
        </Button>
      </div>
    );
  }

  const chartData = [...(data.history || [])].reverse().slice(-30);
  const latest = data.history?.[0];
  const prev = data.history?.[1];
  const priceChange = latest && prev ? latest.close - prev.close : 0;
  const priceChangePct = prev?.close ? (priceChange / prev.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="p-6 space-y-5">
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
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{symbol}</h1>
              {data.info?.exchange && (
                <Badge variant="outline" className="text-xs">
                  {data.info.exchange}
                </Badge>
              )}
            </div>
            {data.info?.name && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {data.info.name}
              </p>
            )}
          </div>
          {latest && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                {latest.close.toLocaleString()}
              </p>
              <div
                className={`flex items-center justify-end gap-1 text-sm ${
                  isPositive ? "text-green-600" : "text-red-500"
                }`}
              >
                {isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {priceChange > 0 ? "+" : ""}
                {priceChange.toFixed(1)} ({priceChangePct > 0 ? "+" : ""}
                {priceChangePct.toFixed(2)}%)
              </div>
            </div>
          )}
        </div>
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

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Giá đóng cửa — 30 phiên gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
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
                    return [display, "Giá đóng cửa"] as [string, string];
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
