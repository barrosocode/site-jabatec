import type { APIRoute } from "astro";
import emailjs from "@emailjs/nodejs";

export const prerender = false;

const tentativas = new Map<string, number[]>();
const LIMITE = 5;
const JANELA_MS = 60 * 60 * 1000;

type FieldErrors = Record<string, string[]>;

function permitir(ip: string) {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE) return false;
  recentes.push(agora);
  tentativas.set(ip, recentes);
  return true;
}

function envelope(
  status: number,
  message: string,
  errors: FieldErrors,
  contato: { enviado: true } | null,
  errorCode: string | null,
) {
  return new Response(
    JSON.stringify({
      status,
      message,
      errors,
      contato,
      pagination: null,
      error_code: errorCode,
    }),
    {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

function variavel(nome: string) {
  const valor = process.env[nome];
  return typeof valor === "string" ? valor.trim() : "";
}

function falhaEnvio() {
  return envelope(
    502,
    "Não foi possível enviar. Escreva para contato@jabatec.tec.br.",
    {},
    null,
    "EMAIL_SEND_FAILED",
  );
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return envelope(
      400,
      "Não foi possível enviar a mensagem.",
      { corpo: ["O corpo da requisição é inválido."] },
      null,
      "VALIDATION_ERROR",
    );
  }

  const nome = String(body.nome ?? "").trim();
  const contato = String(body.contato ?? "").trim();
  const dor = String(body.dor ?? "").trim();
  const errors: FieldErrors = {};

  if (!body.consentimento) {
    errors.consentimento = ["Marque o consentimento para enviar."];
  }
  if (!nome) errors.nome = ["Informe o nome completo."];
  if (!contato) errors.contato = ["Informe o e-mail ou o WhatsApp."];
  if (!dor) errors.dor = ["Descreva a dor que o projeto resolve."];

  if (Object.keys(errors).length > 0) {
    return envelope(400, "Não foi possível enviar a mensagem.", errors, null, "VALIDATION_ERROR");
  }

  const ip = request.headers.get("cf-connecting-ip") ?? clientAddress;
  if (!ip || !permitir(ip)) {
    return envelope(
      429,
      "Muitas tentativas deste endereço. Tente novamente em uma hora.",
      {},
      null,
      "RATE_LIMIT",
    );
  }

  const serviceId = variavel("EMAILJS_SERVICE_ID");
  const templateId = variavel("EMAILJS_TEMPLATE_ID");
  const publicKey = variavel("EMAILJS_PUBLIC_KEY");
  const privateKey = variavel("EMAILJS_PRIVATE_KEY");
  const recaptchaSecret = variavel("RECAPTCHA_SECRET_KEY");

  if (!serviceId || !templateId || !publicKey || !privateKey || !recaptchaSecret) {
    return falhaEnvio();
  }

  let captcha: { success?: boolean };
  try {
    const check = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: String(body.recaptcha ?? ""),
      }),
    });
    captcha = await check.json();
  } catch {
    return falhaEnvio();
  }

  if (!captcha.success) {
    return envelope(
      400,
      "Não foi possível enviar a mensagem.",
      { recaptcha: ["Marque a caixa de verificação antes de enviar."] },
      null,
      "VALIDATION_ERROR",
    );
  }

  try {
    await emailjs.send(
      serviceId,
      templateId,
      { nome, contato, dor },
      {
        publicKey,
        privateKey,
      },
    );
  } catch {
    return falhaEnvio();
  }

  return envelope(
    200,
    "Mensagem enviada. O time retorna em até 48 horas úteis.",
    {},
    { enviado: true },
    null,
  );
};
