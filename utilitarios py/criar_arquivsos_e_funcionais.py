# map_fast_timeouts.py
import os
import re
from pathlib import Path
from collections import defaultdict
import json

class FastTimeoutMapper:
    def __init__(self, project_path='.'):
        self.project_path = Path(project_path)
        self.fast_timeouts = []
        self.timeout_stats = {
            '<10ms': [],
            '10-50ms': [],
            '51-100ms': [],
            '101-150ms': [],
            '151-200ms': []
        }
        
    def scan_all_files(self):
        """Escaneia todos os arquivos em busca de setTimeout"""
        extensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.vue', '.svelte']
        files_scanned = 0
        
        for ext in extensions:
            for file_path in self.project_path.rglob(f'*{ext}'):
                try:
                    self._scan_file(file_path)
                    files_scanned += 1
                except Exception as e:
                    print(f"Erro ao ler {file_path}: {e}")
        
        print(f" Arquivos escaneados: {files_scanned}")
        return files_scanned
    
    def _scan_file(self, file_path):
        """Escaneia um arquivo específico"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except:
            return
        
        # Padrões para encontrar setTimeout
        patterns = [
            # setTimeout(fn, 100)
            r'setTimeout\s*\(\s*(?:function|\(\)\s*=>|[^,]+)\s*,\s*(\d+)\s*\)',
            # setTimeout("string", 100)
            r'setTimeout\s*\(\s*["\'][^"\']+["\']\s*,\s*(\d+)\s*\)',
            # var timeout = 100; setTimeout(fn, timeout)
            r'(?:var|let|const)\s+(\w+)\s*=\s*(\d+)\s*;.*?setTimeout\s*\(\s*[^,]+,\s*\1\s*\)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.DOTALL | re.IGNORECASE)
            for match in matches:
                try:
                    # Pega o valor do timeout
                    timeout_val = match.group(1)
                    if timeout_val.isdigit():
                        timeout_ms = int(timeout_val)
                        
                        # Se for menor que 200ms
                        if timeout_ms < 200:
                            self._add_finding(file_path, content, match, timeout_ms)
                except:
                    pass
        
        # Procura por variáveis que podem ser usadas em setTimeout
        var_pattern = r'(?:var|let|const)\s+(\w+)\s*=\s*(\d{1,3})\s*;'
        var_matches = re.finditer(var_pattern, content)
        
        var_values = {}
        for match in var_matches:
            var_name = match.group(1)
            var_value = int(match.group(2))
            if var_value < 200:
                var_values[var_name] = var_value
        
        # Verifica se essas variáveis são usadas em setTimeout
        if var_values:
            for var_name, var_value in var_values.items():
                timeout_pattern = rf'setTimeout\s*\(\s*[^,]+,\s*{var_name}\s*\)'
                timeout_matches = re.finditer(timeout_pattern, content)
                for match in timeout_matches:
                    self._add_finding(file_path, content, match, var_value, is_variable=True)
    
    def _add_finding(self, file_path, content, match, timeout_ms, is_variable=False):
        """Adiciona um achado à lista"""
        line_num = content[:match.start()].count('\n') + 1
        
        # Pega o contexto
        lines = content.split('\n')
        start_line = max(0, line_num - 3)
        end_line = min(len(lines), line_num + 2)
        context = []
        for i in range(start_line, end_line):
            prefix = '>>' if i == line_num - 1 else '  '
            context.append(f"{prefix} {i+1}: {lines[i]}")
        
        finding = {
            'file': str(file_path),
            'line': line_num,
            'timeout_ms': timeout_ms,
            'is_variable': is_variable,
            'code': '\n'.join(context),
            'function_context': self._get_function_context(content, match.start())
        }
        
        self.fast_timeouts.append(finding)
        
        # Categoriza por tempo
        if timeout_ms < 10:
            self.timeout_stats['<10ms'].append(finding)
        elif timeout_ms <= 50:
            self.timeout_stats['10-50ms'].append(finding)
        elif timeout_ms <= 100:
            self.timeout_stats['51-100ms'].append(finding)
        elif timeout_ms <= 150:
            self.timeout_stats['101-150ms'].append(finding)
        elif timeout_ms <= 200:
            self.timeout_stats['151-200ms'].append(finding)
    
    def _get_function_context(self, content, position):
        """Tenta identificar em qual função o setTimeout está"""
        # Procura pela função mais próxima
        function_patterns = [
            r'function\s+(\w+)\s*\([^)]*\)\s*{',
            r'const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)\s*{',
            r'(\w+)\s*:\s*function\s*\([^)]*\)\s*{',
        ]
        
        # Encontra a posição de todas as funções
        functions = []
        for pattern in function_patterns:
            for match in re.finditer(pattern, content):
                func_start = match.start()
                func_name = match.group(1) if len(match.groups()) > 0 else 'anonymous'
                if func_start < position:
                    functions.append((func_start, func_name))
        
        if functions:
            # Pega a função mais próxima antes da posição
            last_func = max(functions, key=lambda x: x[0])
            return last_func[1]
        return 'global_scope'
    
    def generate_report(self):
        """Gera relatório detalhado"""
        print("\n" + "="*70)
        print("🔍 MAPEAMENTO DE setTimeout < 200ms")
        print("="*70)
        
        total = len(self.fast_timeouts)
        if total == 0:
            print(" Nenhum setTimeout < 200ms encontrado!")
            return
        
        print(f"\n TOTAL ENCONTRADO: {total}\n")
        
        # Estatísticas por categoria
        print("📈 DISTRIBUIÇÃO POR TEMPO:")
        print("-" * 40)
        for category, items in self.timeout_stats.items():
            if items:
                percentage = (len(items) / total) * 100
                print(f"{category}: {len(items)} ({percentage:.1f}%)")
        
        # Top 10 mais rápidos
        print("\n⚡ TOP 10 SETTIMEOUT MAIS RÁPIDOS:")
        print("-" * 70)
        sorted_timeouts = sorted(self.fast_timeouts, key=lambda x: x['timeout_ms'])
        for i, finding in enumerate(sorted_timeouts[:10]):
            print(f"{i+1}. {finding['timeout_ms']}ms - {finding['file']}:{finding['line']}")
            print(f"   Função: {finding.get('function_context', 'desconhecida')}")
        
        # Agrupar por arquivo
        print("\n POR ARQUIVO:")
        print("-" * 70)
        by_file = defaultdict(list)
        for finding in self.fast_timeouts:
            by_file[finding['file']].append(finding)
        
        for file_path, findings in sorted(by_file.items(), key=lambda x: len(x[1]), reverse=True):
            rel_path = os.path.relpath(file_path, self.project_path)
            times = [f['timeout_ms'] for f in findings]
            avg_time = sum(times) / len(times)
            print(f"📄 {rel_path}")
            print(f"   Total: {len(findings)} | Média: {avg_time:.1f}ms | Min: {min(times)}ms | Max: {max(times)}ms")
        
        # Detalhes completos
        print("\n🔍 DETALHES COMPLETOS:")
        print("=" * 70)
        for i, finding in enumerate(sorted_timeouts):
            print(f"\n--- #{i+1}: {finding['timeout_ms']}ms ---")
            print(f"Arquivo: {finding['file']}")
            print(f"Linha: {finding['line']}")
            print(f"Função: {finding.get('function_context', 'global')}")
            print("Código:")
            print(finding['code'])
            print("-" * 40)
    
    def export_json(self, filename='fast_timeouts.json'):
        """Exporta resultados para JSON"""
        output = {
            'total': len(self.fast_timeouts),
            'statistics': {
                cat: len(items) for cat, items in self.timeout_stats.items()
            },
            'fast_timeouts': self.fast_timeouts
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n Dados exportados para {filename}")
    
    def suggest_fixes(self):
        """Sugere correções para os timeouts encontrados"""
        print("\n SUGESTÕES DE CORREÇÃO:")
        print("=" * 70)
        
        for finding in self.fast_timeouts:
            if finding['timeout_ms'] < 50:
                print(f"\n⚠️ TIMEOUT MUITO BAIXO: {finding['timeout_ms']}ms")
                print(f"Arquivo: {finding['file']}:{finding['line']}")
                print("Sugestão: Aumente para pelo menos 100ms para melhor UX")
                
                # Tenta sugerir um valor específico baseado no contexto
                if 'loading' in finding['code'].lower() or 'loader' in finding['code'].lower():
                    print("  → É um loader? Use 300-500ms para evitar flicker")
                elif 'close' in finding['code'].lower() or 'fechar' in finding['code'].lower():
                    print("  → É fechamento de modal? Use pelo menos 2000ms (2s)")
                elif 'message' in finding['code'].lower() or 'mensagem' in finding['code'].lower():
                    print("  → É mensagem para usuário? Use 3000-5000ms (3-5s)")

def scan_error_handler_specific():
    """Escaneia especificamente o error-handler.js em busca de setTimeout"""
    if os.path.exists('error-handler.js'):
        print("\n ANALISANDO ESPECIFICAMENTE error-handler.js")
        print("=" * 50)
        
        with open('error-handler.js', 'r') as f:
            content = f.read()
        
        # Procura todos os setTimeout
        timeouts = re.finditer(r'setTimeout\s*\(\s*[^,]+,\s*(\d+)\s*\)', content)
        
        found = False
        for match in timeouts:
            timeout_val = int(match.group(1))
            line_num = content[:match.start()].count('\n') + 1
            
            if timeout_val < 200:
                found = True
                print(f" setTimeout PERIGOSO: {timeout_val}ms na linha {line_num}")
                
                # Mostra o contexto
                lines = content.split('\n')
                for i in range(max(0, line_num-2), min(len(lines), line_num+1)):
                    prefix = '>>' if i == line_num-1 else '  '
                    print(f"{prefix} {i+1}: {lines[i]}")
            else:
                print(f" setTimeout seguro: {timeout_val}ms na linha {line_num}")
        
        if not found:
            print("Nenhum setTimeout encontrado no error-handler.js")
        
        # Procura especificamente pelo setTimeout de 1100ms que você mencionou
        specific = re.search(r'setTimeout\s*\(\s*\(?\s*\)?\s*=>\s*{[^}]*window\.close\(\)[^}]*},\s*1100', content)
        if specific:
            line_num = content[:specific.start()].count('\n') + 1
            print(f"\n🔴 PROBLEMA ESPECÍFICO ENCONTRADO:")
            print(f"Linha {line_num}: setTimeout de 1100ms com window.close()")
            print("Este é o culpado pelo fechamento rápido!")
            print("\nSOLUÇÃO: Remova este setTimeout ou aumente para 10000ms (10s)")

def main():
    print(" Iniciando mapeamento de setTimeout < 200ms...")
    print(f"📂 Diretório: {os.getcwd()}\n")
    
    mapper = FastTimeoutMapper()
    
    # Escaneia todos os arquivos
    files_scanned = mapper.scan_all_files()
    
    # Escaneia especificamente o error-handler.js
    scan_error_handler_specific()
    
    # Gera relatório
    mapper.generate_report()
    
    # Exporta para JSON
    mapper.export_json()
    
    # Sugere correções
    mapper.suggest_fixes()
    
    print("\n" + "="*70)
    print("📋 INSTRUÇÕES PARA DEBUG NO CONSOLE DO NAVEGADOR:")
    print("="*70)
    print("""
// Cole isto no console para monitorar todos os setTimeout
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(fn, delay) {
    if (delay < 200) {
        console.group('⚠️ setTimeout RÁPIDO detectado!');
        console.log('⏱️ Delay:', delay, 'ms');
        console.trace('📌 Quem chamou:');
        console.groupEnd();
        
        // Opcional: pausa a execução
        // debugger;
    }
    return originalSetTimeout(fn, delay);
};

console.log(' Monitor de setTimeout instalado!');
""")

if __name__ == "__main__":
    main()
