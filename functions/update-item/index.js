/**
 * UPDATE ITEM FUNCTION
 *
 * Purpose: Update an existing product
 * API Endpoint: PUT /products/{id}
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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

        // Parse request body
        const body = JSON.parse(event.body);

        // Check if product exists
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                productId: productId
            }
        });

        const getResult = await dynamodb.send(getCommand);

        if (!getResult.Item) {
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

        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (body.name !== undefined) {
            updateExpressions.push('#name = :name');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeValues[':name'] = body.name;
        }

        if (body.description !== undefined) {
            updateExpressions.push('#description = :description');
            expressionAttributeNames['#description'] = 'description';
            expressionAttributeValues[':description'] = body.description;
        }

        if (body.price !== undefined) {
            updateExpressions.push('#price = :price');
            expressionAttributeNames['#price'] = 'price';
            expressionAttributeValues[':price'] = parseFloat(body.price);
        }

        if (body.category !== undefined) {
            updateExpressions.push('#category = :category');
            expressionAttributeNames['#category'] = 'category';
            expressionAttributeValues[':category'] = body.category;
        }

        if (body.stock !== undefined) {
            updateExpressions.push('#stock = :stock');
            expressionAttributeNames['#stock'] = 'stock';
            expressionAttributeValues[':stock'] = parseInt(body.stock, 10);
        }

        if (body.imageUrl !== undefined) {
            updateExpressions.push('#imageUrl = :imageUrl');
            expressionAttributeNames['#imageUrl'] = 'imageUrl';
            expressionAttributeValues[':imageUrl'] = body.imageUrl;
        }

        // Always update updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        // Update item in DynamoDB
        const updateCommand = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                productId: productId
            },
            UpdateExpression: 'SET ' + updateExpressions.join(', '),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        });

        const updateResult = await dynamodb.send(updateCommand);

        console.log('Product updated:', productId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateResult.Attributes)
        };
    } catch (error) {
        console.error('Error updating product:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Error al actualizar producto',
                message: error.message
            })
        };
    }
};
