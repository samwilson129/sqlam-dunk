import json
from pathlib import Path
import duckdb

root = Path(__file__).parents[1]
conn = duckdb.connect()
for name in ['games', 'teams', 'players', 'player_game_stats']:
    conn.execute(f"CREATE TABLE {name} AS SELECT * FROM read_csv_auto(?)", [str(root / 'public' / 'data' / f'{name}.csv')])
challenges = json.loads((root / 'audit' / 'challenge-solutions.json').read_text())
report, failures = [], []
for challenge in challenges:
    item = {'id': challenge['id'], 'title': challenge['title'], 'expected': challenge['expectedOutput']}
    try:
        relation = conn.sql(challenge['solution'])
        columns = [x[0] for x in relation.description]
        rows = relation.fetchall()
        missing = [c for c in challenge['expectedOutput']['columns'] if c.lower() not in {x.lower() for x in columns}]
        expected_rows = challenge['expectedOutput'].get('rows')
        row_mismatch = expected_rows is not None and expected_rows != len(rows)
        item['actual'] = {'columns': columns, 'rows': len(rows), 'sample': [[str(value) if value is not None else None for value in row] for row in rows[:5]]}
        item['status'] = 'passed' if not missing and not row_mismatch else 'failed'
        if item['status'] == 'failed':
            item['failure'] = {'missingColumns': missing, 'expectedRows': expected_rows, 'actualRows': len(rows)}
            failures.append(item)
    except Exception as exc:
        item['status'] = 'failed'
        item['failure'] = {'error': str(exc)}
        failures.append(item)
    report.append(item)
out = {'tested': len(report), 'passed': len(report)-len(failures), 'failed': len(failures), 'failures': failures, 'report': report}
(root / 'audit' / 'curriculum-audit.json').write_text(json.dumps(out, indent=2))
print(json.dumps({k: out[k] for k in ['tested', 'passed', 'failed']}, indent=2))
if failures:
    print(json.dumps(failures, indent=2))
    raise SystemExit(1)
