#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère le site multi-pages Tamboulou (statique, SEO).

Usage : python3 build.py
Le domaine canonique est défini dans BASE — le changer ici (puis rebuilder)
quand tamboulou.fr sera connecté.
"""
import os, textwrap

BASE = "https://mediumslateblue-shark-215584.hostingersite.com"
LASTMOD = "2026-08-24"
TEL = "+33664977749"
TEL_AFF = "06 64 97 77 49"
OUT = os.path.dirname(os.path.abspath(__file__))

NAV = """<nav class="main-nav" id="menu" aria-label="Navigation principale">
<a href="/formation-chamanisme/">La formation</a>
<a href="/voyage-chamanique/">Le voyage</a>
<a href="/animal-totem/">L'animal totem</a>
<a href="/faq/">FAQ</a>
</nav>"""

HEADER = f"""<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-header">
<a class="wordmark" href="/" aria-label="Tamboulou, accueil"><span class="wordmark-mark" aria-hidden="true">◒</span><span>TAMBOULOU</span></a>
{NAV}
<div class="header-right">
<a class="header-contact" href="tel:{TEL}" aria-label="Appeler Alexandre Godgenger"><span class="contact-label">Contact</span><span class="contact-arrow" aria-hidden="true">↗</span></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Ouvrir le menu">☰</button>
</div>
</header>"""

FOOTER = f"""<footer>
<div class="footer-grid">
<div class="footer-brand">
<a class="wordmark footer-wordmark" href="/"><span class="wordmark-mark" aria-hidden="true">◒</span><span>TAMBOULOU</span></a>
<p>L'école du chaman — initiation aux pratiques chamaniques.<br>Gerde · Hautes-Pyrénées · accueil de toute la France.</p>
</div>
<nav class="footer-nav" aria-label="Plan du site">
<a href="/">Accueil</a>
<a href="/formation-chamanisme/">La formation</a>
<a href="/voyage-chamanique/">Le voyage chamanique</a>
<a href="/animal-totem/">L'animal totem</a>
<a href="/faq/">Questions fréquentes</a>
<a href="/alexandre/">Alexandre Godgenger</a>
<a href="/mentions-legales/">Mentions légales</a>
</nav>
<div class="footer-contact">
<p><a href="tel:{TEL}">{TEL_AFF}</a><br>Au Mélilot, chemin des Humas<br>65200 Gerde</p>
</div>
</div>
</footer>"""

SCRIPT = """<script>
(function(){
  var toggle=document.querySelector('.nav-toggle');
  var nav=document.getElementById('menu');
  toggle.addEventListener('click',function(){
    var open=nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded',open?'true':'false');
    toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');
    toggle.textContent=open?'✕':'☰';
  });
  nav.addEventListener('click',function(e){
    if(e.target.tagName==='A'&&nav.classList.contains('is-open')){toggle.click();}
  });
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');io.unobserve(entry.target);}
      });
    },{threshold:.15,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){
      if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('reveal-pending');io.observe(el);}
    });
  }
})();
</script>"""

ORG_LD = f"""{{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "{BASE}/#org",
  "name": "Tamboulou — L'école du chaman",
  "url": "{BASE}/",
  "logo": "{BASE}/favicon.svg",
  "image": "{BASE}/tamboulou-loup.jpeg",
  "telephone": "{TEL}",
  "founder": {{"@type": "Person", "name": "Alexandre Godgenger", "url": "{BASE}/alexandre/"}},
  "address": {{"@type": "PostalAddress", "streetAddress": "Au Mélilot, chemin des Humas", "postalCode": "65200", "addressLocality": "Gerde", "addressRegion": "Occitanie", "addressCountry": "FR"}},
  "areaServed": "FR"
}}"""


def breadcrumb_ld(items):
    parts = []
    for i, (name, url) in enumerate(items, 1):
        item = f', "item": "{BASE}{url}"' if url else ""
        parts.append(f'{{"@type": "ListItem", "position": {i}, "name": "{name}"{item}}}')
    return ('{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": ['
            + ", ".join(parts) + "]}")


def breadcrumb_html(items):
    links = []
    for name, url in items:
        if url:
            links.append(f'<a href="{url}">{name}</a>')
        else:
            links.append(f'<span aria-current="page">{name}</span>')
    return ('<nav class="breadcrumb" aria-label="Fil d\'Ariane">'
            + ' <span aria-hidden="true">›</span> '.join(links) + "</nav>")


def page(path, title, description, main, extra_ld=None, og_type="website"):
    lds = [ORG_LD] + (extra_ld or [])
    ld_html = "\n".join(f'<script type="application/ld+json">{ld}</script>' for ld in lds)
    url = BASE + path
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#102124">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Tamboulou">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{BASE}/tamboulou-loup.jpeg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/styles.css">
{ld_html}
</head>
<body>
{HEADER}
<main id="contenu">
{main}
</main>
{FOOTER}
{SCRIPT}
</body>
</html>"""
    dest = os.path.join(OUT, path.strip("/"), "index.html") if path != "/" else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def content_page(path, crumb_name, h1, lede, body, title, description, extra_ld=None, cta=True):
    crumbs = [("Accueil", "/"), (crumb_name, None)]
    cta_html = f"""
<div class="cta-panel reveal">
<p class="eyebrow"><span></span> PRÊT À FRANCHIR LE SEUIL ?</p>
<h2>Vivre l'expérience lors <em>d'un stage.</em></h2>
<p>Deux jours d'initiation au voyage chamanique, dans les Pyrénées, ouverts à toute la France.</p>
<div class="cta-actions">
<a class="button button-primary" href="/formation-chamanisme/">Découvrir la formation <span aria-hidden="true">→</span></a>
<a class="button button-quiet" href="/rappel/">Être rappelé <span aria-hidden="true">☎</span></a>
</div>
</div>""" if cta else ""
    main = f"""<section class="page-head">
{breadcrumb_html(crumbs)}
<h1>{h1}</h1>
<p class="lede">{lede}</p>
</section>
<article class="prose">
{body}
</article>
{cta_html}"""
    lds = [breadcrumb_ld(crumbs)] + (extra_ld or [])
    return page(path, title, description, main, extra_ld=lds, og_type="article")


