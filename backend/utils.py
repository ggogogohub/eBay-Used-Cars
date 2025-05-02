from bson.objectid import ObjectId

# Function to convert ObjectId to string
def convert_object_ids(doc):
    """
    Recursively convert all ObjectId instances in a document (dict or list)
    to their string representation.
    """
    if isinstance(doc, dict):
        return {key: convert_object_ids(value) for key, value in doc.items()}
    elif isinstance(doc, list):
        return [convert_object_ids(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc
