from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Servir arquivos estáticos do diretório correto
@app.route('/')
def index():
    return send_from_directory('codigo/public/static/page1')

# Servir CSS, JS e outros arquivos estáticos
@app.route('/<path:filename>')
def serve_static(filename):
    # Tenta servir da estrutura atual
    static_dirs = [
        'codigo/public/static/page1',
        'codigo/public/scripts/page1',
        'codigo/public'
    ]
    
    for static_dir in static_dirs:
        file_path = os.path.join(static_dir, filename)
        if os.path.exists(file_path):
            return send_from_directory(static_dir, filename)
    
    # Fallback para arquivos na raiz
    return send_from_directory('.', filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)