pages = []

# ---------------------------------------------------------------- Accueil
landing_main = f"""<section class="hero" id="accueil" aria-labelledby="hero-title">
<div class="aurora aurora-left" aria-hidden="true"></div>
<div class="aurora aurora-right" aria-hidden="true"></div>
<div class="hero-copy">
<p class="eyebrow"><span></span> L'ÉCOLE DU CHAMAN · STAGE DE 2 JOURS</p>
<h1 id="hero-title">Initiation aux<br><em>pratiques</em> chamaniques</h1>
<p class="hero-intro">Je vous invite à écouter le tambour, ouvrir le passage et partir à la rencontre des mondes qui nous entourent. Un stage d'initiation au chamanisme dans les Pyrénées, ouvert aux débutants de toute la France.</p>
<div class="hero-actions">
<a class="button button-primary" href="/formation-chamanisme/">Découvrir la formation <span aria-hidden="true">→</span></a>
<a class="button button-quiet" href="/rappel/">Être rappelé <span aria-hidden="true">☎</span></a>
</div>
<p class="hero-meta">Samedi et dimanche · 12h — 18h · Gerde, Hautes-Pyrénées</p>
</div>
<div class="hero-art" aria-hidden="true">
<div class="sun-disc"></div>
<div class="sun-orbit orbit-one"></div>
<div class="sun-orbit orbit-two"></div>
<img src="/tamboulou-loup.jpeg" alt="" width="2000" height="2000" fetchpriority="high" class="wolf-illustration">
</div>
</section>

<section class="invitation" id="atelier" aria-labelledby="invitation-title">
<div class="section-kicker">01 · L'intention</div>
<div class="invitation-copy reveal">
<p class="quote-mark" aria-hidden="true">“</p>
<h2 id="invitation-title">S'aventurer avec justesse dans <em>l'invisible.</em></h2>
<p>Je vous propose d'apprendre à faire un <a href="/voyage-chamanique/">voyage chamanique</a>, d'explorer les différents mondes et de rencontrer un <a href="/animal-totem/">animal totem</a> — pour vous-même, puis pour quelqu'un d'autre.</p>
</div>
<p class="side-note">Un espace d'initiation<br>et d'exploration</p>
</section>

<section class="path" id="pratique" aria-labelledby="path-title">
<div class="path-heading reveal">
<div>
<p class="section-kicker section-kicker-light">02 · Le chemin</p>
<h2 id="path-title">Trois seuils<br>à <em>franchir.</em></h2>
</div>
<p>Je vous guide, à votre rythme, pour poser les premières bases du voyage chamanique.</p>
</div>
<div class="path-grid">
<article class="path-card path-card-terracotta reveal">
<span class="path-number">01</span>
<span class="path-icon" aria-hidden="true">⟡</span>
<h3>Entrer en voyage</h3>
<p>Apprendre à créer les conditions d'un voyage chamanique.</p>
<a class="card-link" href="/formation-chamanisme/">Voir la formation <span aria-hidden="true">→</span></a>
</article>
<article class="path-card path-card-moss reveal reveal-delay-1">
<span class="path-number">02</span>
<span class="path-icon" aria-hidden="true">◌</span>
<h3>Explorer les mondes</h3>
<p>Prendre le temps de découvrir les différents espaces du voyage.</p>
<a class="card-link" href="/voyage-chamanique/">Le voyage chamanique <span aria-hidden="true">→</span></a>
</article>
<article class="path-card path-card-cream reveal reveal-delay-2">
<span class="path-number">03</span>
<span class="path-icon" aria-hidden="true">✦</span>
<h3>Rencontrer l'animal totem</h3>
<p>Faire la rencontre d'un animal totem pour soi et pour autrui.</p>
<a class="card-link" href="/animal-totem/">L'animal totem <span aria-hidden="true">→</span></a>
</article>
</div>
</section>

<section class="rhythm" aria-labelledby="rhythm-title">
<div class="rhythm-visual" aria-hidden="true">
<div class="drum"><div class="drum-inner"><span>◉</span></div></div>
<div class="drum-ray ray-one"></div>
<div class="drum-ray ray-two"></div>
<div class="drum-ray ray-three"></div>
</div>
<div class="rhythm-copy reveal">
<p class="section-kicker">03 · Le rythme</p>
<h2 id="rhythm-title">Quand le tambour devient <em>un passage.</em></h2>
<p>Je m'appuie sur le rythme du tambour pour accompagner le voyage et ouvrir un espace d'attention, de présence et de rencontre. C'est le cœur de la pratique transmise pendant <a href="/formation-chamanisme/">le stage d'initiation</a>.</p>
</div>
</section>

<section class="details" id="infos" aria-labelledby="details-title">
<div class="details-intro reveal">
<p class="section-kicker">04 · Informations pratiques</p>
<h2 id="details-title">Se retrouver au <em>Mélilot.</em></h2>
<p>Les dates seront définies ultérieurement. Le programme complet, les tarifs et l'accès depuis toute la France sont détaillés sur la page <a href="/formation-chamanisme/">formation</a> — et les réponses aux questions les plus courantes dans la <a href="/faq/">FAQ</a>.</p>
</div>
<div class="details-grid">
<article class="detail-card detail-card-time reveal">
<span class="detail-label">Le rythme</span>
<h3>Samedi<br>et dimanche</h3>
<p class="detail-highlight">12h — 18h</p>
<p>Dates à définir ultérieurement</p>
</article>
<article class="detail-card detail-card-place reveal reveal-delay-1">
<span class="detail-label">Le lieu</span>
<h3>Au Mélilot</h3>
<p>Chemin des Humas<br>65200 Gerde</p>
<a href="https://www.google.com/maps/search/?api=1&amp;query=Au%20M%C3%A9lilot%2C%20chemin%20des%20Humas%2C%2065200%20Gerde" target="_blank" rel="noreferrer">Voir l'itinéraire <span aria-hidden="true">↗</span></a>
</article>
<article class="detail-card detail-card-price reveal reveal-delay-2">
<span class="detail-label">La contribution</span>
<p class="price">150<span>€</span></p>
<p>Pour le stage complet de deux jours.</p>
</article>
</div>
</section>

<section class="contact" aria-labelledby="contact-title">
<div class="contact-moon" aria-hidden="true"></div>
<p class="eyebrow"><span></span> UNE QUESTION, UNE PRÉINSCRIPTION ?</p>
<h2 id="contact-title">Le voyage commence<br>par <em>un échange.</em></h2>
<p>Je vous réponds directement pour vous renseigner sur le stage et les prochaines dates, où que vous soyez en France.</p>
<div class="contact-actions">
<a class="phone-link" href="tel:{TEL}"><span>{TEL_AFF}</span><span class="phone-arrow" aria-hidden="true">↗</span></a>
<a class="phone-link phone-link-outline" href="/rappel/"><span>Être rappelé</span><span class="phone-arrow" aria-hidden="true">→</span></a>
</div>
<p class="contact-name"><a href="/alexandre/">Alexandre Godgenger</a></p>
</section>"""

