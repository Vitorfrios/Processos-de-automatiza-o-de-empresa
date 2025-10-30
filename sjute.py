#!/usr/bin/env python3
"""
GERADOR DE ARQUIVOS PARA DEPLOY NO RENDER
Autor: Assistente
Descrição: Cria todos os arquivos necessários para deploy no Render
"""

import os
import sys

def criar_arquivo(nome_arquivo, conteudo):
    """Cria um arquivo com o conteúdo especificado"""
    try:
        with open(nome_arquivo, 'w', encoding='utf-8') as f:
            f.write(conteudo)
        print(f"✅ Arquivo criado: {nome_arquivo}")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar {nome_arquivo}: {e}")
        return False

def main():
    print("🎯 GERADOR DE ARQUIVOS PARA DEPLOY NO RENDER")
    print("=" * 50)
    
    # Solicitar informações do projeto
    nome_projeto = input("📝 Nome do seu projeto: ").strip() or "meu-projeto"
    versao_python = input("🐍 Versão do Python (ex: 3.11.0): ").strip() or "3.11.0"
    porta = input("🔌 Porta do app (ex: 10000): ").strip() or "10000"
    
    # Framework sendo usado
    print("\n🚀 Qual framework você está usando?")
    print("1 - Flask")
    print("2 - Django") 
    print("3 - FastAPI")
    print("4 - Apenas Python (sem framework)")
    opcao = input("Escolha (1-4): ").strip() or "1"
    
    framework_map = {"1": "flask", "2": "django", "3": "fastapi", "4": "python"}
    framework = framework_map.get(opcao, "flask")
    
    # Criar requirements.txt
    requirements_content = ""
    if framework == "flask":
        requirements_content = """Flask==2.3.3
gunicorn==21.2.0
Werkzeug==2.3.7
"""
    elif framework == "django":
        requirements_content = """Django==4.2.7
gunicorn==21.2.0
psycopg2-binary==2.9.9
whitenoise==6.6.0
"""
    elif framework == "fastapi":
        requirements_content = """fastapi==0.104.1
uvicorn==0.24.0
gunicorn==21.2.0
python-multipart==0.0.6
"""
    else:
        requirements_content = """gunicorn==21.2.0
"""
    
    criar_arquivo("requirements.txt", requirements_content)
    
    # Criar runtime.txt
    runtime_content = f"python-{versao_python}"
    criar_arquivo("runtime.txt", runtime_content)
    
    # Criar render.yaml (Render Blueprint)
    render_yaml = f"""# Render Blueprint para {nome_projeto}
# Documentação: https://render.com/docs/blueprint-spec

services:
  - type: web
    name: {nome_projeto}
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:{porta}
    envVars:
      - key: PYTHON_VERSION
        value: {versao_python}
      - key: PORT
        value: {porta}
    
    # Descomente se usar banco de dados
    # database:
    #   - name: {nome_projeto}-db
    #     plan: free
    #     databaseName: {nome_projeto}
    #     user: {nome_projeto}_user
"""
    criar_arquivo("render.yaml", render_yaml)
    
    # Criar app.py básico baseado no framework
    if framework == "flask":
        app_content = f"""from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({{
        'message': '🚀 {nome_projeto} está funcionando no Render!',
        'status': 'success',
        'framework': 'Flask'
    }})

@app.route('/health')
def health():
    return jsonify({{'status': 'healthy'}})

@app.route('/api/info')
def info():
    return jsonify({{
        'python_version': '{versao_python}',
        'port': {porta}
    }})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', {porta}))
    app.run(host='0.0.0.0', port=port, debug=False)
"""
    elif framework == "fastapi":
        app_content = f"""from fastapi import FastAPI
import os

app = FastAPI(title="{nome_projeto}", version="1.0.0")

@app.get("/")
async def root():
    return {{
        "message": "🚀 {nome_projeto} está funcionando no Render!",
        "status": "success", 
        "framework": "FastAPI"
    }}

@app.get("/health")
async def health():
    return {{"status": "healthy"}}

@app.get("/api/info")
async def info():
    return {{
        "python_version": "{versao_python}",
        "port": {porta}
    }}

# Para executar: uvicorn app:app --host 0.0.0.0 --port $PORT
"""
    else:  # Python simples ou fallback
        app_content = f"""# {nome_projeto} - Aplicação Python
import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({{
        'message': '🚀 {nome_projeto} está rodando no Render!',
        'status': 'success',
        'python_version': '{versao_python}'
    }})

@app.route('/health')
def health():
    return jsonify({{'status': 'healthy'}})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', {porta}))
    app.run(host='0.0.0.0', port=port, debug=False)
"""
    
    criar_arquivo("app.py", app_content)
    
    # Criar .env.example
    env_example = f"""# Configurações de Ambiente para {nome_projeto}
# Copie para .env e preencha com seus valores

DEBUG=False
PORT={porta}
PYTHON_VERSION={versao_python}

# Banco de dados (descomente se necessário)
# DATABASE_URL=postgresql://user:password@localhost/dbname
# SECRET_KEY=sua_chave_secreta_aqui
"""
    criar_arquivo(".env.example", env_example)
    
    # Criar .gitignore
    gitignore = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# Environment variables
.env
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
    criar_arquivo(".gitignore", gitignore)
    
    # Criar README.md
    # Criar README.md
    readme_content = f"""# {nome_projeto.title()}

🚀 Aplicação Python deployada no Render

## 📋 Pré-requisitos

- Python {versao_python}
- Git

## 🛠️ Instalação Local

```bash
# Clone o repositório
git clone <seu-repositorio>

# Entre no diretório
cd {nome_projeto}

# Crie ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\\Scripts\\activate  # Windows

# Instale dependências
pip install -r requirements.txt

# Execute localmente
python app.py """