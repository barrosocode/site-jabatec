# Spec: envio do formulário de contato via EmailJS

## Objetivo

O formulário `#contato` envia nome, contato e dor para `contatojabatec@gmail.com` pela conta nova do EmailJS. O navegador fala só com a rota `POST /api/contato` do próprio site. Service, template e chaves ficam em variáveis de ambiente do servidor, sem prefixo público. A mesma aba espera um minuto entre envios. A rota aceita no máximo 5 pedidos por hora por IP, confere o reCAPTCHA v2 e só então chama o EmailJS. O sucesso só aparece depois que essa rota confirma o envio.

## Estado atual

O HTML dos campos já usa os nomes do template. O `submit` ainda é local: valida o consentimento, esconde o formulário e mostra sucesso sem chamar rede.

Arquivo de base: `inspiration/jabatec02.html`. O markup, o estilo e o comportamento visual dessa página entram no Astro. `inspiration/jabatec03.html` não é a base.

| Variável do template | Campo | Atributos |
|---|---|---|
| `nome` | Nome completo | `id="full-name"` `name="nome"` |
| `contato` | E-mail corporativo / WhatsApp | `id="corp-email"` `name="contato"` |
| `dor` | Qual é a dor que o seu projeto resolve? | `id="project-pain"` `name="dor"` |

Não renomear esses campos.

## Conta e painel (já configurados)

Conta nova do EmailJS. Serviço Gmail conectado como `contatojabatec@gmail.com`, com a permissão **Send email on your behalf** marcada.

Template salvo com:

- **To Email:** `contatojabatec@gmail.com`
- **From Email:** Use Default Email Address
- **From Name:** `{{nome}}`
- **Reply To:** vazio
- **Auto-Reply:** desligado
- **Subject:** `Site Jabatec: contato de {{nome}}`
- **Content:**

```text
Nova mensagem no site Jabatec:

Nome: {{nome}}

Contato: {{contato}}

Qual é a dor que o seu projeto resolve?
{{dor}}
```

**Reply To** permanece vazio. O campo `contato` aceita e-mail ou WhatsApp. Um telefone nesse campo faz o Gmail recusar o envio.

## Credenciais

Os identificadores ficam no `.env` do servidor. O HTML, o bundle do cliente e o `POST` do formulário não carregam service, template nem chave.

Nomes sem prefixo `PUBLIC_`. No endpoint Astro, a leitura é `import.meta.env.EMAILJS_SERVICE_ID` e o mesmo padrão para as demais. Nenhuma dessas variáveis entra em código de cliente.

| Variável | Valor |
|---|---|
| `EMAILJS_SERVICE_ID` | `service_o8wfjz1` |
| `EMAILJS_TEMPLATE_ID` | `template_58elt7b` |
| `EMAILJS_PUBLIC_KEY` | `Yh2nKYa95F68_nNlM` |
| `EMAILJS_PRIVATE_KEY` | gerada em **Account → Security** no painel; ainda não informada |
| `RECAPTCHA_SECRET_KEY` | secret key do reCAPTCHA v2; ainda não informada |

`.env` fica fora do Git. `.env.example` lista só os nomes, com valor vazio. A senha do Gmail continua só no painel do EmailJS.

A site key do reCAPTCHA é pública e fica na página, no widget. Se vier de variável de ambiente no cliente, o nome é `PUBLIC_RECAPTCHA_SITE_KEY`. `RECAPTCHA_SECRET_KEY` não usa o prefixo `PUBLIC_`.

No painel, em **Account → Security**, ativar o uso da chave privada nas chamadas. A rota envia `EMAILJS_PUBLIC_KEY` e `EMAILJS_PRIVATE_KEY` juntas, pelo SDK `@emailjs/nodejs`. Sem a chave privada, o EmailJS recusa o disparo do template.

O exemplo da plataforma usa textos fixos e o SDK do navegador. Ele serve só para mostrar os nomes das variáveis. O site não usa esse exemplo:

