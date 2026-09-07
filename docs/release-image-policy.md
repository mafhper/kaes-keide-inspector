# Apêndice — Política e automação da imagem de Release

Este documento propõe uma política para automatizar o uso da imagem ilustrativa
nas GitHub Releases do Kaes Keid Inspector.

A proposta parte de uma regra editorial: a imagem representa uma **linha de versão
`major.minor`**, e não uma Release individual.

## 1. Política de versionamento da imagem

A imagem deve ser trocada quando houver mudança de `major` ou `minor`, mas não para
uma nova `patch` release.

| Transição | Nova imagem? |
| --- | --- |
| `v1.2.0 → v1.2.1` | Não |
| `v1.2.1 → v1.2.2` | Não |
| `v1.2.9 → v1.3.0` | Sim |
| `v1.3.0 → v1.3.1` | Não |
| `v1.9.x → v2.0.0` | Sim |

Assim:

```text
imagem da Release = identidade visual da linha major.minor
```

## 2. Arquivo da imagem

A recomendação é utilizar um único arquivo de trabalho:

```text
docs/
└── images/
    └── releases/
        └── release.webp
```

O nome deve permanecer simplesmente `release.webp`.

Não é necessário manter arquivos como:

```text
release-1.3.webp
release-v1.3.webp
release-2.0.webp
```

A versão histórica da imagem será preservada pelo próprio Git, pois a Release deve
referenciar o arquivo através da tag que contém aquela versão da imagem.

## 3. Por que não utilizar `main` na URL

A imagem utilizada nas notas da Release não deve apontar para `main`.

Não utilizar:

```text
/main/docs/images/releases/release.webp
```

Se `release.webp` for substituído posteriormente, uma URL baseada em `main` faria
uma Release antiga passar a mostrar a arte nova.

A URL deve utilizar a própria tag da Release:

```text
/<tag>/docs/images/releases/release.webp
```

Por exemplo:

```text
/v1.3.0/docs/images/releases/release.webp
```

Com isso, o histórico permanece estável:

```text
v1.2.x → imagem A
v1.3.x → imagem B
v2.0.x → imagem C
```

mesmo que o arquivo corrente no branch de desenvolvimento continue sendo apenas:

```text
docs/images/releases/release.webp
```

## 4. Detecção automática da troca de imagem

Para uma nova linha `major.minor`, o workflow deve verificar se `release.webp` foi
alterado desde a versão anterior.

A comparação deve utilizar o histórico Git, sem tentar analisar visualmente o
conteúdo do WebP:

```bash
git diff <TAG_ANTERIOR>..<TAG_ATUAL> -- docs/images/releases/release.webp
```

Se houver diferença, a nova imagem foi fornecida corretamente.

Se não houver diferença, a publicação deve ser considerada uma possível falha de
preparação da Release.

## 5. Algoritmo recomendado

O comportamento geral deve ser:

```text
obter versão atual
        │
        ▼
localizar tag anterior, quando existir
        │
        ▼
comparar major.minor
        │
        ├── igual ────────────────► patch release
        │                              │
        │                              ▼
        │                         reutilizar imagem
        │
        └── diferente ───────────► nova linha
                                       │
                                       ▼
                              release.webp foi alterado?
                                  │             │
                                 SIM           NÃO
                                  │             │
                                  ▼             ▼
                              publicar       falhar
```

A etapa de decisão da imagem deve exportar a URL final para a etapa responsável por
montar o corpo da GitHub Release.

Conceitualmente:

```text
release image step
        │
        └── IMAGE_URL
              │
              ▼
      release body step
              │
              ▼
        GitHub Release
```

## 6. Patch releases

Para versões como:

```text
v1.3.1
v1.3.2
v1.3.3
v1.3.4
```

não é necessário modificar a imagem.

O workflow utiliza a versão de `release.webp` presente na própria tag publicada.

## 7. Nova minor release

Ao passar de:

```text
v1.3.x → v1.4.0
```

o processo editorial deve ser:

1. substituir `docs/images/releases/release.webp`;
2. incluir a nova imagem no commit que originará a Release;
3. fazer merge em `main`;
4. criar a tag `v1.4.0`;
5. permitir que o workflow detecte a alteração;
6. criar a Release utilizando a nova imagem.

## 8. Nova major release

O mesmo princípio vale para:

```text
v1.9.x → v2.0.0
```

A alteração de `major` implica uma nova linha e, portanto, uma nova imagem.

## 9. Primeira Release

Se não existir uma tag anterior, não há comparação a realizar.

Nesse caso, o workflow deve apenas exigir que:

```text
docs/images/releases/release.webp
```

exista e contenha um arquivo válido.

Isso permite introduzir a política sem criar uma versão artificial apenas para
estabelecer um baseline.

## 10. Validação do arquivo

Independentemente do tipo de Release, o workflow deve verificar que o arquivo
existe e não está vazio:

```bash
test -f docs/images/releases/release.webp
test -s docs/images/releases/release.webp
```

Opcionalmente, pode-se validar também o MIME type ou a estrutura do arquivo para
confirmar que o conteúdo é realmente um WebP.

## 11. Integração com as Release Notes

A imagem deve permanecer no início do corpo da Release, antes das informações
textuais:

```html
<p align="center">
  <img
    src="IMAGE_URL"
    width="960"
    alt="Kaes Keid Inspector"
  />
</p>
```

Depois da imagem, permanecem as seções definidas no workflow de Release:

```text
introdução
    ↓
O que tem de novo nesta versão
    ↓
Instalação
    ↓
detalhes técnicos
    ↓
changelog automático
```

A imagem é um elemento editorial da apresentação da Release e não precisa ser
publicada como um asset separado.

## 12. Benefícios

Essa estratégia fornece:

- **Automação** — o workflow identifica quando uma nova imagem deveria existir.
- **Controle editorial** — a escolha da arte continua manual.
- **Histórico estável** — Releases antigas continuam mostrando sua imagem correta.
- **Repositório simples** — existe apenas um arquivo de trabalho `release.webp`.
- **Menos trabalho** — patch releases não exigem atualização da arte.
- **Proteção contra esquecimento** — uma nova linha pode falhar automaticamente se
a imagem não tiver sido atualizada.

## 13. Escopo recomendado para implementação

A lógica deve ser incorporada ao workflow de Release existente, e não implementada
como um workflow separado apenas para imagens.

A primeira implementação deve permanecer simples:

```text
validar versão
    ↓
determinar linha major.minor
    ↓
validar release.webp
    ↓
verificar alteração quando houver nova linha
    ↓
gerar URL usando a tag
    ↓
montar Release Body
    ↓
publicar Release
```

Não é necessário tentar escolher ou gerar automaticamente a arte. A automação deve
cuidar da **detecção, validação e referência versionada**, enquanto a decisão sobre
a aparência permanece editorial.

## 14. Critérios de aceite

- [ ] Existe `docs/images/releases/release.webp`.
- [ ] O workflow verifica a existência do arquivo.
- [ ] A imagem é incorporada às Release Notes.
- [ ] A URL da imagem utiliza a tag da Release.
- [ ] Uma patch release não exige alteração da imagem.
- [ ] Uma mudança de `minor` exige nova imagem.
- [ ] Uma mudança de `major` exige nova imagem.
- [ ] O workflow consegue detectar alteração de `release.webp` através do Git.
- [ ] Uma nova linha sem alteração da imagem pode interromper a publicação com
  mensagem clara.
- [ ] A primeira Release possui tratamento específico quando não existe tag
  anterior.
- [ ] Releases antigas não dependem do arquivo presente em `main`.
- [ ] O WebP não é duplicado como asset da Release.
