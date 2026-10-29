---
name: Jabatec Design System
version: "1.0"
description: "Deep Tech Authority: A design system blending B2G/B2B trust with cutting-edge AI innovation."
colors:
    background-deep: "#02040A"
    background-surface: "#0A1128"
    brand-navy: "#000080"
    accent-turquoise: "#00FFEF"
    accent-turquoise-dim: "rgba(0, 255, 239, 0.1)"
    text-primary: "#F8FAFC"
    text-secondary: "#94A3B8"
    border-subtle: "rgba(148, 163, 184, 0.15)"
typography:
    font-sans: "Inter, Geist, system-ui, sans-serif"
    font-mono: "JetBrains Mono, Fira Code, monospace"
    h1:
        fontFamily: "{typography.font-sans}"
        fontSize: "3.5rem"
        fontWeight: "700"
        letterSpacing: "-0.02em"
        lineHeight: "1.1"
    h2:
        fontFamily: "{typography.font-sans}"
        fontSize: "2.25rem"
        fontWeight: "600"
        letterSpacing: "-0.01em"
        lineHeight: "1.2"
    body-md:
        fontFamily: "{typography.font-sans}"
        fontSize: "1rem"
        fontWeight: "400"
        lineHeight: "1.6"
        color: "{colors.text-secondary}"
    mono-data:
        fontFamily: "{typography.font-mono}"
        fontSize: "0.875rem"
        fontWeight: "500"
        color: "{colors.accent-turquoise}"
rounded:
    sm: "4px"
    md: "6px"
    lg: "8px"
spacing:
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
    xl: "32px"
    xxl: "48px"
components:
    button-primary:
        backgroundColor: "{colors.accent-turquoise}"
        textColor: "{colors.background-deep}"
        typography: "{typography.body-md}"
        fontWeight: "600"
        rounded: "{rounded.md}"
        padding: "12px 24px"
        hoverEffect: "subtle-glow"
    card-portfolio-3d:
        backgroundColor: "{colors.background-surface}"
        border: "1px solid {colors.border-subtle}"
        rounded: "{rounded.lg}"
        padding: "{spacing.lg}"
        perspective: "1000px"
        transformStyle: "preserve-3d"
        hoverTransform: "translateZ(10px) rotateY(-2deg)"
        transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
---

## Overview

A estética da Jabatec é "Deep Tech Authority". O design deve transmitir confiança institucional (necessária para B2G e compliance) combinada com inovação de ponta (IA e transformação digital). O modo escuro (Dark Mode) é o padrão absoluto. A interface evoca um terminal de alta performance misturado com um painel de controle financeiro moderno: preciso, limpo, sem ruídos visuais, mas com micro-interações que demonstram sofisticação técnica.

## Colors

- **Background Deep (`#02040A`)**: O fundo principal da página. Quase preto, mas com um matiz azul profundo para evitar o contraste harsh do preto puro.
- **Background Surface (`#0A1128`)**: Usado em cards, sidebars e áreas de conteúdo elevadas.
- **Brand Navy (`#000080`)**: A cor da confiança e estabilidade. Usada em gradientes de fundo, bordas sutis de foco e elementos institucionais.
- **Accent Turquoise (`#00FFEF`)**: A cor da inovação, IA e ação. Usada exclusivamente em CTAs primários, ícones de destaque, brilhos (glows) e dados numéricos importantes. Nunca usar em textos longos.
- **Text Primary/Secondary**: Branco gelo para títulos, cinza-azulado (Slate) para textos de apoio, garantindo legibilidade e hierarquia.

## Typography

O sistema utiliza uma dualidade estratégica:

- **Sans-Serif (Inter/Geist)**: Para toda a narrativa, títulos e textos corridos. Transmite clareza, modernidade e neutralidade.
- **Monospace (JetBrains Mono/Fira Code)**: Exclusiva para dados, métricas, números de cases, tags de tecnologia e pequenos rótulos técnicos. Isso ancora a marca na realidade da engenharia de software.

## Layout

Grid estrito e generoso. O "respiro" (whitespace) é um indicador de luxo e organização.

- Use a escala de espaçamento definida nos tokens.
- O conteúdo deve estar centralizado em um container máximo de `1200px` a `1280px`.
- Alinhamentos devem ser matematicamente precisos.

## Elevation & Depth

A profundidade não é criada com sombras pesadas, mas com luz e perspectiva:

- **Glows Sutis**: Cards e botões podem ter um `box-shadow` muito difuso na cor `accent-turquoise` com opacidade de 10-15% no estado de hover.
- **Glassmorphism**: Usado com moderação em overlays ou cabeçalhos fixos (backdrop-filter: blur(8px) com fundo semi-transparente).
- **Animação 3D (Efeito Stripe)**: Na seção de portfólio, os cards devem existir em um container com `perspective: 1000px`. Ao interagir, o card alvo deve sofrer um leve `translateZ` e `rotateY`, criando a ilusão de uma pilha de documentos ou livros sendo consultados. A transição deve ser suave (`cubic-bezier`), nunca brusca.

## Shapes

- **Levemente Arredondados**: Use `4px` a `8px` para bordas. Isso suaviza a interface sem torná-la "infantil" ou excessivamente amigável. Mantém o ar sério e técnico.
- Evite círculos perfeitos, exceto em indicadores de status (pontos de "online" ou "sucesso").

## Components

- **Botões**: Devem ter transição de cor e um brilho sutil (glow) no hover. O texto do botão deve ser legível e direto.
- **Card de Portfólio 3D (Estilo Stripe)**:
    - **Estrutura Interna**:
        1. Área superior para mockup/imagem do produto (com bordas arredondadas e leve borda sutil).
        2. Título do Projeto (H3, Sans-serif).
        3. "A Dor" (Problema): 1 a 2 linhas de texto (Text Secondary).
        4. "A Solução/Dado": Um bloco destacado usando a fonte `mono-data` (ex: "+40% eficiência" ou "IA Validada").
    - **Interação**: O card deve responder ao hover com a transformação 3D definida nos tokens, e a borda pode ganhar um brilho turquesa de 1px.
- **Ícones**: Apenas ícones de linha fina (outline), com espessura de traço consistente (ex: 1.5px). Estilo Lucide ou Heroicons.

## Do's and Don'ts

- **FAÇA**: Usar dados reais e métricas nos cards de portfólio.
- **FAÇA**: Usar gradientes muito sutis de Azul Marinho para o fundo, com toques de Turquesa apenas como luz de borda ou brilho.
- **FAÇA**: Garantir que todas as animações sejam rápidas (200ms - 400ms) e com easing suave.
- **NÃO FAÇA**: Usar fotos de banco de imagem genéricas (ex: "pessoas de terno apertando as mãos"). Se precisar de imagens humanas, use fotos reais e tratadas da equipe, ou ilustrações abstratas de dados/redes neurais.
- **NÃO FAÇA**: Usar Lorem Ipsum. O conteúdo deve refletir a proposta de valor real da Jabatec (Consultoria, IA, B2G, Compliance).
- **NÃO FAÇA**: Usar o Turquesa em grandes blocos de fundo. Ele é um acento, não uma base.
