# Byte & Bug

Loja fictícia de periféricos feita para **praticar automação de testes** de UI e de API.
O nome é uma piada de QA: todo byte vem com um bug de brinde. Todos os produtos, preços e pessoas aqui são de demonstração.

A ideia é ter num lugar só os desafios que aparecem em sistemas reais de empresa: token que expira, permissão por perfil, validações, regras de negócio, componentes de bibliotecas (Radix, react-select, react-day-picker, Sonner) e um banco que volta ao estado inicial com uma chamada.

## Como subir

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# Ambiente de QA (token de 15 minutos e rota de reset ligada)
docker compose --env-file .env.qa up -d --build

# Ambiente de desenvolvimento (token de 15 minutos, sem rotas de QA)
docker compose --env-file .env.dev up -d --build

# Parar
docker compose --env-file .env.qa down
```

| Serviço | Endereço |
|---|---|
| Loja (web) | http://localhost:3000 |
| API | http://localhost:3333 |
| Contrato da API (Swagger) | http://localhost:3333/docs |
| Banco (Postgres) | localhost:5432, usuário `bytebug`, senha `bytebug` |

### Na nuvem (Render)

O arquivo `render.yaml` descreve a loja inteira: site estático, API e banco Postgres. No Render, use **New > Blueprint** e escolha este repositório. Depois disso, cada `git push` na branch `main` publica a versão nova sozinho (CI/CD).

No plano gratuito, a API "dorme" depois de 15 minutos sem uso e leva cerca de 1 minuto para acordar. O banco gratuito do Render expira em 30 dias. Para um banco sem prazo, troque a variável `DATABASE_URL` por um Postgres do Supabase ou do Neon e defina `DATABASE_SSL=true`.

### Como funciona como em empresa

Os dois ambientes usam **o mesmo código**. O que muda é a configuração (arquivos `.env.dev` e `.env.qa`): tempo do token, segredo do JWT e se as rotas de QA existem. É o mesmo modelo de dev, QA/homologação e produção numa empresa.

## Dados de teste

| Usuário | Senha | Perfil |
|---|---|---|
| cliente@bytebug.dev | byte123 | cliente |
| admin@bytebug.dev | admin123 | admin |
| bloqueado@bytebug.dev | byte123 | bloqueado (login devolve 403) |

| Cupom | Regra |
|---|---|
| BYTE10 | 10% de desconto |
| FRETEGRATIS | frete grátis |
| MIN500 | 15% em compras a partir de R$ 500 |
| EXPIRADO | sempre recusado (422) |

| Cartão | Resultado |
|---|---|
| 4111 1111 1111 1111 | aprovado |
| 4000 0000 0000 0002 | recusado (402 PAYMENT_DECLINED) |

CPF válido para testes: `529.982.247-25`. Frete: R$ 24,90, grátis a partir de R$ 299.

## Resetar os dados

No ambiente QA, `POST http://localhost:3333/qa/reset` devolve o banco ao estado inicial. Use numa fixture antes de cada teste.

## O que dá para testar

**Autenticação**
- Login, cadastro (e-mail duplicado dá 409) e usuário bloqueado (403).
- Access token curto + refresh token com rotação: usar o mesmo refresh duas vezes dá 401 `REFRESH_TOKEN_REVOKED`.
- Erros diferentes para token ausente, expirado e inválido (`TOKEN_MISSING`, `TOKEN_EXPIRED`, `TOKEN_INVALID`).
- No site, o cabeçalho mostra o tempo restante do token. No menu do usuário dá para desligar a renovação automática e ver o redirecionamento para o login quando expira.

**Home e vitrine**
- Banner em carrossel que troca sozinho (pausa com o mouse), vitrines de ofertas e mais avaliados, departamentos.
- Preço no Pix (5% off), parcelamento em até 10x, preço antigo e selo de desconto.
- Calculadora de frete por CEP na página do produto (resultado fixo por CEP, ideal para assert).

**Catálogo e carrinho**
- Busca, filtro por categoria, preço e estoque, ordenação e paginação (todos refletidos na URL).
- Produto com cor obrigatória, estoque baixo, esgotado e limite de 10 unidades por item.
- Cupons com regras diferentes, frete grátis por valor e barra de progresso até o frete grátis.
- Botões "Comprar agora" e "Adicionar ao carrinho" na página do produto.

**Checkout**
- Formulário em três etapas, com validação de CPF, CEP, cartão (Luhn), validade e CVV, no site e na API.
- Campo de estado com react-select (não é um `<select>` nativo).
- Pagamento recusado, estoque insuficiente na hora de fechar e carrinho vazio.

**Admin** (só perfil admin; cliente recebe 403)
- Cadastro, edição e exclusão de produtos, upload de imagem (multipart), modal de confirmação.
- Produto com pedidos não pode ser excluído (409).

**Playground** (`/playground`, use o ambiente QA)
- Modal e tooltip do Radix, toasts do Sonner, alert/confirm/prompt nativos.
- Calendário react-day-picker, data nativa, slider, radio, checkbox, upload e download.
- Tabela com ordenação e paginação, resposta lenta da API, elemento que aparece e some, endpoint instável, duplo clique.
- Iframe, Shadow DOM, link que abre nova aba e arrastar e soltar.

## Estrutura

```
api/   Node.js + Express + PostgreSQL (rotas, regras de negócio, OpenAPI)
web/   React + Vite, servido por nginx no Docker
docker-compose.yml, .env.dev, .env.qa
```

Os elementos principais têm `data-testid` e nomes acessíveis, então `get_by_role` e `get_by_test_id` funcionam.
