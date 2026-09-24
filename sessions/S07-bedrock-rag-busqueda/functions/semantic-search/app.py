import json
import math
import os
import re
import unicodedata

import boto3

PRODUCTS_TABLE = os.environ["PRODUCTS_TABLE"]
EMBED_MODEL_ID = os.environ.get(
    "EMBED_MODEL_ID",
    "amazon.titan-embed-text-v2:0"
)
TOP_K = int(os.environ.get("SEARCH_TOP_K", "5"))

bedrock = boto3.client("bedrock-runtime")
table = boto3.resource("dynamodb").Table(PRODUCTS_TABLE)


STOPWORDS = {
    "algo", "para", "de", "del", "la", "el", "los", "las",
    "un", "una", "unos", "unas", "que", "quiero", "busco",
    "me", "con", "y", "o", "en",
    "ropa", "producto", "productos", "prenda", "prendas"
}


SYNONYMS = {
    "frio": [
        "invierno",
        "abrigado",
        "abrigo",
        "chaqueta",
        "ropa calida",
        "lana"
    ],
    "invierno": [
        "frio",
        "abrigo",
        "chaqueta",
        "ropa abrigadora"
    ],
    "abrigado": [
        "abrigo",
        "chaqueta",
        "frio",
        "invierno",
        "lana"
    ],
    "abrigo": [
        "chaqueta",
        "prenda exterior",
        "invierno",
        "ropa para frio"
    ],
    "zapatos": [
        "tenis",
        "calzado",
        "zapatillas"
    ],
    "zapato": [
        "tenis",
        "calzado",
        "zapatillas"
    ],
    "tenis": [
        "zapatos",
        "calzado",
        "zapatillas"
    ],
    "bolsa": [
        "bolso",
        "tote",
        "accesorio"
    ],
    "bolso": [
        "bolsa",
        "tote",
        "accesorio"
    ],
    "blanco": [
        "blanca",
        "blancos",
        "blancas",
        "crema",
        "claro"
    ],
    "blanca": [
        "blanco",
        "crema",
        "claro"
    ],
    "vestido": [
        "vestidos",
        "ropa femenina"
    ],
    "casual": [
        "comodo",
        "relajado",
        "diario"
    ],
}


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def _normalize(text):
    text = str(text or "").lower()

    text = "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )

    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _tokens(text):
    return [
        token
        for token in _normalize(text).split()
        if token not in STOPWORDS and len(token) > 1
    ]


def _expand_query(query):
    normalized = _normalize(query)
    tokens = _tokens(query)

    extras = []

    for token in tokens:
        extras.extend(SYNONYMS.get(token, []))

    if extras:
        return normalized + " " + " ".join(extras)

    return normalized


def _embed(text):
    resp = bedrock.invoke_model(
        modelId=EMBED_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "inputText": text
        }),
    )

    return json.loads(
        resp["body"].read()
    )["embedding"]


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))

    na = math.sqrt(
        sum(x * x for x in a)
    )

    nb = math.sqrt(
        sum(y * y for y in b)
    )

    if na == 0 or nb == 0:
        return 0.0

    return dot / (na * nb)


def _lexical_score(query, item):
    query_tokens = _tokens(query)

    if not query_tokens:
        return 0.0, 0.0

    name = _normalize(
        item.get("name", "")
    )

    category = _normalize(
        item.get("category", "")
    )

    description = _normalize(
        item.get("description", "")
    )

    labels = _normalize(
        " ".join(
            item.get("aiLabels", []) or []
        )
    )

    full_text = " ".join([
        name,
        category,
        description,
        labels
    ])

    name_matches = sum(
        1
        for token in query_tokens
        if token in name or token in category
    )

    text_matches = sum(
        1
        for token in query_tokens
        if token in full_text
    )

    name_score = (
        name_matches / len(query_tokens)
    )

    text_score = (
        text_matches / len(query_tokens)
    )

    return name_score, text_score


def lambda_handler(event, context):
    print(
        "Event:",
        json.dumps(event)
    )

    query = (
        (event.get("queryStringParameters") or {})
        .get("q", "")
        .strip()
    )

    if not query:
        return _response(
            400,
            {
                "error":
                "Falta el parámetro de consulta ?q="
            }
        )

    expanded_query = _expand_query(query)

    print(
        "Original query:",
        query
    )

    print(
        "Expanded query:",
        expanded_query
    )

    try:
        q_vec = _embed(
            expanded_query
        )

    except Exception as e:
        print(
            "Embed error:",
            repr(e)
        )

        return _response(
            502,
            {
                "error":
                "Fallo al generar el embedding de la consulta",
                "detail":
                str(e)
            }
        )

    items = table.scan().get(
        "Items",
        []
    )

    scored = []

    for item in items:
        emb = item.get(
            "embedding"
        )

        if not emb:
            continue

        try:
            vec = json.loads(
                emb
            )

        except (
            TypeError,
            json.JSONDecodeError
        ):
            continue

        semantic_score = _cosine(
            q_vec,
            vec
        )

        name_score, text_score = (
            _lexical_score(
                query,
                item
            )
        )

        final_score = (
            semantic_score
            + (0.25 * name_score)
            + (0.10 * text_score)
        )

        normalized_query = _normalize(
            query
        )

        normalized_name = _normalize(
            item.get("name", "")
        )

        if (
            normalized_query
            and normalized_query
            in normalized_name
        ):
            final_score += 0.15

        scored.append(
            {
                "productId":
                    item["productId"],

                "name":
                    item.get(
                        "name",
                        ""
                    ),

                "category":
                    item.get(
                        "category",
                        ""
                    ),

                "price":
                    float(
                        item["price"]
                    )
                    if item.get("price")
                    is not None
                    else None,

                "score":
                    round(
                        final_score,
                        4
                    ),

                "semanticScore":
                    round(
                        semantic_score,
                        4
                    ),
            }
        )

    scored.sort(
        key=lambda x:
        x["score"],
        reverse=True
    )

    if not scored:
        return _response(
            200,
            {
                "query":
                    query,
                "results":
                    []
            }
        )

    best_score = scored[0]["score"]

    minimum_score = max(
        0.10,
        best_score * 0.60
    )

    filtered = [
        result
        for result in scored
        if result["score"]
        >= minimum_score
    ]

    filtered = filtered[:TOP_K]

    return _response(
        200,
        {
            "query":
                query,

            "expandedQuery":
                expanded_query,

            "results":
                filtered,
        }
    )
