import { useEffect, useMemo, useState } from 'react';

type IndexQuote = {
  name: string;
  code: string;
  price: number;
  change_pct: number;
};

type StockQuote = {
  code: string;
  name: string;
  price: number;
  change_pct: number;
  turnover: number;
  amount: number;
};

type MarketData = {
  generated_at: string;
  market_date: string;
  source: string;
  indices: IndexQuote[];
  top_gainers: StockQuote[];
  top_losers: StockQuote[];
  top_turnover: StockQuote[];
};

const DATA_URL = `${import.meta.env.BASE_URL}data/market.json`;

function fmt(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function pct(value: number) {
  return `${value >= 0 ? '+' : ''}${fmt(value)}%`;
}

function QuoteCard({ item }: { item: IndexQuote }) {
  const up = item.change_pct >= 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs text-slate-400">{item.code}</div>
      <div className="mt-1 text-sm text-slate-200">{item.name}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-white">{fmt(item.price)}</div>
        <div className={up ? 'text-emerald-400' : 'text-red-400'}>{pct(item.change_pct)}</div>
      </div>
    </div>
  );
}

function StockTable({ title, rows }: { title: string; rows: StockQuote[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-base font-medium text-white">{title}</h2>
        <span className="text-xs text-slate-500">每日更新</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 bg-black/10">
            <tr>
              <th className="px-5 py-3 text-left font-normal">股票</th>
              <th className="px-3 py-3 text-right font-normal">价格</th>
              <th className="px-3 py-3 text-right font-normal">涨跌幅</th>
              <th className="px-3 py-3 text-right font-normal">成交额</th>
              <th className="px-5 py-3 text-right font-normal">换手率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.code}-${row.name}`} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="px-5 py-3">
                  <div className="text-white">{row.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{row.code}</div>
                </td>
                <td className="px-3 py-3 text-right text-slate-200">{fmt(row.price)}</td>
                <td className={`px-3 py-3 text-right font-medium ${row.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pct(row.change_pct)}
                </td>
                <td className="px-3 py-3 text-right text-slate-300">{fmt(row.amount / 1e8, 2)}亿</td>
                <td className="px-5 py-3 text-right text-slate-300">{fmt(row.turnover)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StaticMarketPage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败');
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;
    const values = data.top_turnover.map((x) => x.change_pct);
    return {
      positive: values.filter((x) => x > 0).length,
      negative: values.filter((x) => x < 0).length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-200 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.22em] text-cyan-400 uppercase">Daily Stock Analysis</div>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">每日股票行情看板</h1>
            <p className="mt-2 text-sm text-slate-400">打开网址即可查看最近一个交易日的市场数据，无需登录、无需启动服务器。</p>
          </div>
          <div className="text-left md:text-right text-xs text-slate-500">
            <div>数据日期：{data?.market_date || '加载中…'}</div>
            <div className="mt-1">更新时间：{data?.generated_at || '加载中…'}</div>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            暂时无法读取最新数据：{error}
          </div>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {data.indices.map((item) => <QuoteCard key={item.code} item={item} />)}
            </div>

            {summary && (
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-500">观察样本上涨</div>
                  <div className="mt-1 text-xl text-emerald-400">{summary.positive}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-500">观察样本下跌</div>
                  <div className="mt-1 text-xl text-red-400">{summary.negative}</div>
                </div>
                <div className="hidden md:block rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-500">数据来源</div>
                  <div className="mt-1 text-sm text-slate-200">{data.source}</div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-5">
              <StockTable title="涨幅榜" rows={data.top_gainers} />
              <StockTable title="跌幅榜" rows={data.top_losers} />
              <div className="lg:col-span-2">
                <StockTable title="成交额榜" rows={data.top_turnover} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-500">正在加载市场数据…</div>
        )}

        <footer className="mt-8 pb-6 text-xs text-slate-600">
          本页面为静态网页版本；GitHub Actions 每个交易日自动更新数据文件，页面本身不依赖 Railway 后端。
        </footer>
      </div>
    </div>
  );
}
