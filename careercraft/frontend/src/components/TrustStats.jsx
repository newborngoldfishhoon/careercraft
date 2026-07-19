export default function TrustStats({ stats }) {
  return (
    <section className="stats">
      <div className="container stats__row">
        {(stats || []).map((s) => (
          <div className="stats__item" key={s.label}>
            <span className="stats__value">{s.value}</span>
            <span className="stats__label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
