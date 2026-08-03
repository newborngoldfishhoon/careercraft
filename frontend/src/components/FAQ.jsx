import { useState } from "react";

export default function FAQ({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Questions</p>
          <h2>Before you start exploring.</h2>
        </div>
        <div className="faq__list">
          {(faqs || []).map((f, i) => {
            const open = openIndex === i;
            return (
              <div className={"faq__item" + (open ? " faq__item--open" : "")} key={f.question}>
                <button
                  className="faq__question"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  aria-expanded={open}
                >
                  {f.question}
                  <span className="faq__toggle">{open ? "–" : "+"}</span>
                </button>
                {open && <p className="faq__answer">{f.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