```javascript
emailjs.send("service_o8wfjz1", "template_58elt7b", {
  nome: "gabriel",
  contato: "contato@gmail.com",
  dor: "ai",
});
```

## Stack

O site é Astro, com o adaptador `@astrojs/node` em modo `standalone` e um processo só. A página é estática e reproduz `inspiration/jabatec02.html`. Só o endpoint `src/pages/api/contato.ts` roda no servidor, com `export const prerender = false`. O SDK `@emailjs/browser` não entra na página.

Com um processo só, o limite por IP fica no mapa em memória. Redis entra apenas se o deploy passar a ter mais de uma instância.

## Implementação

### 1. Rota `POST /api/contato`

A rota lê as variáveis de ambiente no servidor. A ordem é: validar o corpo, aplicar o limite por IP, conferir o reCAPTCHA e chamar o EmailJS. O limite do painel do EmailJS por IP fica desligado: dali o pedido sai com o IP do servidor e travaria o site inteiro.

Corpo aceito:

```json
{
  "nome": "Gabriel",
  "contato": "contato@gmail.com",
  "dor": "Texto da dor.",
  "consentimento": true,
  "recaptcha": "token-do-widget"
}
```

```javascript
import emailjs from "@emailjs/nodejs";

export const prerender = false;

export async function POST({ request, clientAddress }) {
  const body = await request.json();
  const nome = String(body.nome ?? "").trim();
  const contato = String(body.contato ?? "").trim();
  const dor = String(body.dor ?? "").trim();

  if (!body.consentimento || !nome || !contato || !dor) {
    // responder 400 com o envelope abaixo, sem contar no limite e sem chamar o EmailJS
  }

  const ip = request.headers.get("cf-connecting-ip") ?? clientAddress;
  if (!ip || !permitir(ip)) {
    // responder 429 e não chamar o Google nem o EmailJS
  }

  const check = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: import.meta.env.RECAPTCHA_SECRET_KEY,
      response: String(body.recaptcha ?? ""),
    }),
  });
  const captcha = await check.json();
  if (!captcha.success) {
    // responder 400, errors.recaptcha, e não chamar o EmailJS
  }

  await emailjs.send(
    import.meta.env.EMAILJS_SERVICE_ID,
    import.meta.env.EMAILJS_TEMPLATE_ID,
    { nome, contato, dor },
    {
      publicKey: import.meta.env.EMAILJS_PUBLIC_KEY,
      privateKey: import.meta.env.EMAILJS_PRIVATE_KEY,
    }
  );
}
```

`clientAddress` vem do contexto do endpoint Astro. Atrás do Cloudflare, `cf-connecting-ip` tem prioridade. O corpo do formulário não informa o IP.

Resposta de sucesso:

```json
{
  "status": 200,
  "message": "Mensagem enviada. O time retorna em até 48 horas úteis.",
  "errors": {},
  "contato": { "enviado": true },
  "pagination": null,
  "error_code": null
}
```

Sem consentimento, ou com algum campo vazio:

```json
{
  "status": 400,
  "message": "Não foi possível enviar a mensagem.",
  "errors": {
    "consentimento": ["Marque o consentimento para enviar."]
  },
  "contato": null,
  "pagination": null,
  "error_code": "VALIDATION_ERROR"
}
```

Token ausente ou recusado pelo Google usa o mesmo envelope, com `errors.recaptcha` em `["Marque a caixa de verificação antes de enviar."]`.

Falha do EmailJS ou ausência de alguma variável de ambiente:

```json
{
  "status": 502,
  "message": "Não foi possível enviar. Escreva para contato@jabatec.tec.br.",
  "errors": {},
  "contato": null,
  "pagination": null,
  "error_code": "EMAIL_SEND_FAILED"
}
```

### 2. Limite por IP

