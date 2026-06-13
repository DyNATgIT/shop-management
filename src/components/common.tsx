export function Line({ label, value }: { label: string, value: string }) { return <div className="line"><span>{label}</span><b>{value}</b></div> }

export function Table({ headers, rows }: { headers: string[], rows: any[][] }) { return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={headers.length} className="empty">No data</td></tr>}</tbody></table></div> }
