import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../lib/auth'
import type { LoggedUser } from '../lib/auth'
import { Icon } from './Icon'

type Props = {
  onLogin: (user: LoggedUser) => void
}

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const user = login(name, code)
      if (user) {
        onLogin(user)
      } else {
        setError('Nome ou código incorreto.')
        setLoading(false)
      }
    }, 300)
  }

  function scrollToLogin() {
    document
      .getElementById('entrar')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="landing">
      <div className="landing__glow landing__glow--peach" aria-hidden="true" />
      <div className="landing__glow landing__glow--mint" aria-hidden="true" />

      <div className="landing__inner">
        <nav className="landing__nav">
          <span className="landing__brand">
            <span className="landing__brand-mark">Ay</span>
            <span className="landing__brand-copy">Amigos yTubers Rolês</span>
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={scrollToLogin}
          >
            Entrar
          </button>
        </nav>

        <section className="landing-hero">
          <span className="landing-hero__tag">
            <span className="landing-hero__tag-dot" />
            um app privado para a turma decidir melhor
          </span>

          <h1 className="landing-hero__title">
            Menos caos no grupo.
            <span> Mais vontade de sair.</span>
          </h1>

          <p className="landing-hero__sub">
            Sugira rolês, acompanhe ideias, escolha o próximo encontro e use a
            IA como apoio divertido sem perder a simplicidade do MVP.
          </p>

          <div className="landing-hero__ctas">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={scrollToLogin}
            >
              Bora entrar
            </button>
            <a
              className="btn btn--secondary btn--lg"
              href="#como-funciona"
              onClick={(event) => {
                event.preventDefault()
                document
                  .getElementById('como-funciona')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Como funciona
            </a>
          </div>
        </section>

        <section className="landing-showcase" aria-hidden="true">
          <article className="landing-showcase__card">
            <div className="landing-showcase__topline">
              <span className="chip chip--sm chip--primary">Próximo rolê</span>
              <span>Sáb · 22 nov</span>
            </div>
            <div className="landing-showcase__title">Jantar + karaokê em Pinheiros</div>
            <p className="landing-showcase__text">
              Layout pensado para bater o olho no celular e entender rápido o
              que está pegando força.
            </p>
            <div className="landing-showcase__meta">
              <span className="chip chip--mint chip--sm">4 topam</span>
              <span className="chip chip--sm chip--icon">
                <Icon name="sparkle" size={12} />
                IA ajuda a destravar
              </span>
            </div>
          </article>

          <div className="landing-showcase__rail">
            <article className="landing-mini-card">
              <Icon name="users" size={18} />
              <div>
                <strong>Turma alinhada</strong>
                <span>Todo mundo entende a proposta mais rápido.</span>
              </div>
            </article>

            <article className="landing-mini-card">
              <Icon name="bookmark" size={18} />
              <div>
                <strong>Lugares salvos</strong>
                <span>Ideias privadas prontas para virar sugestão.</span>
              </div>
            </article>
          </div>
        </section>

        <section id="como-funciona">
          <h2 className="landing-section-title">Como a turma usa</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step__num">1</div>
              <div>
                <div className="landing-step__title">Sugere com contexto</div>
                <div className="landing-step__desc">
                  Título, data, lugar e vibe em poucos blocos bem organizados.
                </div>
              </div>
            </div>
            <div className="landing-step">
              <div className="landing-step__num">2</div>
              <div>
                <div className="landing-step__title">Acompanha ideias no radar</div>
                <div className="landing-step__desc">
                  A home mostra o que está ganhando força sem poluir a tela.
                </div>
              </div>
            </div>
            <div className="landing-step">
              <div className="landing-step__num">3</div>
              <div>
                <div className="landing-step__title">Decide o próximo encontro</div>
                <div className="landing-step__desc">
                  Confirmações, detalhes e lugares aparecem de forma mais
                  precisa no mobile.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="entrar" className="landing-login">
          <h2 className="landing-login__title">Entrar na turma</h2>
          <p className="landing-login__sub">
            Só quem tem o código certo acessa esse espaço.
          </p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-name">Nome</label>
              <input
                id="login-name"
                className="input"
                type="text"
                placeholder="filipe, victor, larissa..."
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-code">Código (4 dígitos)</label>
              <input
                id="login-code"
                className="input"
                type="password"
                placeholder="••••"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 4))
                }
                inputMode="numeric"
                maxLength={4}
              />
            </div>

            {error ? <p className="landing-login__error">{error}</p> : null}

            <button
              className="btn btn--primary btn--block btn--lg"
              type="submit"
              disabled={loading || !name.trim() || code.length !== 4}
            >
              {loading ? 'Entrando...' : 'Entrar na turma'}
            </button>
          </form>
        </section>

        <footer className="landing-footer">feito para a nossa galera · 2026</footer>
      </div>
    </div>
  )
}
