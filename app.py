from flask import Flask, send_from_directory, jsonify
import os
import datetime

app = Flask(__name__)

# Health Check para o Render - ESSENCIAL!
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'service': 'obra-system',
        'python_version': '3.11.9'
    }), 200

# Status do servidor
@app.route('/status')
def status():
    return jsonify({
        'status': 'online',
        'server_time': datetime.datetime.now().isoformat(),
        'environment': 'production'
    })

# Servir arquivos estáticos do diretório correto
@app.route('/')
def index():
    return send_from_directory('codigo/public/static/page1', 'index.html')

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

# Rota para evitar shutdown acidental em produção
@app.route('/shutdown', methods=['POST'])
def shutdown():
    return jsonify({
        'error': 'Shutdown não permitido em ambiente de produção',
        'message': 'Use o Render Dashboard para gerenciar o serviço'
    }), 403

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Servidor obra-system iniciando na porta {port}")
    print(f"📍 Health check disponível em: http://0.0.0.0:{port}/health")
    app.run(host='0.0.0.0', port=port, debug=False)