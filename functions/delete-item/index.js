/**
 * DELETE ITEM FUNCTION
 *
 * Purpose: Remove a product from the catalog
 * API Endpoint: DELETE /products/{id}
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

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

        // Delete item from DynamoDB
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                productId: productId
            }
        });

        await dynamodb.send(command);

        console.log('Product deleted:', productId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Producto eliminado exitosamente',
                productId: productId
            })
        };
    } catch (error) {
        console.error('Error deleting product:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Error al eliminar producto',
                message: error.message
            })
        };
    }
};
