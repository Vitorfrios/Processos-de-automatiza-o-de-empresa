import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import traceback

class ExcelToJsonConverter:
    """Converte arquivos Excel para o formato JSON do sistema - ATUALIZADO COM TUBOS"""
    
    def convert_excel_to_json(self, excel_file_path: str) -> Dict[str, Any]:
        """
        Converte arquivo Excel para JSON estruturado do sistema - COM TUBOS
        """
        print(f"\n{'='*60}")
        print(f"🔧 CONVERSÃO EXCEL PARA JSON - INICIANDO")
        print(f"{'='*60}")
        print(f"📁 Arquivo: {excel_file_path}")
        
        try:
            # ✅ CORREÇÃO CRÍTICA: Usar ExcelFile como contexto para fechar automaticamente
            with pd.ExcelFile(excel_file_path) as excel_file:
                excel_data = {}
                for sheet_name in excel_file.sheet_names:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    excel_data[sheet_name] = df
                
                print(f"✅ Excel lido. Sheets encontradas: {list(excel_data.keys())}")
                
                # ✅ Estrutura atualizada com dutos e tubos como arrays
                system_data = {
                    'constants': {},
                    'machines': [],
                    'materials': {},
                    'empresas': [],
                    'banco_equipamentos': {},
                    'dutos': [],   # Array direto
                    'tubos': []    # Array direto
                }
                
                # Processar cada sheet
                for sheet_name, df in excel_data.items():
                    print(f"\n📑 Processando sheet: '{sheet_name}' ({df.shape[0]}x{df.shape[1]})")
                    
                    try:
                        sheet_name_lower = sheet_name.lower().strip()
                        
                        if sheet_name_lower in ['constants', 'constantes']:
                            system_data['constants'] = self._parse_constants(df)
                            print(f"   ✅ Constants: {len(system_data['constants'])}")
                        
                        elif sheet_name_lower in ['machines', 'máquinas', 'maquinas']:
                            system_data['machines'] = self._parse_machines(df)
                            print(f"   ✅ Machines: {len(system_data['machines'])}")
                        
                        elif sheet_name_lower in ['materials', 'materiais']:
                            system_data['materials'] = self._parse_materials(df)
                            print(f"   ✅ Materials: {len(system_data['materials'])}")
                        
                        elif sheet_name_lower in ['empresas', 'companies']:
                            system_data['empresas'] = self._parse_empresas(df)
                            print(f"   ✅ Empresas: {len(system_data['empresas'])}")
                        
                        elif sheet_name_lower in ['equipamentos', 'equipments', 'banco_equipamentos']:
                            system_data['banco_equipamentos'] = self._parse_equipamentos(df)
                            print(f"   ✅ Equipamentos: {len(system_data['banco_equipamentos'])} tipos")
                        
                        elif sheet_name_lower in ['dutos', 'ducts']:
                            system_data['dutos'] = self._parse_dutos_novo(df, sheet_name)
                            print(f"   ✅ Dutos: {len(system_data['dutos'])} tipos")
                        
                        elif sheet_name_lower in ['tubos', 'pipes', 'tubes']:
                            system_data['tubos'] = self._parse_tubos(df, sheet_name)
                            print(f"   ✅ Tubos: {len(system_data['tubos'])} tipos")
                        
                        else:
                            print(f"   ⚠️  Sheet não reconhecida: '{sheet_name}'")
                            
                    except Exception as sheet_error:
                        print(f"   ❌ ERRO na sheet '{sheet_name}': {sheet_error}")
                        traceback.print_exc()
                        # Continuar com outras sheets mesmo se uma falhar
                
                # Validar estrutura
                print(f"\n{'='*60}")
                print(f"📊 VALIDAÇÃO DA ESTRUTURA")
                print(f"{'='*60}")
                
                validation = self._validate_structure(system_data)
                if validation["valid"]:
                    print(f"✅ Estrutura válida!")
                else:
                    print(f"❌ Problemas na estrutura: {validation['errors']}")
                
                print(f"\n📦 DADOS CONVERTIDOS:")
                print(f"   • Constants: {len(system_data['constants'])}")
                print(f"   • Machines: {len(system_data['machines'])}")
                print(f"   • Materials: {len(system_data['materials'])}")
                print(f"   • Empresas: {len(system_data['empresas'])}")
                print(f"   • Equipamentos: {len(system_data['banco_equipamentos'])} tipos")
                print(f"   • Dutos: {len(system_data['dutos'])} tipos")
                print(f"   • Tubos: {len(system_data['tubos'])} tipos")
                
                if system_data['dutos']:
                    print(f"\n🔍 DETALHES DOS DUTOS:")
                    for i, duto in enumerate(system_data['dutos'][:3]):  # Mostrar 3 primeiros
                        print(f"   {i+1}. {duto.get('type', 'N/A')}: {duto.get('valor', 0)}")
                        if 'opcionais' in duto:
                            print(f"      Opcionais: {len(duto['opcionais'])}")
                
                if system_data['tubos']:
                    print(f"\n🔍 DETALHES DOS TUBOS (primeiros 3):")
                    for i, tubo in enumerate(system_data['tubos'][:3]):  # Mostrar 3 primeiros
                        print(f"   {i+1}. {tubo.get('polegadas', 'N/A')}: mm={tubo.get('mm', 0)}, valor={tubo.get('valor', 0)}")
                
                print(f"\n{'='*60}")
                print(f"✅ CONVERSÃO CONCLUÍDA COM SUCESSO!")
                print(f"{'='*60}\n")
                
                return system_data
                
        except Exception as e:
            print(f"\n❌ ERRO CRÍTICO na conversão: {e}")
            traceback.print_exc()
            raise Exception(f"Erro ao converter Excel: {str(e)}")
    
    def _parse_constants(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse constants da sheet"""
        constants = {}
        
        # Verificar estrutura
        print(f"   🔍 Analisando estrutura Constants...")
        print(f"   📝 Colunas: {list(df.columns)}")
        
        # Procurar colunas chave
        key_col = None
        value_col = None
        desc_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if 'key' in col_lower or 'chave' in col_lower:
                key_col = col
            elif 'value' in col_lower or 'valor' in col_lower:
                value_col = col
            elif 'desc' in col_lower:
                desc_col = col
        
        print(f"   🔑 Colunas identificadas: key={key_col}, value={value_col}, desc={desc_col}")
        
        # Processar linhas
        for _, row in df.iterrows():
            # Pular linhas vazias
            if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                continue
            
            # Usar colunas identificadas ou padrão
            key = str(row[key_col] if key_col else row.iloc[0]).strip()
            
            # Buscar valor
            value = None
            if value_col and pd.notna(row[value_col]):
                value = row[value_col]
            else:
                # Procurar em qualquer coluna
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]) and str(row.iloc[i]).strip() != '':
                        value = row.iloc[i]
                        break
            
            if value is None:
                continue
            
            # Buscar descrição
            description = ""
            if desc_col and pd.notna(row[desc_col]):
                description = str(row[desc_col])
            else:
                # Procurar em outras colunas
                for i in range(2, len(row)):
                    if pd.notna(row.iloc[i]) and str(row.iloc[i]).strip() != '':
                        cell_str = str(row.iloc[i])
                        # Se não parece ser número, pode ser descrição
                        try:
                            float(cell_str)
                        except ValueError:
                            description = cell_str
                            break
            
            # Converter valor
            try:
                if isinstance(value, (int, float, np.number)):
                    num_value = float(value)
                else:
                    num_value = float(str(value).replace(',', '.'))
            except (ValueError, TypeError):
                num_value = str(value)
            
            constants[key] = {
                'value': num_value,
                'description': description
            }
        
        return constants
    
    def _parse_machines(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse machines"""
        machines = []
        current_machine = None
        
        print(f"   🔍 Analisando estrutura Machines...")
        print(f"   📝 Colunas: {list(df.columns)}")
        
        for _, row in df.iterrows():
            # Pular linhas completamente vazias
            if pd.isna(row.iloc[0]) and (len(row) < 2 or pd.isna(row.iloc[1])):
                continue
            
            # Verificar se é linha de tipo
            first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
            
            if 'type' in df.columns or 'tipo' in df.columns:
                # Sheet estruturada com colunas
                machine_type = str(row['type']) if 'type' in df.columns else str(row['tipo'])
                if pd.notna(machine_type) and machine_type.strip():
                    if current_machine:
                        machines.append(current_machine)
                    
                    current_machine = {
                        'type': machine_type.strip(),
                        'impostos': {
                            'PIS_COFINS': 'INCL',
                            'IPI': 'ISENTO',
                            'ICMS': '12%',
                            'PRAZO': '45 a 60 dias',
                            'FRETE': 'FOB/Cabreúva/SP'
                        },
                        'configuracoes_instalacao': [],
                        'baseValues': {},
                        'options': [],
                        'voltages': []
                    }
            else:
                # Sheet no formato antigo
                if any(word in first_cell.lower() for word in ['type', 'tipo', 'máquina', 'machine']):
                    if current_machine:
                        machines.append(current_machine)
                    
                    machine_type = first_cell.replace('type:', '').replace('tipo:', '').strip()
                    if machine_type:
                        current_machine = {
                            'type': machine_type,
                            'impostos': {
                                'PIS_COFINS': 'INCL',
                                'IPI': 'ISENTO',
                                'ICMS': '12%',
                                'PRAZO': '45 a 60 dias',
                                'FRETE': 'FOB/Cabreúva/SP'
                            },
                            'configuracoes_instalacao': [],
                            'baseValues': {},
                            'options': [],
                            'voltages': []
                        }
            
            # Processar valores de capacidade
            if current_machine and len(row) >= 3:
                capacity = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
                value = row.iloc[2] if len(row) > 2 and pd.notna(row.iloc[2]) else None
                
                if capacity and value is not None:
                    try:
                        current_machine['baseValues'][capacity] = float(value)
                    except (ValueError, TypeError):
                        current_machine['baseValues'][capacity] = str(value)
        
        # Adicionar última máquina
        if current_machine:
            machines.append(current_machine)
        
        return machines
    
    def _parse_materials(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse materials"""
        materials = {}
        
        print(f"   🔍 Analisando estrutura Materials...")
        print(f"   📝 Colunas: {list(df.columns)}")
        
        for _, row in df.iterrows():
            # Pular linhas vazias
            if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                continue
            
            # Identificar colunas
            key_col = None
            value_col = None
            unit_col = None
            desc_col = None
            
            for col in df.columns:
                col_lower = str(col).lower()
                if 'key' in col_lower or 'chave' in col_lower:
                    key_col = col
                elif 'value' in col_lower or 'valor' in col_lower:
                    value_col = col
                elif 'unit' in col_lower or 'unidade' in col_lower:
                    unit_col = col
                elif 'desc' in col_lower:
                    desc_col = col
            
            key = str(row[key_col] if key_col else row.iloc[0]).strip()
            
            # Buscar valor
            value = None
            if value_col and pd.notna(row[value_col]):
                value = row[value_col]
            else:
                for i in range(1, min(5, len(row))):
                    if pd.notna(row.iloc[i]):
                        try:
                            # Tentar converter para número
                            float_val = float(row.iloc[i])
                            value = float_val
                            break
                        except (ValueError, TypeError):
                            pass
            
            if value is None:
                continue
            
            # Buscar unidade
            unit = "un"
            if unit_col and pd.notna(row[unit_col]):
                unit = str(row[unit_col])
            
            # Buscar descrição
            description = ""
            if desc_col and pd.notna(row[desc_col]):
                description = str(row[desc_col])
            
            materials[key] = {
                'value': float(value) if isinstance(value, (int, float, np.number)) else str(value),
                'unit': unit,
                'description': description
            }
        
        return materials
    
    def _parse_empresas(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse empresas"""
        empresas = []
        
        print(f"   🔍 Analisando estrutura Empresas...")
        print(f"   📝 Colunas: {list(df.columns)}")
        print(f"   📊 Dimensões: {df.shape[0]} linhas × {df.shape[1]} colunas")
        
        # Verificar se tem cabeçalho
        first_row_vals = [str(val).lower() for val in df.iloc[0].values if pd.notna(val)]
        has_header = any(word in first_row_vals for word in ['sigla', 'empresa', 'company', 'cod'])
        
        start_row = 1 if has_header else 0
        
        print(f"   🔑 Cabeçalho detectado: {has_header}, iniciando na linha: {start_row}")
        
        for idx in range(start_row, len(df)):
            row = df.iloc[idx]
            
            # Pular linhas vazias
            if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                continue
            
            sigla = str(row.iloc[0]).strip()
            
            # Buscar nome da empresa
            empresa_nome = ""
            for i in range(1, min(5, len(row))):
                if pd.notna(row.iloc[i]):
                    empresa_nome = str(row.iloc[i]).strip()
                    break
            
            if sigla and empresa_nome:
                empresas.append({sigla: empresa_nome})
        
        return empresas
    
    def _parse_equipamentos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse banco_equipamentos"""
        equipamentos = {}
        
        print(f"   🔍 Analisando estrutura Equipamentos...")
        print(f"   📝 Colunas: {list(df.columns)}")
        
        current_tipo = None
        current_equipamento = {}
        
        for _, row in df.iterrows():
            # Verificar se é linha de tipo
            first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
            
            if 'tipo' in df.columns and pd.notna(row['tipo']):
                # Salvar equipamento anterior
                if current_tipo and current_equipamento:
                    equipamentos[current_tipo] = current_equipamento
                
                current_tipo = str(row['tipo'])
                current_equipamento = {
                    'descricao': str(row['descricao']) if 'descricao' in df.columns and pd.notna(row['descricao']) else current_tipo,
                    'valores_padrao': {}
                }
            elif any(word in first_cell.lower() for word in ['tipo', 'type', 'equipamento']):
                # Formato antigo
                if current_tipo and current_equipamento:
                    equipamentos[current_tipo] = current_equipamento
                
                current_tipo = first_cell.replace('tipo:', '').replace('type:', '').strip()
                current_equipamento = {
                    'descricao': current_tipo,
                    'valores_padrao': {}
                }
            
            # Processar valores/dimensões
            elif current_tipo and len(row) >= 2:
                dimensao = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                valor = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
                
                if dimensao and valor is not None and 'tipo' not in dimensao.lower():
                    try:
                        current_equipamento['valores_padrao'][dimensao] = float(valor)
                    except (ValueError, TypeError):
                        current_equipamento['valores_padrao'][dimensao] = str(valor)
        
        # Salvar último equipamento
        if current_tipo and current_equipamento:
            equipamentos[current_tipo] = current_equipamento
        
        return equipamentos
    
    def _parse_dutos_novo(self, df: pd.DataFrame, sheet_name: str) -> List[Dict[str, Any]]:
        """
        ✅ Parse dutos no formato atual (com Categoria, ID Opcional, etc.)
        """
        print(f"   🔍 Analisando estrutura Dutos NOVA...")
        print(f"   📝 Colunas: {list(df.columns)}")
        print(f"   📊 Dimensões: {df.shape[0]} linhas × {df.shape[1]} colunas")
        
        dutos = []
        current_duto = None
        
        # Verificar estrutura
        col_names = {str(col).lower(): col for col in df.columns}
        print(f"   🔑 Colunas identificadas: {list(col_names.keys())}")
        
        # Mapear colunas
        tipo_col = None
        valor_col = None
        desc_col = None
        categoria_col = None
        id_opcional_col = None
        nome_opcional_col = None
        
        for col_lower, col_original in col_names.items():
            if 'tipo' in col_lower or 'type' in col_lower:
                tipo_col = col_original
            elif 'valor' in col_lower or 'value' in col_lower:
                valor_col = col_original
            elif 'desc' in col_lower:
                desc_col = col_original
            elif 'categ' in col_lower:
                categoria_col = col_original
            elif 'id' in col_lower and 'opcional' in col_lower:
                id_opcional_col = col_original
            elif 'nome' in col_lower and 'opcional' in col_lower:
                nome_opcional_col = col_original
        
        print(f"   🗺️  Mapeamento:")
        print(f"     • Tipo: {tipo_col}")
        print(f"     • Valor: {valor_col}")
        print(f"     • Descrição: {desc_col}")
        print(f"     • Categoria: {categoria_col}")
        print(f"     • ID Opcional: {id_opcional_col}")
        print(f"     • Nome Opcional: {nome_opcional_col}")
        
        # Processar linha por linha
        for idx, row in df.iterrows():
            # Pular linhas completamente vazias
            if pd.isna(row.iloc[0]) and (len(row) < 2 or pd.isna(row.iloc[1])):
                continue
            
            # Obter valores das colunas mapeadas
            tipo = str(row[tipo_col]).strip() if tipo_col and pd.notna(row[tipo_col]) else ""
            valor = row[valor_col] if valor_col and pd.notna(row[valor_col]) else None
            descricao = str(row[desc_col]) if desc_col and pd.notna(row[desc_col]) else ""
            categoria = str(row[categoria_col]).strip() if categoria_col and pd.notna(row[categoria_col]) else ""
            id_opcional = row[id_opcional_col] if id_opcional_col and pd.notna(row[id_opcional_col]) else None
            nome_opcional = str(row[nome_opcional_col]) if nome_opcional_col and pd.notna(row[nome_opcional_col]) else ""
            
            # Debug da linha
            if idx < 5:  # Mostrar primeiras 5 linhas
                print(f"   📋 Linha {idx}: tipo='{tipo}', valor={valor}, categoria='{categoria}'")
            
            # Se for um NOVO tipo de duto (linha com categoria TIPO)
            if categoria == 'TIPO' and tipo:
                # Salvar duto anterior se existir
                if current_duto:
                    dutos.append(current_duto)
                    print(f"   💾 Salvando duto: {current_duto.get('type')}")
                
                # Criar novo duto
                current_duto = {
                    'type': tipo,
                    'valor': float(valor) if valor is not None else 0.0,
                    'descricao': descricao if descricao else tipo,
                    'opcionais': []
                }
                print(f"   🆕 Novo duto: {tipo}")
            
            # Se for um OPCIONAL (linha com categoria que contém OPCIONAL)
            elif 'OPCIONAL' in categoria and current_duto:
                # Criar opcional
                opcional = {
                    'id': int(id_opcional) if id_opcional is not None else len(current_duto['opcionais']) + 1,
                    'nome': nome_opcional if nome_opcional else f"Opcional {len(current_duto['opcionais']) + 1}",
                    'value': float(valor) if valor is not None else 0.0,
                    'descricao': descricao if descricao else nome_opcional
                }
                
                current_duto['opcionais'].append(opcional)
                print(f"   ➕ Opcional para {current_duto['type']}: {opcional['nome']} = {opcional['value']}")
            
            # Se não tem categoria definida mas tem tipo (formato alternativo)
            elif tipo and not categoria and current_duto is None:
                # Pode ser formato antigo onde cada linha é um tipo
                current_duto = {
                    'type': tipo,
                    'valor': float(valor) if valor is not None else 0.0,
                    'descricao': descricao if descricao else tipo,
                    'opcionais': []
                }
        
        # Adicionar último duto
        if current_duto:
            dutos.append(current_duto)
            print(f"   💾 Salvando último duto: {current_duto.get('type')}")
        
        print(f"   ✅ Total de dutos processados: {len(dutos)}")
        
        return dutos
    
    def _parse_tubos(self, df: pd.DataFrame, sheet_name: str) -> List[Dict[str, Any]]:
        """
        ✅ Parse tubos no formato esperado: polegadas, mm, valor
        """
        print(f"   🔍 Analisando estrutura Tubos...")
        print(f"   📝 Colunas: {list(df.columns)}")
        print(f"   📊 Dimensões: {df.shape[0]} linhas × {df.shape[1]} colunas")
        
        tubos = []
        
        # Verificar estrutura
        col_names = {str(col).lower(): col for col in df.columns}
        print(f"   🔑 Colunas identificadas: {list(col_names.keys())}")
        
        # Mapear colunas para os campos esperados
        polegadas_col = None
        mm_col = None
        valor_col = None
        
        for col_lower, col_original in col_names.items():
            if 'polegada' in col_lower or '"' in col_lower or 'in' in col_lower:
                polegadas_col = col_original
            elif 'mm' in col_lower or 'milimetro' in col_lower:
                mm_col = col_original
            elif 'valor' in col_lower or 'price' in col_lower or 'custo' in col_lower:
                valor_col = col_original
        
        # Se não encontrou colunas específicas, assumir primeira, segunda e terceira coluna
        if polegadas_col is None and len(df.columns) > 0:
            polegadas_col = df.columns[0]
        if mm_col is None and len(df.columns) > 1:
            mm_col = df.columns[1]
        if valor_col is None and len(df.columns) > 2:
            valor_col = df.columns[2]
        
        print(f"   🗺️  Mapeamento:")
        print(f"     • Polegadas: {polegadas_col}")
        print(f"     • mm: {mm_col}")
        print(f"     • Valor: {valor_col}")
        
        # Processar linha por linha
        for idx, row in df.iterrows():
            # Pular linhas vazias ou linhas de cabeçalho
            if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                continue
            
            # Verificar se é linha de cabeçalho
            first_cell = str(row.iloc[0]).lower() if pd.notna(row.iloc[0]) else ""
            if any(word in first_cell for word in ['polegada', 'in', 'mm', 'valor', 'custo', 'price']):
                print(f"   ⏭️  Pulando linha de cabeçalho: {first_cell}")
                continue
            
            # Obter valores
            polegadas = str(row[polegadas_col]).strip() if polegadas_col and pd.notna(row[polegadas_col]) else ""
            mm = row[mm_col] if mm_col and pd.notna(row[mm_col]) else 0
            valor = row[valor_col] if valor_col and pd.notna(row[valor_col]) else 0
            
            # Converter valores numéricos
            try:
                if mm is not None:
                    mm = float(mm)
            except (ValueError, TypeError):
                mm = 0
            
            try:
                if valor is not None:
                    valor = float(valor)
            except (ValueError, TypeError):
                valor = 0
            
            # Se tem polegadas definidas, adicionar o tubo
            if polegadas:
                tubo = {
                    'polegadas': polegadas,
                    'mm': mm,
                    'valor': valor
                }
                tubos.append(tubo)
                
                # Debug
                if idx < 5:  # Mostrar primeiras 5 linhas
                    print(f"   📋 Linha {idx}: {polegadas} -> mm={mm}, valor={valor}")
        
        # Ordenar tubos por polegadas
        if tubos:
            try:
                # Função auxiliar para converter polegadas para valor numérico para ordenação
                def parse_polegadas(polegadas_str):
                    try:
                        str_val = str(polegadas_str).strip()
                        # Remove aspas se existir
                        str_val = str_val.replace('"', '').replace("''", '').replace("'", '')
                        
                        # Se tem ponto e barra (ex: "1.3/8")
                        if '.' in str_val and '/' in str_val:
                            str_val = str_val.replace('.', ' ')
                        
                        # Se contém espaço e fração (ex: "1 1/4" ou "1 3/8")
                        if ' ' in str_val and '/' in str_val:
                            parts = str_val.split(' ')
                            if len(parts) == 2:
                                integer = float(parts[0]) if parts[0] else 0
                                fraction_parts = parts[1].split('/')
                                if len(fraction_parts) == 2:
                                    numerator = float(fraction_parts[0])
                                    denominator = float(fraction_parts[1])
                                    return integer + (numerator / denominator)
                        
                        # Se é apenas fração (ex: "1/2")
                        if '/' in str_val and ' ' not in str_val:
                            fraction_parts = str_val.split('/')
                            if len(fraction_parts) == 2:
                                numerator = float(fraction_parts[0])
                                denominator = float(fraction_parts[1])
                                return numerator / denominator
                        
                        # Se é número decimal
                        return float(str_val)
                    except:
                        return 0
                
                tubos.sort(key=lambda x: parse_polegadas(x.get('polegadas', '')))
                print(f"   📈 Tubos ordenados por polegadas")
                
            except Exception as sort_error:
                print(f"   ⚠️  Não foi possível ordenar tubos: {sort_error}")
        
        print(f"   ✅ Total de tubos processados: {len(tubos)}")
        
        return tubos
    
    def _validate_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida estrutura básica dos dados - ATUALIZADA COM TUBOS"""
        errors = []
        
        required_sections = [
            'constants', 
            'machines', 
            'materials', 
            'empresas', 
            'banco_equipamentos',
            'dutos',
            'tubos'  # ✅ Adicionado tubos
        ]
        
        for section in required_sections:
            if section not in data:
                errors.append(f"Seção '{section}' não encontrada")
        
        if 'dutos' in data and not isinstance(data['dutos'], list):
            errors.append("'dutos' deve ser um array")
        
        if 'tubos' in data and not isinstance(data['tubos'], list):
            errors.append("'tubos' deve ser um array")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def json_to_excel(self, system_data: Dict[str, Any], output_path: str) -> None:
        """
        Converte JSON do sistema para Excel - ATUALIZADO COM TUBOS
        """
        print(f"\n{'='*60}")
        print(f"📤 CONVERTENDO JSON PARA EXCEL")
        print(f"{'='*60}")
        
        try:
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                # Sheet Constants
                if system_data.get('constants'):
                    constants_data = []
                    for key, value in system_data['constants'].items():
                        constants_data.append({
                            'key': key,
                            'value': value.get('value', ''),
                            'description': value.get('description', '')
                        })
                    
                    if constants_data:
                        df_constants = pd.DataFrame(constants_data)
                        df_constants.to_excel(writer, sheet_name='Constants', index=False)
                        print(f"✅ Constants exportados: {len(constants_data)}")
                
                # Sheet Machines
                if system_data.get('machines'):
                    machines_data = []
                    for machine in system_data['machines']:
                        for capacity, value in machine.get('baseValues', {}).items():
                            machines_data.append({
                                'type': machine.get('type', ''),
                                'capacity': capacity,
                                'value': value
                            })
                    
                    if machines_data:
                        df_machines = pd.DataFrame(machines_data)
                        df_machines.to_excel(writer, sheet_name='Machines', index=False)
                        print(f"✅ Machines exportados: {len(machines_data)}")
                
                # Sheet Materials
                if system_data.get('materials'):
                    materials_data = []
                    for key, value in system_data['materials'].items():
                        materials_data.append({
                            'key': key,
                            'value': value.get('value', ''),
                            'unit': value.get('unit', ''),
                            'description': value.get('description', '')
                        })
                    
                    if materials_data:
                        df_materials = pd.DataFrame(materials_data)
                        df_materials.to_excel(writer, sheet_name='Materials', index=False)
                        print(f"✅ Materials exportados: {len(materials_data)}")
                
                # Sheet Empresas
                if system_data.get('empresas'):
                    empresas_data = []
                    for empresa in system_data['empresas']:
                        if isinstance(empresa, dict):
                            for sigla, nome in empresa.items():
                                empresas_data.append({
                                    'SIGLA': sigla,
                                    'EMPRESA': nome
                                })
                    
                    if empresas_data:
                        df_empresas = pd.DataFrame(empresas_data)
                        df_empresas = df_empresas.sort_values('SIGLA')
                        df_empresas.to_excel(writer, sheet_name='Empresas', index=False)
                        print(f"✅ Empresas exportadas: {len(empresas_data)}")
                
                # Sheet Equipamentos
                if system_data.get('banco_equipamentos'):
                    equipamentos_data = []
                    for tipo, dados in system_data['banco_equipamentos'].items():
                        descricao = dados.get('descricao', tipo)
                        valores = dados.get('valores_padrao', {})
                        
                        for dimensao, valor in valores.items():
                            equipamentos_data.append({
                                'tipo': tipo,
                                'descricao': descricao,
                                'dimensao': dimensao,
                                'valor': valor
                            })
                    
                    if equipamentos_data:
                        df_equipamentos = pd.DataFrame(equipamentos_data)
                        df_equipamentos.to_excel(writer, sheet_name='Equipamentos', index=False)
                        print(f"✅ Equipamentos exportados: {len(equipamentos_data)}")
                
                # Sheet Dutos (formato atualizado)
                if system_data.get('dutos'):
                    dutos_data = []
                    
                    for duto in system_data['dutos']:
                        # Linha do tipo de duto
                        dutos_data.append({
                            'Tipo': duto.get('type', ''),
                            'Valor': duto.get('valor', 0),
                            'Descrição': duto.get('descricao', ''),
                            'Categoria': 'TIPO',
                            'ID Opcional': '',
                            'Nome Opcional': ''
                        })
                        
                        # Linhas dos opcionais
                        for opcional in duto.get('opcionais', []):
                            dutos_data.append({
                                'Tipo': duto.get('type', ''),
                                'Valor': opcional.get('value', 0),
                                'Descrição': opcional.get('descricao', ''),
                                'Categoria': f"OPCIONAL: {opcional.get('nome', '')}",
                                'ID Opcional': opcional.get('id', ''),
                                'Nome Opcional': opcional.get('nome', '')
                            })
                        
                        # Linha em branco entre tipos
                        dutos_data.append({
                            'Tipo': '',
                            'Valor': '',
                            'Descrição': '',
                            'Categoria': '',
                            'ID Opcional': '',
                            'Nome Opcional': ''
                        })
                    
                    if dutos_data:
                        df_dutos = pd.DataFrame(dutos_data)
                        df_dutos.to_excel(writer, sheet_name='Dutos', index=False)
                        print(f"✅ Dutos exportados: {len(system_data['dutos'])} tipos")
                
                # ✅ Sheet Tubos
                if system_data.get('tubos'):
                    tubos_data = []
                    
                    # Adicionar cabeçalho
                    tubos_data.append({
                        'Polegadas': 'Polegadas',
                        'mm': 'Milímetros',
                        'Valor': 'Valor (R$)'
                    })
                    
                    # Adicionar dados dos tubos
                    for tubo in system_data['tubos']:
                        tubos_data.append({
                            'Polegadas': tubo.get('polegadas', ''),
                            'mm': tubo.get('mm', 0),
                            'Valor': tubo.get('valor', 0)
                        })
                    
                    if len(tubos_data) > 1:  # Tem pelo menos um tubo além do cabeçalho
                        df_tubos = pd.DataFrame(tubos_data)
                        df_tubos.to_excel(writer, sheet_name='Tubos', index=False)
                        print(f"✅ Tubos exportados: {len(system_data['tubos'])} tipos")
                
                print(f"\n✅ Excel gerado com sucesso: {output_path}")
                
        except Exception as e:
            print(f"\n❌ Erro ao gerar Excel: {str(e)}")
            traceback.print_exc()
            raise Exception(f"Erro ao gerar Excel: {str(e)}")

# Instância global do conversor
excel_converter = ExcelToJsonConverter()