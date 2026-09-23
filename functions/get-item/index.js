/**
 * GET ITEM FUNCTION
 *
 * Purpose: Retrieve a single product by ID
 * API Endpoint: GET /products/{id}
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Create DynamoDB client
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.PRODUCTS_TABLE;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Extract product ID from path parameters
        const productId = event.pathParameters?.id;

        if (!productId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: 'ID del producto requerido'
                })
            };
        }

        // Get item from DynamoDB
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                productId: productId
            }
        });

        const result = await dynamodb.send(command);

        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: 'Producto no encontrado'
                })
            };
        }

        console.log('Product found:', productId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error getting product:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Error al obtener producto',
                message: error.message
            })
        };
    }
};