website_ld = f"""{{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Tamboulou",
  "url": "{BASE}/",
  "inLanguage": "fr",
  "publisher": {{"@id": "{BASE}/#org"}}
}}"""

pages.append(page(
    "/",
    "Tamboulou — L'école du chaman | Initiation au chamanisme, Pyrénées",
    "Stage d'initiation aux pratiques chamaniques dans les Hautes-Pyrénées : voyage chamanique au tambour, exploration des mondes, rencontre de l'animal totem. Ouvert à toute la France.",
    landing_main,
    extra_ld=[website_ld],
))

# ---------------------------------------------------- Formation
formation_body = f"""
<h2>Un stage d'initiation au chamanisme, ouvert aux débutants</h2>
<p>Cette formation de deux jours pose les premières bases de la pratique chamanique. Aucune expérience préalable n'est nécessaire : le stage s'adresse à toute personne curieuse d'explorer le <a href="/voyage-chamanique/">voyage chamanique</a>, dans un cadre simple, bienveillant et concret. Guidé par <a href="/alexandre/">Alexandre Godgenger</a>, vous apprenez à pratiquer par vous-même — l'objectif est de repartir autonome, avec une pratique que vous pouvez poursuivre chez vous.</p>

<h2>Le programme : trois seuils à franchir</h2>
<h3>1. Entrer en voyage</h3>
<p>Apprendre à créer les conditions d'un voyage chamanique : la posture, l'intention, l'écoute du tambour. Le rythme régulier du tambour sert de fil conducteur — c'est lui qui ouvre le passage et qui ramène.</p>
<h3>2. Explorer les mondes</h3>
<p>Prendre le temps de découvrir les différents espaces du voyage — monde d'en bas, monde du milieu, monde d'en haut — et d'apprivoiser leur géographie intérieure, à votre rythme.</p>
<h3>3. Rencontrer l'animal totem</h3>
<p>Faire la rencontre d'un <a href="/animal-totem/">animal totem</a>, d'abord pour soi, puis pour quelqu'un d'autre : c'est le premier pas vers une pratique tournée aussi vers l'autre.</p>

<h2>Informations pratiques</h2>
<ul>
<li><strong>Durée</strong> : deux jours — samedi et dimanche, de 12h à 18h.</li>
<li><strong>Dates</strong> : les prochaines dates sont définies au fil de l'année. Contactez Alexandre au <a href="tel:{TEL}">{TEL_AFF}</a> pour connaître les prochaines sessions et réserver votre place.</li>
<li><strong>Lieu</strong> : Au Mélilot, chemin des Humas, 65200 Gerde — au pied des Pyrénées, à côté de Bagnères-de-Bigorre (Hautes-Pyrénées, Occitanie).</li>
<li><strong>Tarif</strong> : 150 € pour le stage complet de deux jours.</li>
<li><strong>Groupe</strong> : en petit groupe, pour préserver la qualité de l'accompagnement.</li>
<li><strong>Préinscription</strong> : par téléphone, au <a href="tel:{TEL}">{TEL_AFF}</a> — un échange direct permet de répondre à vos questions et de réserver votre place. Aucun paiement en ligne. Vous pouvez aussi <a href="/rappel/">demander à être rappelé</a>.</li>
</ul>

<h2>Venir de toute la France</h2>
<p>Le stage accueille des participants de toute la France — beaucoup profitent du week-end pour découvrir les Pyrénées. Gerde se trouve aux portes de Bagnères-de-Bigorre :</p>
<ul>
<li><strong>En train</strong> : gare de Tarbes (~20 min en voiture), reliée à Paris, Bordeaux et Toulouse.</li>
<li><strong>En avion</strong> : aéroport de Tarbes-Lourdes-Pyrénées (~30 min).</li>
<li><strong>En voiture</strong> : autoroute A64, sortie Tarbes, direction Bagnères-de-Bigorre.</li>
<li><strong>Se loger</strong> : Bagnères-de-Bigorre, ville thermale à quelques minutes du lieu du stage, offre de nombreux hébergements pour la nuit du samedi.</li>
</ul>
<p>Pour organiser votre venue (covoiturage, hébergement, horaires de train), le plus simple est d'en parler directement avec Alexandre lors de votre inscription.</p>

<h2>Ce que ce stage n'est pas</h2>
<p>Le chamanisme proposé ici est une pratique d'exploration personnelle, transmise avec exigence et simplicité. Ce stage ne remplace ni un avis médical ni un suivi thérapeutique. Les questions courantes — préparation, contre-indications, déroulé — sont traitées dans la <a href="/faq/">foire aux questions</a>.</p>
"""