Cinco pedidos por hora por IP. Um escritório atrás do mesmo endereço de saída compartilha essa cota. O IP é `cf-connecting-ip` quando a requisição passa pelo Cloudflare; senão, `clientAddress` do endpoint Astro. O corpo do formulário não informa o IP.

Um processo só guarda os horários num mapa em memória. A contagem acontece depois da validação do corpo e antes do reCAPTCHA, então um pedido inválido não consome a hora e um token recusado consome.

```javascript
const tentativas = new Map();
const LIMITE = 5;
const JANELA_MS = 60 * 60 * 1000;

function permitir(ip) {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE) return false;
  recentes.push(agora);
  tentativas.set(ip, recentes);
  return true;
}
```

Com mais de uma instância, ou em função serverless, cada processo teria o próprio mapa. Nesse caso o contador fica no Redis: `INCR contato:{ip}` e, quando o valor passa a ser 1, `EXPIRE contato:{ip} 3600`.

O IP é dado pessoal. O contador dura só a janela de uma hora, a resposta não devolve o endereço e o log da rota não grava o IP.

Acima do limite:

```json
{
  "status": 429,
  "message": "Muitas tentativas deste endereço. Tente novamente em uma hora.",
  "errors": {},
  "contato": null,
  "pagination": null,
  "error_code": "RATE_LIMIT"
}
```

### 3. Intervalo de um minuto na aba

Depois de um envio com resposta 200, a página grava só o horário em `sessionStorage`, na chave `jabatec_contato_em`. Nos 60 segundos seguintes, o `submit` da mesma aba não chama `/api/contato` e mostra "Aguarde um minuto para enviar de novo." Fechar a aba zera o intervalo. Nome, contato e dor não entram nesse armazenamento.

### 4. reCAPTCHA v2

