import json
import ssl
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'apps' / 'dsa-web' / 'public' / 'data' / 'market.json'
CN_TZ = timezone(timedelta(hours=8))


def get_json(url: str):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://quote.eastmoney.com/'})
    context = ssl.create_default_context()
    with urlopen(req, timeout=30, context=context) as response:
        return json.loads(response.read().decode('utf-8'))


def main():
    # Eastmoney public quotation endpoints; no API key is required.
    stock_params = {
        'pn': 1, 'pz': 100, 'po': 1, 'np': 1, 'fltt': 2, 'invt': 2,
        'fid': 'f6',
        'fs': 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
        'fields': 'f12,f14,f2,f3,f6,f8',
    }
    stock_url = 'https://push2.eastmoney.com/api/qt/clist/get?' + urlencode(stock_params)
    stock_payload = get_json(stock_url)
    rows = (stock_payload.get('data') or {}).get('diff') or []

    stocks = []
    for row in rows:
        try:
            price = float(row.get('f2') or 0)
            change_pct = float(row.get('f3') or 0)
            amount = float(row.get('f6') or 0)
            turnover = float(row.get('f8') or 0)
            stocks.append({
                'code': str(row.get('f12') or ''),
                'name': str(row.get('f14') or ''),
                'price': price,
                'change_pct': change_pct,
                'turnover': turnover,
                'amount': amount,
            })
        except (TypeError, ValueError):
            continue

    valid = [x for x in stocks if x['code'] and x['price'] > 0]
    gainers = sorted(valid, key=lambda x: x['change_pct'], reverse=True)[:10]
    losers = sorted(valid, key=lambda x: x['change_pct'])[:10]
    turnover = sorted(valid, key=lambda x: x['amount'], reverse=True)[:10]

    index_url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?' + urlencode({
        'fltt': 2,
        'secids': '1.000001,0.399001,0.399006,0.399300',
        'fields': 'f2,f3,f12,f14',
    })
    index_rows = ((get_json(index_url).get('data') or {}).get('diff')) or []
    indices = []
    for row in index_rows:
        try:
            indices.append({
                'name': str(row.get('f14') or ''),
                'code': str(row.get('f12') or ''),
                'price': float(row.get('f2') or 0),
                'change_pct': float(row.get('f3') or 0),
            })
        except (TypeError, ValueError):
            continue

    now = datetime.now(CN_TZ)
    data = {
        'generated_at': now.strftime('%Y-%m-%d %H:%M:%S GMT+8'),
        'market_date': now.strftime('%Y-%m-%d'),
        'source': 'Eastmoney public quotation data',
        'indices': indices,
        'top_gainers': gainers,
        'top_losers': losers,
        'top_turnover': turnover,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {OUT}: {len(valid)} stocks, {len(indices)} indices')


if __name__ == '__main__':
    main()