course_ld = f"""{{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Formation chamanisme — stage d'initiation de 2 jours",
  "description": "Stage d'initiation aux pratiques chamaniques : voyage au tambour, exploration des mondes, rencontre de l'animal totem. Ouvert aux débutants, en petit groupe, dans les Hautes-Pyrénées.",
  "url": "{BASE}/formation-chamanisme/",
  "inLanguage": "fr",
  "provider": {{"@id": "{BASE}/#org"}},
  "offers": {{"@type": "Offer", "price": "150", "priceCurrency": "EUR", "category": "Paid"}},
  "hasCourseInstance": {{
    "@type": "CourseInstance",
    "courseMode": "onsite",
    "courseWorkload": "P2D",
    "location": {{"@type": "Place", "name": "Au Mélilot", "address": {{"@type": "PostalAddress", "streetAddress": "Chemin des Humas", "postalCode": "65200", "addressLocality": "Gerde", "addressCountry": "FR"}}}}
  }}
}}"""

pages.append(content_page(
    "/formation-chamanisme/",
    "La formation",
    "Formation chamanisme : un stage <em>d'initiation</em> de deux jours",
    "Apprendre le voyage chamanique au tambour, explorer les mondes et rencontrer son animal totem — un week-end dans les Pyrénées, ouvert aux débutants de toute la France.",
    formation_body,
    "Formation chamanisme : stage d'initiation 2 jours | Tamboulou",
    "Stage d'initiation au chamanisme dans les Pyrénées : programme, dates, tarif (150 € les 2 jours), accès depuis toute la France. Voyage au tambour, mondes, animal totem.",
    extra_ld=[course_ld],
    cta=False,
))

# ---------------------------------------------------- Voyage chamanique
voyage_body = """
<h2>Qu'est-ce qu'un voyage chamanique ?</h2>
<p>Le voyage chamanique est la pratique centrale de la plupart des traditions chamaniques, des steppes de Sibérie aux Amériques. Porté par un rythme régulier — le plus souvent celui du tambour — le pratiquant entre dans un état de conscience modifié léger, comparable à celui qui précède le sommeil, tout en restant présent et maître de son expérience. Dans cet état, il « voyage » : il explore un paysage intérieur peuplé d'images, de rencontres et de symboles.</p>
<p>Il ne s'agit ni de transe spectaculaire ni de perte de contrôle. Le voyage chamanique est une pratique douce, structurée, que l'on apprend pas à pas — et que chacun vit à sa manière.</p>

<h2>Le tambour, un passage</h2>
<p>Le battement régulier du tambour, autour de quatre coups par seconde, accompagne naturellement le cerveau vers cet état de rêverie éveillée. C'est le fil que l'on suit pour partir — et c'est aussi lui qui ramène : un changement de rythme convenu marque la fin du voyage. C'est pourquoi le tambour est au cœur de la transmission chez Tamboulou : on apprend d'abord à l'écouter, puis à se laisser porter.</p>

<h2>Les trois mondes</h2>
<p>La plupart des traditions décrivent la même carte : un axe qui relie trois espaces.</p>
<ul>
<li><strong>Le monde d'en bas</strong> — celui des racines, de la nature, des animaux. C'est là que l'on fait généralement la rencontre de son <a href="/animal-totem/">animal totem</a>.</li>
<li><strong>Le monde du milieu</strong> — le nôtre, perçu autrement.</li>
<li><strong>Le monde d'en haut</strong> — celui des guides et des figures d'enseignement.</li>
</ul>
<p>Chaque monde a sa tonalité propre, et l'exploration se fait progressivement, voyage après voyage.</p>

<h2>Comment apprend-on à voyager ?</h2>
<p>On apprend le voyage chamanique comme on apprend à nager : par la pratique, dans un cadre sûr, guidé par quelqu'un qui connaît le chemin. Lors du <a href="/formation-chamanisme/">stage d'initiation</a>, chaque voyage est préparé (l'intention, la posture, le départ), vécu au son du tambour, puis partagé — la parole après le voyage fait partie de l'apprentissage. En deux jours, la plupart des participants font leurs premiers voyages et repartent avec une pratique autonome.</p>

<h2>Faut-il « y croire » ?</h2>
<p>Non. Le voyage chamanique ne demande aucune adhésion à une croyance : c'est une pratique d'exploration, pas une religion. Chacun est libre d'interpréter ce qu'il vit — imaginaire profond, langage symbolique, rencontre avec l'invisible — selon sa propre sensibilité. Ce qui compte, c'est l'expérience vécue et ce qu'elle ouvre.</p>
"""

