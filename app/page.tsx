export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>

      <header className="site-header">
        <a className="wordmark" href="#accueil" aria-label="Tambouloup, accueil">
          <span className="wordmark-mark" aria-hidden="true">◒</span>
          <span>TAMBOULOUP</span>
        </a>

        <nav aria-label="Navigation principale">
          <a href="#atelier">L&apos;atelier</a>
          <a href="#pratique">Le voyage</a>
          <a href="#infos">Informations</a>
        </nav>

        <a className="header-contact" href="tel:+33664977749">
          Contact <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="contenu">
        <section className="hero" id="accueil" aria-labelledby="hero-title">
          <div className="aurora aurora-left" aria-hidden="true" />
          <div className="aurora aurora-right" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><span /> ATELIER DE BASE · 2 JOURS</p>
            <h1 id="hero-title">
              Initiation aux<br />
              <em>pratiques</em> chamaniques
            </h1>
            <p className="hero-intro">
              Un temps pour écouter le tambour, ouvrir le passage et partir à la rencontre des mondes qui nous entourent.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#infos">Découvrir l&apos;atelier <span aria-hidden="true">↓</span></a>
              <a className="button button-quiet" href="tel:+33664977749">Parler à Alexandre <span aria-hidden="true">↗</span></a>
            </div>
            <p className="hero-meta">Samedi &amp; dimanche · 12h — 18h · Gerde</p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="sun-disc" />
            <div className="sun-orbit orbit-one" />
            <div className="sun-orbit orbit-two" />
            <div className="art-caption">Tambouloup<br /><span>Le tambour comme boussole</span></div>
            <img src="/tambouloup-loup.jpeg" alt="" className="wolf-illustration" />
          </div>
        </section>

        <section className="invitation" id="atelier" aria-labelledby="invitation-title">
          <div className="section-kicker">01 · L&apos;intention</div>
          <div className="invitation-copy">
            <p className="quote-mark" aria-hidden="true">“</p>
            <h2 id="invitation-title">S&apos;aventurer avec justesse dans <em>l&apos;invisible.</em></h2>
            <p>
              Cet atelier propose d&apos;apprendre à faire un voyage chamanique, d&apos;explorer les différents mondes et de rencontrer un animal totem — pour soi, puis pour quelqu&apos;un d&apos;autre.
            </p>
          </div>
          <p className="side-note">Un espace d&apos;initiation<br />et d&apos;exploration</p>
        </section>

        <section className="path" id="pratique" aria-labelledby="path-title">
          <div className="path-heading">
            <div>
              <p className="section-kicker section-kicker-light">02 · Le chemin</p>
              <h2 id="path-title">Trois seuils<br />à <em>franchir.</em></h2>
            </div>
            <p>Une pratique guidée, à votre rythme, pour poser les premières bases du voyage chamanique.</p>
          </div>

          <div className="path-grid">
            <article className="path-card path-card-terracotta">
              <span className="path-number">01</span>
              <span className="path-icon" aria-hidden="true">⟡</span>
              <h3>Entrer en voyage</h3>
              <p>Apprendre à créer les conditions d&apos;un voyage chamanique.</p>
            </article>
            <article className="path-card path-card-moss">
              <span className="path-number">02</span>
              <span className="path-icon" aria-hidden="true">◌</span>
              <h3>Explorer les mondes</h3>
              <p>Prendre le temps de découvrir les différents espaces du voyage.</p>
            </article>
            <article className="path-card path-card-cream">
              <span className="path-number">03</span>
              <span className="path-icon" aria-hidden="true">✦</span>
              <h3>Rencontrer l&apos;animal totem</h3>
              <p>Faire la rencontre d&apos;un animal totem pour soi et pour autrui.</p>
            </article>
          </div>
        </section>

        <section className="rhythm" aria-labelledby="rhythm-title">
          <div className="rhythm-visual" aria-hidden="true">
            <div className="drum">
              <div className="drum-inner"><span>◉</span></div>
            </div>
            <div className="drum-ray ray-one" />
            <div className="drum-ray ray-two" />
            <div className="drum-ray ray-three" />
          </div>
          <div className="rhythm-copy">
            <p className="section-kicker">03 · Le rythme</p>
            <h2 id="rhythm-title">Quand le tambour devient <em>un passage.</em></h2>
            <p>Le rythme accompagne le voyage et ouvre un espace d&apos;attention, de présence et de rencontre.</p>
          </div>
        </section>

        <section className="details" id="infos" aria-labelledby="details-title">
          <div className="details-intro">
            <p className="section-kicker">04 · Informations pratiques</p>
            <h2 id="details-title">Se retrouver au <em>Mélilot.</em></h2>
            <p>Les dates seront définies ultérieurement. Pour manifester votre intérêt ou obtenir les prochaines informations, contactez Alexandre directement.</p>
          </div>

          <div className="details-grid">
            <article className="detail-card detail-card-time">
              <span className="detail-label">Le rythme</span>
              <h3>Samedi &amp;<br />dimanche</h3>
              <p className="detail-highlight">12h — 18h</p>
              <p>Dates à définir ultérieurement</p>
            </article>
            <article className="detail-card detail-card-place">
              <span className="detail-label">Le lieu</span>
              <h3>Au Mélilot</h3>
              <p>Chemin des Humas<br />65200 Gerde</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Au%20M%C3%A9lilot%2C%20chemin%20des%20Humas%2C%2065200%20Gerde" target="_blank" rel="noreferrer">Voir l&apos;itinéraire <span aria-hidden="true">↗</span></a>
            </article>
            <article className="detail-card detail-card-price">
              <span className="detail-label">La contribution</span>
              <p className="price">150<span>€</span></p>
              <p>Pour l&apos;atelier complet de deux jours.</p>
            </article>
          </div>
        </section>

        <section className="contact" aria-labelledby="contact-title">
          <div className="contact-moon" aria-hidden="true" />
          <p className="eyebrow"><span /> UNE QUESTION, UNE INSCRIPTION ?</p>
          <h2 id="contact-title">Le voyage commence<br />par <em>un échange.</em></h2>
          <p>Alexandre Godgenger vous répond directement pour vous renseigner sur l&apos;atelier et les prochaines dates.</p>
          <a className="phone-link" href="tel:+33664977749">
            <span>06 64 97 77 49</span>
            <i aria-hidden="true">↗</i>
          </a>
          <p className="contact-name">Alexandre Godgenger</p>
        </section>
      </main>

      <footer>
        <a className="wordmark footer-wordmark" href="#accueil"><span className="wordmark-mark" aria-hidden="true">◒</span><span>TAMBOULOUP</span></a>
        <p>Initiation aux pratiques chamaniques<br />Gerde · Hautes-Pyrénées</p>
        <a href="#accueil">Revenir au sommet <span aria-hidden="true">↑</span></a>
      </footer>
    </>
  );
}