Criar uma chave **reCAPTCHA v2**, caixa "Não sou um robô", no [console do reCAPTCHA](https://www.google.com/recaptcha/admin/create). No console, autorizar o domínio de produção e `localhost`. O plano Enterprise inclui 10 mil avaliações por mês sem custo, acima do volume deste formulário.

O reCAPTCHA do painel do EmailJS permanece desligado. A conferência é na rota, antes do `emailjs.send`.

Na página, depois do checkbox de consentimento:

```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<div class="g-recaptcha" data-sitekey="SITE_KEY"></div>
```

Sem token, o `fetch` não sai e `#form-error` pede para marcar a caixa. O token vale dois minutos e o Google aceita cada um uma única vez.

A política de privacidade cita o Google como operador dessa verificação. O reCAPTCHA envia IP e interação da página ao Google e grava o cookie `_GRECAPTCHA`.

### 5. Formulário

O `submit` de `#contact-form` envia os campos do visitante e o token. Service, template e chaves do EmailJS não vão nesse pedido.

```javascript
const ESPERA_MS = 60_000;
const CHAVE = "jabatec_contato_em";

const form = document.getElementById("contact-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("form-error");
  const button = form.querySelector("button[type='submit']");

  if (!document.getElementById("consent").checked) {
    error.textContent = "Marque o consentimento para enviar.";
    error.hidden = false;
    return;
  }

  const ultimo = Number(sessionStorage.getItem(CHAVE) || 0);
  if (Date.now() - ultimo < ESPERA_MS) {
    error.textContent = "Aguarde um minuto para enviar de novo.";
    error.hidden = false;
    return;
  }

  const recaptcha = grecaptcha.getResponse();
  if (!recaptcha) {
    error.textContent = "Marque a caixa de verificação antes de enviar.";
    error.hidden = false;
    return;
  }

  error.hidden = true;
  button.disabled = true;

  try {
    const response = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: document.getElementById("full-name").value.trim(),
        contato: document.getElementById("corp-email").value.trim(),
        dor: document.getElementById("project-pain").value.trim(),
        consentimento: true,
        recaptcha,
      }),
    });
    const payload = await response.json();
    if (!response.ok || payload.error_code) {
      const falha = new Error(payload.message);
      falha.known = true;
      throw falha;
    }
    sessionStorage.setItem(CHAVE, String(Date.now()));
    form.hidden = true;
    document.getElementById("form-success").hidden = false;
  } catch (err) {
    grecaptcha.reset();
    error.textContent = err.known && err.message
      ? err.message
      : "Não foi possível enviar. Escreva para contato@jabatec.tec.br.";
    error.hidden = false;
    button.disabled = false;
  }
});
```

### 6. Texto de sucesso

Em `#form-success`, trocar a frase de protótipo por:

```text
Mensagem enviada. O time retorna em até 48 horas úteis.
```

## Comportamento

1. Sem o checkbox de consentimento, o navegador não chama a rota e `#form-error` pede o consentimento.
2. Nos 60 segundos após um envio 200, a mesma aba não chama a rota e pede para aguardar um minuto.
3. Sem a caixa do reCAPTCHA marcada, o navegador não chama a rota.
4. Com consentimento, intervalo livre e token presente, o botão fica desabilitado até a resposta da rota.
5. `POST /api/contato` com `consentimento: false` ou campo vazio responde 400, não entra na contagem do IP e não chama o EmailJS.
6. O sexto pedido do mesmo IP dentro de uma hora responde 429, não chama o Google nem o EmailJS, e `#form-error` mostra "Muitas tentativas deste endereço. Tente novamente em uma hora."
7. `recaptcha` recusado pelo Google responde 400 e não chama o EmailJS. Esse pedido já consumiu uma vaga da hora.
8. Resposta 200: o formulário some, `#form-success` aparece e `sessionStorage` guarda só `jabatec_contato_em`.
9. Falha de rede ou outro `error_code`: o formulário permanece, o widget é reiniciado, o botão volta a funcionar e `#form-error` mostra a `message` do envelope. Sem `message`, indica o e-mail `contato@jabatec.tec.br`.
10. Nome, contato e dor não vão para `localStorage` nem `sessionStorage`. O IP não aparece na resposta nem no log.
11. O código-fonte da página e o bundle do cliente não contêm `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` nem `RECAPTCHA_SECRET_KEY`. A site key do reCAPTCHA aparece na página.

## Plano gratuito

200 pedidos por mês, 2 templates, pedido de até 50 KB. Ao atingir 100% da cota, o EmailJS descarta os pedidos seguintes sem cobrar. Avisos em 80%, 95% e 100%.

## Critérios de aceite

- Um envio de teste com nome, e-mail e texto da dor chega em `contatojabatec@gmail.com` com o assunto `Site Jabatec: contato de {nome}`.
- O corpo mostra os três campos preenchidos no site, não os textos fixos do exemplo.
- O pedido parte de `POST /api/contato`. A página não chama `api.emailjs.com` direto.
- Envio sem consentimento não gera pedido no EmailJS.
- Com a rede bloqueada, a mensagem de erro aparece e o formulário continua editável.
- O histórico do painel (**Email History**) registra o pedido de teste.
- Busca no bundle do cliente não encontra `service_o8wfjz1`, `template_58elt7b` nem `Yh2nKYa95F68_nNlM`.
- Uma chamada direta ao EmailJS só com a chave pública, sem `EMAILJS_PRIVATE_KEY`, é recusada.
- Um segundo envio na mesma aba, em menos de um minuto, não gera pedido no EmailJS e mostra "Aguarde um minuto para enviar de novo."
- `POST /api/contato` sem token, ou com token inválido, responde 400 e não chama o EmailJS.
- O sexto `POST /api/contato` válido do mesmo IP, dentro de uma hora, responde 429 com `error_code` `RATE_LIMIT` e não chama o Google nem o EmailJS.
- A resposta 429 não contém o IP.
- Busca no bundle do cliente não encontra `RECAPTCHA_SECRET_KEY`.