pages.append(content_page(
    "/voyage-chamanique/",
    "Le voyage chamanique",
    "Le voyage chamanique : <em>ouvrir le passage</em> au son du tambour",
    "Un état de conscience modifié léger, guidé par le rythme du tambour, pour explorer les mondes intérieurs. Ce qu'est le voyage chamanique — et comment on l'apprend.",
    voyage_body,
    "Qu'est-ce qu'un voyage chamanique ? | Tamboulou",
    "Le voyage chamanique expliqué simplement : l'état de conscience, le rôle du tambour, les trois mondes, et comment l'apprendre lors d'un stage d'initiation dans les Pyrénées.",
))

# ---------------------------------------------------- Animal totem
totem_body = """
<h2>Qu'est-ce qu'un animal totem ?</h2>
<p>Dans les traditions chamaniques, l'animal totem — on dit aussi animal de pouvoir ou animal allié — est une figure animale qui accompagne une personne, la protège et l'enseigne. Ce n'est pas un simple symbole que l'on choisirait dans un livre ou un test en ligne : c'est une rencontre, qui se vit au cours d'un <a href="/voyage-chamanique/">voyage chamanique</a>.</p>

<h2>Comment rencontre-t-on son animal totem ?</h2>
<p>La rencontre se fait le plus souvent dans le monde d'en bas, lors d'un voyage au tambour mené avec cette intention précise. L'animal se présente à sa manière — il peut apparaître plusieurs fois, s'approcher, guider. On apprend à le reconnaître, à dialoguer avec lui et à le retrouver au fil des voyages. C'est l'un des trois seuils du <a href="/formation-chamanisme/">stage d'initiation</a> : chaque participant part à la rencontre de son animal, à son rythme.</p>

<h2>Rencontrer un animal pour quelqu'un d'autre</h2>
<p>La tradition va plus loin : on peut voyager <em>pour</em> une autre personne, et lui ramener la rencontre faite pour elle. C'est un moment fort du stage — le premier geste d'une pratique tournée vers l'autre, qui demande justesse et humilité. On y découvre que le voyage chamanique n'est pas seulement une exploration personnelle, mais aussi une manière d'être en lien.</p>

<h2>Et après la rencontre ?</h2>
<p>L'animal totem n'est pas une carte que l'on range dans un tiroir : la relation se cultive. On le retrouve en voyage, on l'observe dans la nature, on apprend de ce qu'il est — sa manière de se déplacer, de se nourrir, d'habiter son territoire. Beaucoup de pratiquants décrivent cette relation comme un appui discret et durable dans leur vie quotidienne.</p>

<h2>Idées reçues</h2>
<ul>
<li><strong>« Mon animal totem correspond à mon signe ou à mon caractère. »</strong> Les correspondances toutes faites (dates de naissance, tests) relèvent du jeu, pas de la pratique chamanique : l'animal ne se déduit pas, il se rencontre.</li>
<li><strong>« Il faut un don particulier. »</strong> Non — la rencontre est accessible à toute personne qui apprend le voyage, avec un guide et un cadre.</li>
<li><strong>« C'est réservé aux initiés. »</strong> Le stage s'adresse justement aux débutants : la première rencontre a souvent lieu dès le premier week-end.</li>
</ul>
"""

pages.append(content_page(
    "/animal-totem/",
    "L'animal totem",
    "L'animal totem : une rencontre <em>qui se vit,</em> pas un test",
    "L'animal totem se rencontre au cours d'un voyage chamanique, pour soi puis pour autrui. Ce qu'il est, comment le rencontrer, et comment cultiver la relation.",
    totem_body,
    "Animal totem : comment le rencontrer ? | Tamboulou",
    "L'animal totem ne se choisit pas, il se rencontre lors d'un voyage chamanique au tambour. Comprendre ce qu'il est et apprendre à le rencontrer lors d'un stage d'initiation.",
))

