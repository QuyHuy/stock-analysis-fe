"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { stockApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  exchange: string;
  pe: number | null;
  market_cap?: number | null;
  industry?: string;
}

interface Group {
  id: string;
  exchange: string;
  industry: string;
  title: string;
  count: number;
  stocks: StockItem[];
}

const EXCHANGES = ["Tất cả", "HOSE", "HNX", "UPCOM"] as const;

export default function StocksPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [exFilter, setExFilter] = useState<string>("Tất cả");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    stockApi
      .list()
      .then((res) => {
        setGroups(res.data.groups || []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = useMemo(() => {
    let g = groups;
    if (exFilter !== "Tất cả") {
      g = g.filter((x) => x.exchange === exFilter);
    }
    if (!search.trim()) return g;
    const q = search.toLowerCase();
    return g
      .map((gr) => ({
        ...gr,
        stocks: gr.stocks.filter(
          (i) =>
            i.symbol.toLowerCase().includes(q) ||
            (i.name && i.name.toLowerCase().includes(q))
        ),
      }))
      .filter((gr) => gr.stocks.length > 0);
  }, [groups, search, exFilter]);

  const toggleCategory = (id: string) =>
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  const formatCap = (v: number | null | undefined) => {
    if (v == null || v === 0) return null;
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)} nghìn tỷ`;
    if (v >= 1e9) return `${(v / 1e9).toFixed(0)} tỷ`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(0)} triệu`;
    return v.toLocaleString();
  };

  return (
    <div className="p-6 overflow-auto h-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cổ phiếu Việt Nam</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 size={14} />
            {total.toLocaleString()} mã (sau sync) · nhóm theo{" "}
            <strong>Sàn + Ngành</strong>
          </p>
        </div>
        <TrendingUp className="text-muted-foreground hidden sm:block" size={24} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {EXCHANGES.map((ex) => (
          <Button
            key={ex}
            variant={exFilter === ex ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => setExFilter(ex)}
          >
            {ex}
          </Button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          placeholder="Tìm mã hoặc tên công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải danh sách...</div>
      ) : filteredGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search.trim()
            ? `Không có kết quả cho "${search}"`
            : "Chưa có dữ liệu. Chạy sync backend để đồng bộ toàn thị trường."}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((gr) => (
            <div key={gr.id} className="border border-border rounded-lg bg-card/30">
              <button
                type="button"
                onClick={() => toggleCategory(gr.id)}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 hover:bg-muted/40 rounded-t-lg"
              >
                {collapsed[gr.id] ? (
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm flex-1 truncate">{gr.title}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {gr.stocks.length}
                </Badge>
              </button>
              {!collapsed[gr.id] && (
                <div className="px-3 pb-3 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {gr.stocks.map((item) => (
                      <Link key={item.symbol} href={`/stocks/${item.symbol}`}>
                        <Card className="hover:bg-muted/50 cursor-pointer transition-colors hover:border-primary/40 h-full">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-sm">
                                {item.symbol}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">
                                {item.exchange}
                              </Badge>
                            </div>
                            {item.name && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.name}
                              </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                              {item.pe != null && <span>P/E {item.pe}</span>}
                              {formatCap(item.market_cap) && (
                                <span>VH ~{formatCap(item.market_cap)}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
