# app.py
from flask import Flask
app = Flask(__name__)

@app.route('codigo/servidor.py')
def hello():
    return 'Meu app está funcionando!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)