# ---------------------------------------------------- FAQ
faq_items = [
    ("Faut-il une expérience préalable pour participer au stage ?",
     "Non. Le stage d'initiation s'adresse d'abord aux débutants : tout est transmis pas à pas, du premier contact avec le tambour jusqu'aux premiers voyages. La curiosité et l'ouverture suffisent."),
    ("Qu'est-ce qu'un voyage chamanique, concrètement ?",
     "C'est une exploration intérieure menée dans un état de conscience modifié léger, guidé par le rythme du tambour. On reste conscient et présent du début à la fin. Le déroulé complet est expliqué sur la page dédiée au voyage chamanique."),
    ("Comment se déroule le week-end ?",
     "Le stage a lieu le samedi et le dimanche, de 12h à 18h, au Mélilot à Gerde (Hautes-Pyrénées). Les journées alternent transmission, voyages au tambour et temps de partage, en petit groupe."),
    ("Que faut-il apporter ?",
     "Une tenue confortable, de quoi s'allonger ou se couvrir (plaid, coussin) et un carnet pour noter vos voyages. Le reste — tambour compris — est fourni sur place. Les détails pratiques sont précisés lors de l'inscription."),
    ("Où se déroule le stage et comment venir ?",
     "Au Mélilot, chemin des Humas, 65200 Gerde, à côté de Bagnères-de-Bigorre. Le lieu est accessible de toute la France : gare de Tarbes à ~20 minutes, aéroport de Tarbes-Lourdes-Pyrénées à ~30 minutes, autoroute A64. Les possibilités d'hébergement à proximité sont détaillées sur la page de la formation."),
    ("Combien coûte le stage et comment se préinscrire ?",
     "Le stage complet de deux jours coûte 150 €. La préinscription se fait par téléphone au 06 64 97 77 49, après un échange direct avec Alexandre — l'occasion de poser toutes vos questions. Aucun paiement en ligne : vous réservez simplement votre place."),
    ("Le chamanisme est-il une religion ? Faut-il y croire ?",
     "Non. Le chamanisme tel qu'il est transmis ici est une pratique d'exploration, pas une croyance ni une religion. Chacun interprète librement ce qu'il vit, selon sa propre sensibilité."),
    ("Y a-t-il des contre-indications ?",
     "Le voyage chamanique est une pratique douce, mais elle sollicite l'attention et l'intériorité. Elle ne remplace ni un avis médical ni un suivi thérapeutique. En cas de doute — notamment de fragilité psychologique en cours — parlez-en simplement avec Alexandre avant de vous inscrire."),
    ("Peut-on continuer à pratiquer seul après le stage ?",
     "Oui, c'est précisément l'objectif : repartir autonome, avec une méthode claire pour voyager chez soi. Le stage donne les repères — l'intention, le cadre, le rythme — pour poursuivre la pratique en sécurité."),
    ("Peut-on venir de loin pour un seul week-end ?",
     "Oui, des participants viennent de toute la France. Les horaires (12h—18h) laissent le temps d'arriver le samedi matin et de repartir le dimanche soir, et Bagnères-de-Bigorre offre de nombreux hébergements pour la nuit."),
]

faq_body = "\n".join(
    f"""<details class="faq-item"{' open' if i == 0 else ''}>
<summary><h2>{q}</h2></summary>
<p>{a}</p>
</details>""" for i, (q, a) in enumerate(faq_items))
faq_body += """
<p class="faq-more">Une question qui ne figure pas ici ? <a href="tel:+33664977749">Appelez directement Alexandre</a> — ou explorez les pages <a href="/voyage-chamanique/">voyage chamanique</a> et <a href="/animal-totem/">animal totem</a>.</p>
"""

def esc_json(s):
    return s.replace('"', '\\"')

faq_ld = ('{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": ['
          + ", ".join(
              f'{{"@type": "Question", "name": "{esc_json(q)}", "acceptedAnswer": {{"@type": "Answer", "text": "{esc_json(a)}"}}}}'
              for q, a in faq_items)
          + "]}")

pages.append(content_page(
    "/faq/",
    "Questions fréquentes",
    "Questions <em>fréquentes</em>",
    "Tout ce qu'il faut savoir avant de s'inscrire au stage d'initiation : déroulé, préparation, accès, tarif, contre-indications.",
    faq_body,
    "Stage de chamanisme : questions fréquentes | Tamboulou",
    "Faut-il une expérience préalable ? Que faut-il apporter ? Comment venir de toute la France ? Les réponses aux questions les plus posées sur le stage d'initiation au chamanisme.",
    extra_ld=[faq_ld],
))

