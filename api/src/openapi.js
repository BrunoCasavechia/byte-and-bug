// API contract (OpenAPI 3). Served at /docs (Swagger UI) and /docs.json.
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const err = (description) => ({ description, ...json(ref('Error')) });
const auth = [{ bearerAuth: [] }];

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Byte & Bug API',
    version: '1.0.0',
    description:
      'API da Byte & Bug, loja fictícia feita para praticar automação de testes. ' +
      'Todos os produtos, preços e pessoas são dados de demonstração.\n\n' +
      '**Usuários de teste:** cliente@bytebug.dev / byte123, admin@bytebug.dev / admin123, bloqueado@bytebug.dev / byte123.\n\n' +
      '**Cupons:** BYTE10 (10%), FRETEGRATIS, MIN500 (15% acima de R$ 500), EXPIRADO.\n\n' +
      '**Cartões:** 4111 1111 1111 1111 aprova; 4000 0000 0000 0002 é recusado (402).',
  },
  servers: [{ url: 'http://localhost:3333' }],
  tags: [
    { name: 'Auth' }, { name: 'Products' }, { name: 'Cart' }, { name: 'Orders' }, { name: 'QA', description: 'Só no ambiente qa' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'TOKEN_EXPIRED' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
            },
          },
        },
      },
      User: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string', enum: ['customer', 'admin'] } } },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'integer', description: 'Segundos até o accessToken expirar', example: 120 },
          user: ref('User'),
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, sku: { type: 'string', example: 'U01' }, name: { type: 'string' }, description: { type: 'string' },
          brand: { type: 'string' }, category: { type: 'object', properties: { slug: { type: 'string' }, name: { type: 'string' } } },
          price: { type: 'number', example: 349.9 }, stock: { type: 'integer' }, inStock: { type: 'boolean' },
          colors: { type: 'array', items: { type: 'string' } }, imageUrl: { type: 'string' },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['sku', 'name', 'brand', 'category', 'price'],
        properties: {
          sku: { type: 'string', example: 'A10' }, name: { type: 'string' }, description: { type: 'string' }, brand: { type: 'string' },
          category: { type: 'string', example: 'acessorios' }, price: { type: 'number', example: 59.9 }, stock: { type: 'integer', example: 10 },
          colors: { type: 'array', items: { type: 'string' } },
        },
      },
      ProductPage: {
        type: 'object',
        properties: { items: { type: 'array', items: ref('Product') }, page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
      },
      Cart: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object', properties: {
            productId: { type: 'integer' }, sku: { type: 'string' }, name: { type: 'string' }, color: { type: 'string', nullable: true },
            quantity: { type: 'integer' }, unitPrice: { type: 'number' }, lineTotal: { type: 'number' }, stock: { type: 'integer' },
            warning: { type: 'string', description: 'Aparece quando o estoque ficou menor que a quantidade' },
          } } },
          itemCount: { type: 'integer' },
          coupon: { type: 'object', nullable: true, properties: { code: { type: 'string' }, applied: { type: 'boolean' }, warning: { type: 'string' } } },
          subtotal: { type: 'number' }, discount: { type: 'number' },
          shipping: { type: 'number', description: 'R$ 24,90; grátis a partir de R$ 299 ou com FRETEGRATIS' },
          total: { type: 'number' },
        },
      },
      OrderInput: {
        type: 'object',
        required: ['shipping', 'payment'],
        properties: {
          shipping: { type: 'object', required: ['fullName', 'cpf', 'cep', 'street', 'number', 'city', 'state'], properties: {
            fullName: { type: 'string', example: 'Maria Souza' }, cpf: { type: 'string', example: '529.982.247-25' }, cep: { type: 'string', example: '18010-000' },
            street: { type: 'string' }, number: { type: 'string' }, complement: { type: 'string' }, city: { type: 'string' }, state: { type: 'string', example: 'SP' },
          } },
          payment: { type: 'object', required: ['cardNumber', 'cardName', 'expiry', 'cvv'], properties: {
            cardNumber: { type: 'string', example: '4111111111111111' }, cardName: { type: 'string' }, expiry: { type: 'string', example: '12/30' }, cvv: { type: 'string', example: '123' },
          } },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, status: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, couponCode: { type: 'string', nullable: true },
          subtotal: { type: 'number' }, discount: { type: 'number' }, shipping: { type: 'number' }, total: { type: 'number' },
          cardLast4: { type: 'string' }, shippingAddress: { type: 'object' },
          items: { type: 'array', items: { type: 'object', properties: { productId: { type: 'integer' }, name: { type: 'string' }, color: { type: 'string', nullable: true }, unitPrice: { type: 'number' }, quantity: { type: 'integer' } } } },
        },
      },
    },
  },
  paths: {
    '/health': { get: { tags: ['QA'], summary: 'Saúde da API e ambiente atual', responses: { 200: { description: 'OK' } } } },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Cria conta de cliente',
        requestBody: json({ type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 6 } } }),
        responses: { 201: { description: 'Criado', ...json(ref('User')) }, 400: err('Dados inválidos'), 409: err('EMAIL_IN_USE') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login. Devolve accessToken (curto) e refreshToken',
        requestBody: json({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'cliente@bytebug.dev' }, password: { type: 'string', example: 'byte123' } } }),
        responses: { 200: { description: 'OK', ...json(ref('Tokens')) }, 400: err('Campos vazios'), 401: err('INVALID_CREDENTIALS'), 403: err('USER_LOCKED') },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Troca o refreshToken por um par novo (o antigo é revogado)',
        requestBody: json({ type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } }),
        responses: { 200: { description: 'OK', ...json(ref('Tokens')) }, 401: err('REFRESH_TOKEN_INVALID / REVOKED / EXPIRED') },
      },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Revoga o refreshToken', requestBody: json({ type: 'object', properties: { refreshToken: { type: 'string' } } }), responses: { 204: { description: 'Sem conteúdo' } } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], security: auth, summary: 'Usuário do token', responses: { 200: { description: 'OK', ...json(ref('User')) }, 401: err('TOKEN_MISSING / TOKEN_EXPIRED / TOKEN_INVALID') } },
    },
    '/categories': { get: { tags: ['Products'], summary: 'Lista categorias', responses: { 200: { description: 'OK' } } } },
    '/products': {
      get: {
        tags: ['Products'], summary: 'Lista produtos com busca, filtros, ordenação e paginação',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Busca em nome, marca e SKU' },
          { name: 'category', in: 'query', schema: { type: 'string' }, example: 'teclados' },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
        ],
        responses: { 200: { description: 'OK', ...json(ref('ProductPage')) }, 400: err('Parâmetro inválido') },
      },
      post: {
        tags: ['Products'], security: auth, summary: 'Cria produto (admin)', requestBody: json(ref('ProductInput')),
        responses: { 201: { description: 'Criado', ...json(ref('Product')) }, 400: err('Validação'), 401: err('Sem token'), 403: err('FORBIDDEN'), 409: err('DUPLICATE_PRODUCT') },
      },
    },
    '/products/brands': { get: { tags: ['Products'], summary: 'Lista marcas', responses: { 200: { description: 'OK' } } } },
    '/products/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: { tags: ['Products'], summary: 'Detalhe do produto', responses: { 200: { description: 'OK', ...json(ref('Product')) }, 404: err('NOT_FOUND') } },
      put: { tags: ['Products'], security: auth, summary: 'Substitui produto (admin)', requestBody: json(ref('ProductInput')), responses: { 200: { description: 'OK', ...json(ref('Product')) }, 400: err('Validação'), 403: err('FORBIDDEN'), 404: err('NOT_FOUND'), 409: err('DUPLICATE_PRODUCT') } },
      patch: { tags: ['Products'], security: auth, summary: 'Altera só estoque e/ou preço (admin)', requestBody: json({ type: 'object', properties: { stock: { type: 'integer' }, price: { type: 'number' } } }), responses: { 200: { description: 'OK', ...json(ref('Product')) }, 400: err('Validação'), 403: err('FORBIDDEN') } },
      delete: { tags: ['Products'], security: auth, summary: 'Exclui produto (admin)', responses: { 204: { description: 'Excluído' }, 403: err('FORBIDDEN'), 404: err('NOT_FOUND'), 409: err('PRODUCT_HAS_ORDERS') } },
    },
    '/products/{id}/image': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      post: {
        tags: ['Products'], security: auth, summary: 'Envia imagem (multipart/form-data, campo "image", até 2 MB)',
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } } },
        responses: { 200: { description: 'OK', ...json(ref('Product')) }, 400: err('Sem arquivo'), 413: err('FILE_TOO_LARGE'), 415: err('UNSUPPORTED_FILE') },
      },
    },
    '/cart': {
      get: { tags: ['Cart'], security: auth, summary: 'Carrinho do usuário com totais', responses: { 200: { description: 'OK', ...json(ref('Cart')) }, 401: err('Token') } },
      delete: { tags: ['Cart'], security: auth, summary: 'Esvazia o carrinho', responses: { 200: { description: 'OK', ...json(ref('Cart')) } } },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'], security: auth, summary: 'Adiciona item (soma à quantidade existente)',
        requestBody: json({ type: 'object', required: ['productId'], properties: { productId: { type: 'integer' }, quantity: { type: 'integer', default: 1 }, color: { type: 'string' } } }),
        responses: { 201: { description: 'OK', ...json(ref('Cart')) }, 400: err('Cor obrigatória ou dado inválido'), 404: err('NOT_FOUND'), 409: err('OUT_OF_STOCK / INSUFFICIENT_STOCK'), 422: err('QUANTITY_LIMIT (máx. 10)') },
      },
    },
    '/cart/items/{productId}': {
      parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
      patch: { tags: ['Cart'], security: auth, summary: 'Define a quantidade', requestBody: json({ type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer' }, color: { type: 'string' } } }), responses: { 200: { description: 'OK', ...json(ref('Cart')) }, 404: err('NOT_FOUND'), 409: err('INSUFFICIENT_STOCK') } },
      delete: { tags: ['Cart'], security: auth, summary: 'Remove item', parameters: [{ name: 'color', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'OK', ...json(ref('Cart')) }, 404: err('NOT_FOUND') } },
    },
    '/cart/coupon': {
      post: { tags: ['Cart'], security: auth, summary: 'Aplica cupom', requestBody: json({ type: 'object', required: ['code'], properties: { code: { type: 'string', example: 'BYTE10' } } }), responses: { 200: { description: 'OK', ...json(ref('Cart')) }, 404: err('COUPON_NOT_FOUND'), 422: err('COUPON_EXPIRED / COUPON_MIN_SUBTOTAL / CART_EMPTY') } },
      delete: { tags: ['Cart'], security: auth, summary: 'Remove cupom', responses: { 200: { description: 'OK', ...json(ref('Cart')) } } },
    },
    '/orders': {
      get: { tags: ['Orders'], security: auth, summary: 'Seus pedidos (admin: ?all=true para todos)', parameters: [{ name: 'all', in: 'query', schema: { type: 'boolean' } }], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: ref('Order') } } } }, 403: err('FORBIDDEN') } },
      post: {
        tags: ['Orders'], security: auth, summary: 'Fecha o pedido com o carrinho atual', requestBody: json(ref('OrderInput')),
        responses: { 201: { description: 'Criado', ...json(ref('Order')) }, 400: err('Validação (CPF, CEP, cartão...)'), 402: err('PAYMENT_DECLINED'), 409: err('INSUFFICIENT_STOCK'), 422: err('CART_EMPTY') },
      },
    },
    '/orders/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: { tags: ['Orders'], security: auth, summary: 'Detalhe do pedido', responses: { 200: { description: 'OK', ...json(ref('Order')) }, 403: err('Pedido de outro usuário'), 404: err('NOT_FOUND') } },
    },
    '/qa/reset': { post: { tags: ['QA'], summary: 'Volta o banco ao estado inicial', responses: { 200: { description: 'OK' }, 404: { description: 'Fora do ambiente qa' } } } },
    '/qa/slow': { get: { tags: ['QA'], summary: 'Responde depois de ?ms= (máx. 15000)', parameters: [{ name: 'ms', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/qa/flaky': { get: { tags: ['QA'], summary: 'Falha com 503 em ?failRate= das vezes (padrão 0.5)', parameters: [{ name: 'failRate', in: 'query', schema: { type: 'number' } }], responses: { 200: { description: 'OK' }, 503: err('FLAKY_FAILURE') } } },
  },
};
