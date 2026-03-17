"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { stockApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  exchange: string;
  pe: number | null;
}

export default function StocksPage() {
  const [categories, setCategories] = useState<Record<string, StockItem[]>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    stockApi
      .list()
      .then((res) => {
        setCategories(res.data.categories || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    const result: Record<string, StockItem[]> = {};
    Object.entries(categories).forEach(([cat, items]) => {
      const matched = items.filter(
        (i) =>
          i.symbol.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q)
      );
      if (matched.length) result[cat] = matched;
    });
    return result;
  }, [categories, search]);

  const totalSymbols = Object.values(categories).reduce(
    (acc, items) => acc + items.length,
    0
  );

  const toggleCategory = (cat: string) =>
    setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cổ phiếu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalSymbols} mã · {Object.keys(categories).length} ngành
          </p>
        </div>
        <TrendingUp className="text-muted-foreground" size={20} />
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          placeholder="Tìm theo mã hoặc tên công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : Object.keys(filtered).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy kết quả cho &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(filtered)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([category, items]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 mb-2 group w-full text-left"
                >
                  {collapsed[category] ? (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {category}
                  </span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {items.length}
                  </Badge>
                </button>
                {!collapsed[category] && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 ml-5">
                    {items.map((item) => (
                      <Link key={item.symbol} href={`/stocks/${item.symbol}`}>
                        <Card className="hover:bg-muted/50 cursor-pointer transition-colors hover:border-primary/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-sm">
                                {item.symbol}
                              </span>
                              {item.exchange && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  {item.exchange}
                                </Badge>
                              )}
                            </div>
                            {item.name && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {item.name}
                              </p>
                            )}
                            {item.pe != null && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                P/E: {item.pe}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
