# Guia de Workflow de Release

Este documento descreve como o Kaes Keid Inspector publica versões da extensão,
gera o pacote compilado e monta o corpo da GitHub Release.

## Visão geral

O repositório possui três fluxos independentes:

| Evento | O que acontece | Workflow |
| --- | --- | --- |
| Push para `main` | Validação e build da aplicação | `.github/workflows/ci.yml` |
| Push para `main` | Publicação do site de demonstração | `.github/workflows/deploy.yml` |
| Push de `vX.Y.Z` | Build, empacotamento e GitHub Release | `.github/workflows/release.yml` |

Uma Release não é criada por um push comum para `main`. Ela nasce de uma tag de
versão:

```bash
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## Versionamento

A versão precisa estar sincronizada entre duas fontes:

- `version` no `package.json`
- `version` no `manifest.json`

O workflow compara ambas com a tag `vX.Y.Z` antes de executar o build. Se qualquer
uma estiver diferente, a Release falha antes da publicação.

## Arquivo publicado

O script de build já produz `kaes-keid-inspector.zip` contendo o conteúdo compilado
de `dist/`. Durante a Release, o workflow valida o ZIP e o renomeia para:

```text
kaes-keide-inspector-vX.Y.Z.zip
```

Esse arquivo é anexado diretamente à GitHub Release. O usuário final não precisa
instalar Node.js, Bun ou executar o processo de build.

## Corpo da Release

O workflow monta o corpo da Release em quatro partes principais:

1. **Imagem do produto** — usa uma captura específica da versão, quando disponível.
2. **O que tem de novo nesta versão** — conteúdo manual de `.github/release-notes/vX.Y.Z.md`.
3. **Instalação** — instruções para carregar o ZIP compilado no Chrome ou Edge.
4. **Lista de mudanças** — changelog técnico gerado automaticamente pelo GitHub.

### Imagem

Por padrão, é usada:

```text
docs/images/screens/optimized-kaes_keid-main.png
```

Para uma imagem específica da versão, crie:

```text
docs/images/releases/release-X.Y.Z.png
```

A imagem é referenciada pela própria tag da Release, evitando depender do estado
posterior de `main`.

### Notas manuais

Crie:

```text
.github/release-notes/vX.Y.Z.md
```

Use uma lista curta de mudanças relevantes para usuários. Não inclua cabeçalhos
`##`, pois o workflow já cria a seção.

Se o arquivo não existir, a Release continua sendo publicada com uma mensagem
indicando que não há notas específicas.

### Changelog automático

O workflow usa a API de geração de notas do GitHub e a configuração de
`.github/release.yml` para categorizar mudanças em:

- **Novidades e melhorias** — `enhancement` e `feature`
- **Correções** — `bug` e `fix`
- **Outras mudanças** — demais labels

PRs com `dependencies` ou `ignore-for-release`, além de autoria `dependabot`, são
excluídos do changelog.

## Processo recomendado

1. Atualize a versão em `package.json` e `manifest.json`.
2. Adicione `.github/release-notes/vX.Y.Z.md`.
3. Opcionalmente adicione `docs/images/releases/release-X.Y.Z.png`.
4. Rode localmente:

```bash
npm ci
npm run lint
npm test
npm run build
```

5. Envie as mudanças para `main` e aguarde a CI.
6. Crie e envie a tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

7. O workflow executa lint, testes, build, valida o ZIP, cria a Release e anexa o
   arquivo final.

## Execução manual

`Release Extension` também pode ser executado por `workflow_dispatch`, informando
uma tag existente. Isso é útil para republicar uma versão já criada no Git sem
criar uma nova tag.

## Regras

- Tags de Release devem seguir `vX.Y.Z`.
- `package.json`, `manifest.json` e a tag devem usar a mesma versão.
- O ZIP final é gerado no CI; não deve ser versionado no repositório.
- O changelog automático permanece recolhido para manter a Release legível.
- O texto destinado ao usuário deve permanecer sem emojis, mantendo o padrão das
  demais Releases.
