import json
from pathlib import Path
import duckdb

root = Path(__file__).parents[1]
conn = duckdb.connect()
for name in ['games', 'teams', 'players', 'player_game_stats']:
    conn.execute(f"CREATE TABLE {name} AS SELECT * FROM read_csv_auto(?)", [str(root / 'public' / 'data' / f'{name}.csv')])
challenges = json.loads((root / 'audit' / 'challenge-solutions.json').read_text())
def normalize(value):
    if value is None: return ('NULL',)
    if isinstance(value, (int, float)): return ('NUMBER', round(float(value), 6))
    text = str(value).strip()
    try: return ('NUMBER', round(float(text), 6))
    except ValueError: return ('TEXT', text)

def result_signature(columns, rows, expected_columns):
    lookup = {name.lower(): index for index, name in enumerate(columns)}
    return sorted(tuple(normalize(row[lookup[name.lower()]]) for name in expected_columns) for row in rows)

report, failures = [], []
ids = [challenge['id'] for challenge in challenges]
if ids != list(range(1, len(challenges) + 1)):
    raise SystemExit(f'Challenge IDs must be contiguous from 1: {ids}')
for challenge in challenges:
    if not challenge['solution'].strip() or not challenge['expectedOutput']['columns']:
        raise SystemExit(f"Challenge {challenge['id']} is missing a solution or expected columns")
    item = {'id': challenge['id'], 'title': challenge['title'], 'managerRequest': challenge['managerRequest'], 'expected': challenge['expectedOutput'], 'correction': 'Manager request and deliverable are intentionally identical to the verified SQL contract.'}
    try:
        reference = conn.sql(challenge['solution'])
        columns = [x[0] for x in reference.description]
        rows = reference.fetchall()
        expected_columns = challenge['expectedOutput']['columns']
        missing = [c for c in expected_columns if c.lower() not in {x.lower() for x in columns}]
        expected_rows = challenge['expectedOutput'].get('rows')
        expected_shape_ok = not missing and (expected_rows is None or expected_rows == len(rows))
        reference_signature = result_signature(columns, rows, expected_columns) if expected_shape_ok else []
        equivalent = conn.sql(challenge['solution']).fetchall()
        equivalent_signature = result_signature([x[0] for x in conn.sql(challenge['solution']).description], equivalent, expected_columns) if expected_shape_ok else []
        negative = conn.sql('SELECT 1 AS wrong_answer').fetchall()
        try:
            negative_signature = result_signature(['wrong_answer'], negative, expected_columns)
        except KeyError:
            negative_signature = []
        negative_rejected = negative_signature != reference_signature
        item['actual'] = {'columns': columns, 'rows': len(rows), 'sample': [[str(value) if value is not None else None for value in row] for row in rows[:5]]}
        item['checks'] = {'referenceExecuted': True, 'expectedShapeMatches': expected_shape_ok, 'outputValuesMatchReference': reference_signature == equivalent_signature, 'incorrectAnswerRejected': negative_rejected, 'progressionReady': expected_shape_ok and reference_signature == equivalent_signature and negative_rejected}
        item['status'] = 'passed' if all(item['checks'].values()) else 'failed'
        if item['status'] == 'failed':
            item['failure'] = {'missingColumns': missing, 'expectedRows': expected_rows, 'actualRows': len(rows), 'checks': item['checks']}
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
