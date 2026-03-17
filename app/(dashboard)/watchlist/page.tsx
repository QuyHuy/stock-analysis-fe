"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Bookmark } from "lucide-react";

export default function WatchlistPage() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          setWatchlist(snap.data()?.watchlist || []);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const saveWatchlist = async (updated: string[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { watchlist: updated });
      setWatchlist(updated);
    } catch {
      await setDoc(
        doc(db, "users", user.uid),
        { watchlist: updated },
        { merge: true }
      );
      setWatchlist(updated);
    } finally {
      setSaving(false);
    }
  };

  const addSymbol = async () => {
    const s = newSymbol.trim().toUpperCase();
    if (!s || watchlist.includes(s)) return;
    await saveWatchlist([...watchlist, s]);
    setNewSymbol("");
  };

  const removeSymbol = async (symbol: string) => {
    await saveWatchlist(watchlist.filter((s) => s !== symbol));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Danh mục theo dõi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {watchlist.length} cổ phiếu
          </p>
        </div>
        <Bookmark className="text-muted-foreground" size={20} />
      </div>

      <div className="flex gap-2 mb-6 max-w-xs">
        <Input
          placeholder="Nhập mã CK (VD: VNM)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
          maxLength={4}
          className="uppercase"
        />
        <Button
          onClick={addSymbol}
          disabled={saving || !newSymbol.trim()}
          size="icon"
        >
          <Plus size={15} />
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : watchlist.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có cổ phiếu nào. Thêm mã cổ phiếu để theo dõi.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {watchlist.map((symbol) => (
            <div key={symbol} className="flex items-center gap-1">
              <Link href={`/stocks/${symbol}`}>
                <Badge
                  variant="secondary"
                  className="font-mono text-sm px-3 py-1.5 hover:bg-muted cursor-pointer"
                >
                  {symbol}
                </Badge>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeSymbol(symbol)}
                disabled={saving}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
