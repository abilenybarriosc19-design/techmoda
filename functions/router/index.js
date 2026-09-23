/**
 * CRUD ROUTER FUNCTION
 *
 * Por qué existe:
 *   El capstone NO usa API Gateway (AWS::Serverless::Api): expone UNA sola Lambda
 *   Function URL (AuthType NONE) y resuelve el ruteo aquí dentro. Es más simple de
 *   desplegar y de explicar. Detalle en docs/SANDBOX-COMPAT.md.
 *
 * Reúsa la lógica de las 5 Lambdas CRUD existentes (functions/{list,create,get,
 * update,delete}-items). El paquete se despliega con CodeUri: functions/ y
 * Handler: router/index.handler, de modo que estos `require('../xxx')` quedan
 * dentro del artefacto. No hay duplicación de lógica.
 *
 * Mapa de rutas (igual contrato que la API REST original):
 *   GET    /products        -> list-items
 *   POST   /products        -> create-item
 *   GET    /products/{id}   -> get-item
 *   PUT    /products/{id}   -> update-item
 *   DELETE /products/{id}   -> delete-item
 *
 * El evento de Function URL usa el payload v2.0:
 *   method -> event.requestContext.http.method
 *   path   -> event.rawPath
 *   body   -> event.body (string; base64 si isBase64Encoded)
 * Toleramos también v1.0 / invocación directa por robustez.
 */

const { handler: listItems } = require('../list-items/index.js');
const { handler: createItem } = require('../create-item/index.js');
const { handler: getItem } = require('../get-item/index.js');
const { handler: updateItem } = require('../update-item/index.js');
const { handler: deleteItem } = require('../delete-item/index.js');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const json = (statusCode, payload) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(payload),
});

exports.handler = async (event) => {
  console.log('Router event:', JSON.stringify(event));

  const method =
    event?.requestContext?.http?.method || event?.httpMethod || 'GET';

  // Normalizar el path: colapsar // (la Function URL termina en '/') y quitar slash final.
  let path =
    event?.rawPath || event?.requestContext?.http?.path || event?.path || '/';
  path = path.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';

  // CORS preflight (la Function URL ya lo maneja si Cors está configurado, pero
  // respondemos por las dudas para invocaciones directas).
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const segments = path.split('/').filter(Boolean); // ['products'] | ['products','<id>']
  const id = segments[1];

  // Decodificar body si vino en base64 y normalizar pathParameters para reusar
  // los handlers CRUD existentes tal cual (leen event.pathParameters.id / event.body).
  let body = event?.body;
  if (body && event?.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf-8');
  }
  const normalized = { ...event, body, pathParameters: id ? { id } : null };

  try {
    if (segments[0] === 'products') {
      if (!id) {
        if (method === 'GET') return await listItems(normalized);
        if (method === 'POST') return await createItem(normalized);
      } else {
        if (method === 'GET') return await getItem(normalized);
        if (method === 'PUT') return await updateItem(normalized);
        if (method === 'DELETE') return await deleteItem(normalized);
      }
    }
    return json(404, { error: 'Ruta no encontrada', method, path });
  } catch (error) {
    console.error('Router error:', error);
    return json(500, { error: 'Error interno del router', message: error.message });
  }
};
