import Link from "next/link";
import "./home.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

function MapArtwork() {
  return (
    <div className="home-map-art" aria-hidden="true">
      <svg viewBox="0 0 860 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern
            id="home-grid"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="#b5d4cc"
              strokeOpacity=".1"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="home-glow">
            <stop stopColor="#74e0b0" stopOpacity=".42" />
            <stop offset="1" stopColor="#74e0b0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="home-alert">
            <stop stopColor="#ffb272" stopOpacity=".58" />
            <stop offset="1" stopColor="#ffb272" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="860" height="650" fill="url(#home-grid)" />
        <path
          d="M-40 130 Q210 92 420 158 T900 78 M-50 268 Q260 208 462 282 T900 212 M-50 438 Q160 392 386 456 T900 374 M-30 594 Q220 536 430 584 T920 524"
          stroke="#b6d7d0"
          strokeOpacity=".18"
          fill="none"
          strokeWidth="16"
        />
        <path
          d="M170-40 Q230 160 164 352 T220 690 M402-20 Q444 176 390 348 T448 690 M654-20 Q592 186 676 346 T642 690"
          stroke="#b6d7d0"
          strokeOpacity=".13"
          fill="none"
          strokeWidth="11"
        />
        <path
          d="M82-40 Q105 152 75 340 T115 690"
          stroke="#397f8f"
          strokeOpacity=".7"
          fill="none"
          strokeWidth="45"
        />
        <path
          d="M84-40 Q106 154 77 342 T114 690"
          stroke="#73b8bb"
          strokeOpacity=".24"
          fill="none"
          strokeWidth="17"
        />
        <circle cx="474" cy="226" r="160" fill="url(#home-alert)" />
        <circle cx="680" cy="450" r="190" fill="url(#home-glow)" />
        <circle cx="310" cy="488" r="128" fill="url(#home-alert)" />
        <g fill="none" stroke="#ffb272" strokeOpacity=".52">
          <circle cx="474" cy="226" r="76" />
          <circle cx="474" cy="226" r="112" />
          <circle cx="310" cy="488" r="66" />
        </g>
        <g fill="#f5f9f5" stroke="#1d5e58" strokeWidth="5">
          <circle cx="488" cy="215" r="12" />
          <circle cx="540" cy="274" r="11" />
          <circle cx="671" cy="450" r="12" />
          <circle cx="624" cy="496" r="10" />
          <circle cx="286" cy="475" r="11" />
          <circle cx="350" cy="525" r="9" />
        </g>
        <g fill="#ffbd85">
          <circle cx="454" cy="237" r="6" />
          <circle cx="515" cy="194" r="6" />
          <circle cx="299" cy="504" r="6" />
        </g>
        <g
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2"
          fill="#d5e9df"
          opacity=".8"
        >
          <text x="555" y="165">
            SETOR NORTE
          </text>
          <text x="644" y="387">
            SETOR LESTE
          </text>
          <text x="208" y="405">
            SETOR SUL
          </text>
        </g>
      </svg>
      <div className="home-map-chip home-map-chip-top">
        <span className="home-chip-dot" /> VISÃO TERRITORIAL{" "}
        <strong>3 áreas em revisão</strong>
      </div>
      <div className="home-map-chip home-map-chip-bottom">
        <span>◉</span>
        <div>
          <strong>Da evidência à equipe</strong>
          <small>Sinais, cobertura e decisão no mesmo fluxo.</small>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="marketing-home" id="conteudo">
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="VIGIA+, início">
          <span className="home-brand-mark">V+</span>
          <span>VIGIA+</span>
        </Link>
        <nav aria-label="Navegação da página inicial">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-prefeituras">Para prefeituras</a>
        </nav>
        <Link className="home-nav-action" href="/painel">
          Explorar plataforma <Arrow diagonal />
        </Link>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <MapArtwork />
        <div className="home-hero-shade" />
        <div className="home-hero-content">
          <p className="home-eyebrow">
            INTELIGÊNCIA TERRITORIAL PARA A VIGILÂNCIA
          </p>
          <h1 id="home-title">
            Onde o sinal aparece.
            <br />
            <em>A ação começa.</em>
          </h1>
          <p className="home-hero-description">
            Reúna notificações, atividade de campo e focos em uma leitura clara
            do território. Ajude a equipe municipal a revisar prioridades e
            acompanhar o que acontece depois.
          </p>
          <div className="home-hero-actions">
            <Link className="home-button home-button-light" href="/hotspots">
              Explorar mapa demonstrativo <Arrow diagonal />
            </Link>
            <Link
              className="home-button home-button-outline"
              href="/priorizacao-territorial"
            >
              Ver a decisão em ação <Arrow />
            </Link>
          </div>
          <p className="home-hero-note">
            Protótipo acadêmico · dados e mapa ilustrativos
          </p>
        </div>
        <div className="home-hero-bottom">
          <span>DA VIGILÂNCIA À OPERAÇÃO</span>
          <a href="#como-funciona">
            Conheça o fluxo <span aria-hidden="true">↓</span>
          </a>
          <span>RECIFE · EXEMPLO VISUAL</span>
        </div>
      </section>

      <section id="como-funciona" className="home-section home-workflow">
        <div className="home-section-heading">
          <p className="home-eyebrow home-eyebrow-dark">
            UM FLUXO, TRÊS DECISÕES
          </p>
          <h2>
            Olhe mais de perto.
            <br />
            Aja com contexto.
          </h2>
          <p>
            O VIGIA+ aproxima dados, análise e equipe. Cada etapa ajuda a
            transformar um sinal territorial em uma decisão revisável.
          </p>
        </div>
        <div className="home-workflow-grid">
          <article className="home-workflow-card">
            <span className="home-card-number">01 / OBSERVAR</span>
            <div className="home-card-icon">◉</div>
            <h3>Veja o território.</h3>
            <p>
              Camadas de atividade dos agentes e focos registrados mostram onde
              a operação se concentra.
            </p>
            <Link href="/hotspots">
              Abrir mapa <Arrow />
            </Link>
          </article>
          <article className="home-workflow-card">
            <span className="home-card-number">02 / ENTENDER</span>
            <div className="home-card-icon">⌁</div>
            <h3>Entenda o sinal.</h3>
            <p>
              Indicadores e motivos de cada prioridade ficam visíveis para a
              revisão da vigilância.
            </p>
            <Link href="/priorizacao-territorial">
              Revisar prioridades <Arrow />
            </Link>
          </article>
          <article className="home-workflow-card">
            <span className="home-card-number">03 / COORDENAR</span>
            <div className="home-card-icon">↗</div>
            <h3>Planeje a resposta.</h3>
            <p>
              O gestor compara cenários e encaminha decisões para o fluxo de
              campo aprovado pela prefeitura.
            </p>
            <Link href="/painel">
              Explorar painel <Arrow />
            </Link>
          </article>
        </div>
      </section>

      <section className="home-focus-section" id="para-prefeituras">
        <div className="home-focus-inner">
          <div>
            <p className="home-eyebrow">FEITO PARA O DIA A DIA MUNICIPAL</p>
            <h2>
              O mapa mostra.
              <br />A equipe decide.
            </h2>
          </div>
          <div>
            <p>
              Uma plataforma pensada para a coordenação, o epidemiologista e os
              agentes de campo. A leitura territorial é um apoio: nenhum mapa
              substitui a validação dos dados ou a decisão da vigilância.
            </p>
            <Link className="home-button home-button-light" href="/hotspots">
              Conhecer o espaço operacional <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <Link className="home-brand" href="/">
          <span className="home-brand-mark">V+</span>
          <span>VIGIA+</span>
        </Link>
        <p>Protótipo acadêmico de apoio à vigilância de arboviroses.</p>
        <Link href="/painel">
          Entrar na demonstração <Arrow diagonal />
        </Link>
      </footer>
    </main>
  );
}
