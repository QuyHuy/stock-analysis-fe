"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { stockApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp } from "lucide-react";

export default function StocksPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockApi
      .list()
      .then((res) => {
        setSymbols(res.data.symbols || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = symbols.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cổ phiếu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {symbols.length} mã cổ phiếu đang được theo dõi
          </p>
        </div>
        <TrendingUp className="text-muted-foreground" size={20} />
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          placeholder="Tìm mã cổ phiếu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filtered.map((symbol) => (
            <Link key={symbol} href={`/stocks/${symbol}`}>
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors hover:border-primary/50">
                <CardContent className="p-2.5 text-center">
                  <span className="font-mono font-semibold text-xs">
                    {symbol}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy mã &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
