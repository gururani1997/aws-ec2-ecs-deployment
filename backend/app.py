from flask import Flask, jsonify, request
from pymongo import MongoClient
import os
from dotenv import load_dotenv
app = Flask(__name__)

client = MongoClient(os.getenv('MONGO_URI'))
print(client)
db = client.get_database('MongoLearn')
collection = db.get_collection('py_users')

load_dotenv()

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    print(data)
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    if not name or not email:
        error = "All fields are required"
        return jsonify({"error": error}), 400
    try:
        collection.insert_one({"name": name, "email": email})
        return jsonify({"message": "Data submitted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