# ---------------------------------------------------- Alexandre
alexandre_body = f"""
<h2>Du soin du corps aux pratiques chamaniques</h2>
<p>Alexandre Godgenger est <strong>ostéopathe D.O. et masseur-kinésithérapeute</strong> de formation, installé à Bagnères-de-Bigorre, au pied des Pyrénées. Son chemin ne suit pas la ligne droite : parti d'une licence de mathématiques, c'est la découverte du massage qui l'oriente vers le soin à la personne — la masso-kinésithérapie à Lille, puis l'ostéopathie à l'Institut Supérieur d'Ostéopathie du Grand Montpellier, complétées par des formations en énergétique chinoise et en thérapie manuelle périnatale et pédiatrique.</p>
<p>Transmettre fait déjà partie de son métier : il a co-animé des formations en diagnostic neuromoteur et rééducation neuromotrice de l'enfant, et mis sa pratique au service d'actions humanitaires à Madagascar et en Malaisie. C'est ce parcours, ancré depuis des années dans l'écoute du corps, qui l'a conduit vers les pratiques chamaniques et le tambour. Avec Tamboulou — l'école du chaman — il ouvre un espace pour transmettre le <a href="/voyage-chamanique/">voyage chamanique</a> à ceux qui veulent l'apprendre, en complément de son activité de praticien, dont vous trouverez le détail sur <a href="https://alexandre-godgenger.fr/" rel="noreferrer">alexandre-godgenger.fr</a>.</p>

<h2>Une transmission simple et exigeante</h2>
<p>Sa manière de transmettre tient en quelques mots : simplicité, justesse, respect du rythme de chacun. Pas de mise en scène ni de folklore — une pratique claire, apprise par l'expérience, partagée en petit groupe au Mélilot, à Gerde.</p>
<p>Au cœur de sa transmission, le tambour : c'est lui qui ouvre le passage du <a href="/voyage-chamanique/">voyage chamanique</a>, lui qui accompagne l'exploration des mondes et la rencontre de <a href="/animal-totem/">l'animal totem</a>.</p>

<blockquote>« Je vous invite à écouter le tambour, ouvrir le passage et partir à la rencontre des mondes qui nous entourent. »</blockquote>

<h2>L'esprit de l'école</h2>
<p>Tamboulou — l'école du chaman — est née d'une conviction : le voyage chamanique s'apprend, comme un artisanat. Il demande un cadre, un guide et de la pratique ; il ne demande ni don particulier ni croyance. L'objectif de chaque stage est l'autonomie : que chacun reparte capable de voyager par lui-même, et de faire vivre cette pratique dans sa propre vie.</p>

<h2>Échanger avant de se préinscrire</h2>
<p>Le chemin commence toujours par un échange. Avant toute préinscription au <a href="/formation-chamanisme/">stage d'initiation</a>, Alexandre prend le temps de répondre à vos questions par téléphone — le déroulé, la préparation, l'accès au lieu, ou simplement ce qui vous amène.</p>
<p><a href="tel:{TEL}"><strong>{TEL_AFF}</strong></a> · <a href="mailto:alexandregodgenger@gmail.com">alexandregodgenger@gmail.com</a></p>
"""

person_ld = f"""{{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Alexandre Godgenger",
  "url": "{BASE}/alexandre/",
  "telephone": "{TEL}",
  "jobTitle": "Ostéopathe D.O., masseur-kinésithérapeute et enseignant en pratiques chamaniques",
  "sameAs": ["https://alexandre-godgenger.fr/"],
  "worksFor": {{"@id": "{BASE}/#org"}},
  "workLocation": {{"@type": "Place", "name": "Au Mélilot", "address": {{"@type": "PostalAddress", "addressLocality": "Gerde", "postalCode": "65200", "addressCountry": "FR"}}}}
}}"""

pages.append(content_page(
    "/alexandre/",
    "Alexandre Godgenger",
    "Alexandre Godgenger, <em>votre guide</em>",
    "Fondateur de Tamboulou, l'école du chaman. Une transmission du voyage chamanique simple, exigeante et respectueuse du rythme de chacun.",
    alexandre_body,
    "Alexandre Godgenger, guide des stages Tamboulou",
    "Alexandre Godgenger guide les stages d'initiation au chamanisme de Tamboulou, à Gerde dans les Hautes-Pyrénées : transmission du voyage au tambour, simple et exigeante.",
    extra_ld=[person_ld],
))

# ---------------------------------------------------- Rappel (formulaire)
rappel_main = f"""<section class="page-head">
{breadcrumb_html([("Accueil", "/"), ("Être rappelé", None)])}
<h1>Laissez-nous <em>vos coordonnées</em></h1>
<p class="lede">Vous préférez qu'Alexandre vous appelle ? Indiquez votre numéro et le moment qui vous arrange — il vous rappelle pour répondre à vos questions ou prendre votre préinscription.</p>
</section>
<div class="rappel-wrap">
<p id="form-erreur" class="form-banner" hidden>Le formulaire n'a pas pu être envoyé : vérifiez votre nom et votre numéro de téléphone, puis réessayez.</p>
<div class="form-shell">
<div class="form-intro">
<div class="form-intro-moon" aria-hidden="true"></div>
<p class="eyebrow"><span></span> DEMANDE DE RAPPEL</p>
<h2>Le voyage commence par <em>un échange.</em></h2>
<ul class="form-points">
<li>Alexandre vous rappelle personnellement</li>
<li>Sans engagement — juste vos questions</li>
<li>Coordonnées jamais partagées</li>
</ul>
<p class="form-intro-tel">Ou appelez directement<br><a href="tel:{TEL}">{TEL_AFF} <span aria-hidden="true">↗</span></a></p>
</div>
<form class="form-fields" method="post" action="/rappel/envoyer.php">
<div class="form-field">
<label for="f-nom">Prénom et nom</label>
<input id="f-nom" name="nom" type="text" required autocomplete="name" maxlength="100" placeholder="Camille Dupont">
</div>
<div class="form-field">
<label for="f-tel">Téléphone</label>
<input id="f-tel" name="telephone" type="tel" required autocomplete="tel" maxlength="30" placeholder="06 12 34 56 78">
</div>
<div class="form-field">
<label for="f-moment">Quand vous rappeler ? <em>facultatif</em></label>
<input id="f-moment" name="moment" type="text" maxlength="120" placeholder="En semaine après 18h">
</div>
<div class="form-field">
<label for="f-msg">Ce qui vous amène <em>facultatif</em></label>
<textarea id="f-msg" name="message" rows="3" maxlength="1000" placeholder="Vos questions, ce qui vous attire dans le stage…"></textarea>
</div>
<p class="trap-field" aria-hidden="true"><label>Ne pas remplir ce champ<input name="site_web" type="text" tabindex="-1" autocomplete="off"></label></p>
<button class="button button-primary form-submit" type="submit">Être rappelé <span aria-hidden="true">→</span></button>
<p class="form-note"><a href="/mentions-legales/">Vos données restent entre nous</a></p>
</form>
</div>
</div>
<script>if(new URLSearchParams(location.search).has('erreur')){{document.getElementById('form-erreur').hidden=false;}}</script>"""

pages.append(page(
    "/rappel/",
    "Être rappelé par Alexandre | Tamboulou",
    "Laissez votre numéro et le moment qui vous arrange : Alexandre vous rappelle pour répondre à vos questions sur le stage d'initiation au chamanisme ou prendre votre préinscription.",
    rappel_main,
    extra_ld=[breadcrumb_ld([("Accueil", "/"), ("Être rappelé", None)])],
))

merci_main = f"""<section class="page-head">
{breadcrumb_html([("Accueil", "/"), ("Merci", None)])}
<h1>C'est noté, <em>merci !</em></h1>
<p class="lede">Votre demande est bien envoyée : Alexandre vous rappellera au moment indiqué. D'ici là, vous pouvez continuer la découverte.</p>
</section>
<article class="prose">
<ul>
<li><a href="/formation-chamanisme/">Le programme complet du stage d'initiation</a></li>
<li><a href="/voyage-chamanique/">Comprendre le voyage chamanique</a></li>
<li><a href="/faq/">Les questions fréquentes</a></li>
</ul>
<p>Besoin d'une réponse tout de suite ? <a href="tel:{TEL}"><strong>{TEL_AFF}</strong></a></p>
</article>"""

page(
    "/rappel/merci/",
    "Demande envoyée | Tamboulou",
    "Votre demande de rappel est bien envoyée.",
    merci_main,
)

# ---------------------------------------------------- Mentions légales
mentions_body = f"""
<h2>Éditeur du site</h2>
<p>Le site Tamboulou est édité par Alexandre Godgenger.<br>
Contact : <a href="tel:{TEL}">{TEL_AFF}</a> · <a href="mailto:alexandregodgenger@gmail.com">alexandregodgenger@gmail.com</a><br>
Lieu des stages : Au Mélilot, chemin des Humas, 65200 Gerde, France.</p>

<h2>Hébergement</h2>
<p>Le site est hébergé par Hostinger International Ltd.<br>
61 Lordou Vironos Street, 6023 Larnaca, Chypre — <a href="https://www.hostinger.fr" rel="noreferrer">hostinger.fr</a></p>

<h2>Propriété intellectuelle</h2>
<p>L'ensemble des contenus de ce site (textes, illustrations, identité visuelle) est la propriété de son éditeur, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.</p>

<h2>Données personnelles</h2>
<p>Ce site n'utilise ni cookies ni traceurs. Le seul traitement de données est le <a href="/rappel/">formulaire de demande de rappel</a> : les coordonnées transmises (nom, téléphone, éventuel message) servent uniquement à vous rappeler, ne sont communiquées à aucun tiers et sont supprimées une fois la demande traitée. Conformément au RGPD, vous pouvez demander à tout moment l'accès, la rectification ou la suppression de vos données en écrivant à <a href="mailto:alexandregodgenger@gmail.com">alexandregodgenger@gmail.com</a>.</p>

<h2>Responsabilité</h2>
<p>Les contenus de ce site sont proposés à titre d'information sur une pratique d'exploration personnelle. Ils ne constituent en aucun cas un avis médical, et les stages proposés ne se substituent ni à un traitement ni à un suivi thérapeutique.</p>
"""

pages.append(content_page(
    "/mentions-legales/",
    "Mentions légales",
    "Mentions <em>légales</em>",
    "Informations légales du site Tamboulou.",
    mentions_body,
    "Mentions légales | Tamboulou",
    "Mentions légales du site Tamboulou : éditeur, hébergement, propriété intellectuelle et données personnelles.",
    cta=False,
))

# ---------------------------------------------------- sitemap & robots
priorities = {"/": "1.0", "/formation-chamanisme/": "0.9", "/voyage-chamanique/": "0.8",
              "/animal-totem/": "0.8", "/faq/": "0.7", "/alexandre/": "0.6",
              "/rappel/": "0.5", "/mentions-legales/": "0.2"}
urls = "\n".join(
    f"<url><loc>{BASE}{p}</loc><lastmod>{LASTMOD}</lastmod><priority>{priorities[p]}</priority></url>"
    for p in pages)
with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write(f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
""")

with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")

print("Pages générées :", ", ".join(pages))
