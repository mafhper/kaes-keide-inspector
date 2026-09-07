# Release notes por versão

Crie um arquivo para cada versão usando a tag exata como nome:

```text
.github/release-notes/v1.0.1.md
```

O conteúdo é inserido na seção **O que tem de novo nesta versão** da Release.
Use markdown simples e descreva somente mudanças relevantes para quem usa a extensão.

Exemplo:

```markdown
- **Novo detector.** Adicionado suporte para identificar a tecnologia X.
- **Inspector aprimorado.** A leitura de propriedades CSS agora cobre Y.
- **Correção.** Resolvido um problema que afetava Z.
```

Não inclua título `#` ou `##` no arquivo; o workflow já cria o cabeçalho da seção.

A imagem de release é opcional. Para uma captura específica da versão, coloque:

```text
docs/images/releases/release-1.0.1.png
```

Se ela não existir, o workflow usa a captura principal em
`docs/images/screens/optimized-kaes_keid-main.png`.
