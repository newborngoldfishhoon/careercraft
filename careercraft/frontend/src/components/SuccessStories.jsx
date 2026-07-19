export default function SuccessStories({ stories }) {
  return (
    <section className="section" id="stories">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Real journeys</p>
          <h2>Proof that the path actually leads somewhere.</h2>
        </div>
        <div className="stories__grid">
          {(stories || []).map((s) => (
            <div className="card stories__card" key={s.headline}>
              <span className="stories__path">{s.path}</span>
              <h3>{s.headline}</h3>
              <p>&ldquo;{s.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
