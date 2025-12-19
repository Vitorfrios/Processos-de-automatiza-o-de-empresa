"""
Conversor simplificado Excel ↔ JSON para o sistema de dados
"""
import json
import pandas as pd
import base64
import tempfile
import os
from typing import Dict, Any, List, Optional

class SimpleExcelConverter:
    """Conversor simplificado para Excel ↔ JSON"""
    
    def excel_to_json(self, excel_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Converte arquivo Excel para JSON estruturado do sistema
        
        Args:
            excel_bytes: Bytes do arquivo Excel
            filename: Nome do arquivo
            
        Returns:
            Dicionário com resultado da conversão
        """
        try:
            # Salvar bytes em arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
                f.write(excel_bytes)
                temp_path = f.name
            
            try:
                # Ler Excel
                xls = pd.ExcelFile(temp_path)
                
                # ✅ ATUALIZADO: Estrutura básica do sistema com banco_equipamentos
                result = {
                    "constants": {},
                    "machines": [],
                    "materials": {},
                    "empresas": [],
                    "banco_equipamentos": {}  # ADICIONADO
                }
                
                print(f"📊 Processando Excel: {filename}")
                print(f"📄 Sheets encontrados: {xls.sheet_names}")
                
                # Processar cada sheet
                for sheet_name in xls.sheet_names:
                    try:
                        df = pd.read_excel(xls, sheet_name=sheet_name)
                        sheet_name_lower = sheet_name.lower()
                        
                        print(f"📑 Processando sheet: {sheet_name} ({len(df)} linhas)")
                        
                        # Sheet de constants
                        if 'constant' in sheet_name_lower or 'constante' in sheet_name_lower:
                            self._process_constants_sheet(df, result)
                        
                        # Sheet de machines/máquinas
                        elif any(word in sheet_name_lower for word in ['machine', 'máquina', 'maquina']):
                            self._process_machines_sheet(df, result, sheet_name)
                        
                        # Sheet de materials/materiais
                        elif any(word in sheet_name_lower for word in ['material', 'materiais']):
                            self._process_materials_sheet(df, result)
                        
                        # Sheet de empresas/companies
                        elif any(word in sheet_name_lower for word in ['empresa', 'company']):
                            self._process_empresas_sheet(df, result)
                        
                        # ✅ NOVO: Sheet de equipamentos
                        elif any(word in sheet_name_lower for word in ['equipamento', 'equipment', 'banco_equipamentos']):
                            self._process_equipamentos_sheet(df, result)
                            
                    except Exception as sheet_error:
                        print(f"⚠️  Erro no sheet {sheet_name}: {sheet_error}")
                        continue
                
                # ✅ ATUALIZADO: Validar estrutura com banco_equipamentos
                validation = self._validate_structure(result)
                if not validation["valid"]:
                    return {
                        "success": False,
                        "error": f"Estrutura inválida: {', '.join(validation['errors'])}",
                        "message": f"Erro na conversão de {filename}"
                    }
                
                return {
                    "success": True,
                    "data": result,
                    "message": f"Arquivo {filename} convertido com sucesso",
                    "metadata": {
                        "filename": filename,
                        "sheets_processed": xls.sheet_names,
                        "structure_valid": True
                    }
                }
                
            finally:
                # Limpar arquivo temporário
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    
        except Exception as e:
            print(f"❌ Erro crítico ao converter Excel: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Erro na conversão de {filename}"
            }
    
    def _process_constants_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de constantes"""
        try:
            # Tentar encontrar colunas padrão
            for _, row in df.iterrows():
                # Pular linhas vazias
                if pd.isna(row.iloc[0]) or row.iloc[0] == '':
                    continue
                
                key = str(row.iloc[0]).strip()
                
                # Procurar valor
                value = None
                for i in range(1, min(10, len(row))):
                    if pd.notna(row.iloc[i]) and row.iloc[i] != '':
                        value = row.iloc[i]
                        break
                
                if value is None:
                    continue
                
                # Procurar descrição
                description = ""
                for i in range(2, min(15, len(row))):
                    if pd.notna(row.iloc[i]) and row.iloc[i] != '' and i > 1:
                        description = str(row.iloc[i])
                        break
                
                result["constants"][key] = {
                    "value": float(value) if isinstance(value, (int, float)) else str(value),
                    "description": str(description)
                }
                
            print(f"✅ Constants processados: {len(result['constants'])}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar constants: {e}")
    
    def _process_machines_sheet(self, df: pd.DataFrame, result: Dict[str, Any], sheet_name: str) -> None:
        """Processa sheet de máquinas"""
        try:
            current_machine = None
            
            for _, row in df.iterrows():
                # Verificar se é linha de tipo de máquina
                first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
                
                # Linha de cabeçalho ou tipo
                if any(keyword in first_cell.lower() for keyword in ['type', 'tipo', 'máquina', 'machine']):
                    # Se já temos uma máquina em processamento, salva
                    if current_machine:
                        result["machines"].append(current_machine)
                    
                    # Nova máquina
                    machine_type = first_cell.replace('type:', '').replace('tipo:', '').strip()
                    if machine_type:
                        current_machine = {
                            "type": machine_type,
                            "impostos": {
                                "PIS_COFINS": "INCL",
                                "IPI": "ISENTO",
                                "ICMS": "12%",
                                "PRAZO": "45 a 60 dias",
                                "FRETE": "FOB/Cabreúva/SP"
                            },
                            "configuracoes_instalacao": [],
                            "baseValues": {},
                            "options": [],
                            "voltages": []
                        }
                        print(f"🆕 Nova máquina: {machine_type}")
                
                # Linha de valores de capacidade
                elif current_machine is not None and len(row) >= 2:
                    capacity = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    value = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
                    
                    if capacity and value is not None:
                        try:
                            current_machine["baseValues"][capacity] = float(value)
                        except (ValueError, TypeError):
                            current_machine["baseValues"][capacity] = str(value)
            
            # Adicionar última máquina
            if current_machine:
                result["machines"].append(current_machine)
            
            print(f"✅ Máquinas processadas: {len(result['machines'])}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar machines: {e}")
    
    def _process_materials_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de materiais"""
        try:
            for _, row in df.iterrows():
                # Pular linhas vazias
                if pd.isna(row.iloc[0]) or row.iloc[0] == '':
                    continue
                
                key = str(row.iloc[0]).strip()
                
                # Buscar valor
                value = None
                for i in range(1, min(10, len(row))):
                    if pd.notna(row.iloc[i]) and row.iloc[i] != '':
                        value = row.iloc[i]
                        break
                
                if value is None:
                    continue
                
                # Buscar unidade e descrição
                unit = "un"
                description = ""
                
                for i in range(2, min(15, len(row))):
                    cell_val = row.iloc[i] if i < len(row) else None
                    if pd.notna(cell_val) and cell_val != '':
                        cell_str = str(cell_val)
                        # Se parece com unidade (poucas letras)
                        if len(cell_str) <= 10 and cell_str.isalpha():
                            unit = cell_str
                        else:
                            description = cell_str
                
                result["materials"][key] = {
                    "value": float(value) if isinstance(value, (int, float)) else str(value),
                    "unit": unit,
                    "description": description
                }
            
            print(f"✅ Materiais processados: {len(result['materials'])}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar materials: {e}")
    
    def _process_empresas_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de empresas no formato SIGLA | EMPRESA"""
        try:
            print(f"📑 Processando sheet de empresas: {df.shape[0]} linhas, {df.shape[1]} colunas")
            
            # Verifica se o DataFrame tem pelo menos 2 colunas (SIGLA e EMPRESA)
            if df.shape[1] < 2:
                print("⚠️  Sheet de empresas precisa ter pelo menos 2 colunas (SIGLA e EMPRESA)")
                return
            
            # Verifica se tem cabeçalhos apropriados
            has_header_sigla = False
            has_header_empresa = False
            
            # Verifica se primeira linha parece ser cabeçalho
            first_row_vals = [str(val).strip().lower() for val in df.iloc[0].values if pd.notna(val)]
            if 'sigla' in first_row_vals or 'código' in first_row_vals or 'code' in first_row_vals:
                has_header_sigla = True
            if 'empresa' in first_row_vals or 'nome' in first_row_vals or 'company' in first_row_vals:
                has_header_empresa = True
            
            start_row = 1 if (has_header_sigla or has_header_empresa) else 0
            
            print(f"🔍 Cabeçalhos detectados: SIGLA={has_header_sigla}, EMPRESA={has_header_empresa}")
            print(f"📊 Iniciando leitura na linha: {start_row}")
            
            # Processa as linhas
            empresas_count = 0
            for idx in range(start_row, len(df)):
                row = df.iloc[idx]
                
                # Pula linhas completamente vazias
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                    continue
                
                sigla = str(row.iloc[0]).strip()
                
                # Busca o nome da empresa na segunda coluna
                empresa_nome = ""
                if df.shape[1] > 1 and pd.notna(row.iloc[1]):
                    empresa_nome = str(row.iloc[1]).strip()
                
                # Se não encontrou, procura nas colunas seguintes
                if not empresa_nome:
                    for i in range(2, min(10, len(row))):
                        if pd.notna(row.iloc[i]):
                            empresa_nome = str(row.iloc[i]).strip()
                            break
                
                # Adiciona apenas se tiver ambos sigla e nome
                if sigla and empresa_nome:
                    result["empresas"].append({sigla: empresa_nome})
                    empresas_count += 1
                    print(f"  ✅ Empresa {empresas_count}: {sigla} = {empresa_nome}")
                elif sigla:
                    print(f"  ⚠️  Sigla sem nome: {sigla}")
            
            print(f"✅ Empresas processadas: {empresas_count}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar empresas: {e}")
            import traceback
            traceback.print_exc()
    
    def _process_equipamentos_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """✅ NOVO: Processa sheet de equipamentos"""
        try:
            print(f"🔧 Processando sheet de equipamentos: {df.shape[0]} linhas, {df.shape[1]} colunas")
            
            current_tipo = None
            current_equipamento = {}
            
            for idx, row in df.iterrows():
                # Verificar se é uma linha de cabeçalho ou tipo
                first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
                
                # Linha de tipo de equipamento
                if any(keyword in first_cell.lower() for keyword in ['tipo', 'type', 'equipamento', 'equipment']):
                    # Salvar equipamento anterior se existir
                    if current_tipo and current_equipamento:
                        result["banco_equipamentos"][current_tipo] = current_equipamento
                    
                    # Novo tipo
                    tipo = first_cell.replace('tipo:', '').replace('type:', '').strip()
                    if tipo:
                        current_tipo = tipo
                        current_equipamento = {
                            "descricao": tipo,
                            "valores_padrao": {}
                        }
                        print(f"🆕 Novo equipamento: {tipo}")
                
                # Linha de dimensão/valor
                elif current_tipo and len(row) >= 2:
                    dimensao = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    valor = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
                    
                    if dimensao and valor is not None:
                        try:
                            current_equipamento["valores_padrao"][dimensao] = float(valor)
                            print(f"  📐 {dimensao}: {valor}")
                        except (ValueError, TypeError):
                            current_equipamento["valores_padrao"][dimensao] = str(valor)
            
            # Salvar último equipamento
            if current_tipo and current_equipamento:
                result["banco_equipamentos"][current_tipo] = current_equipamento
            
            print(f"✅ Equipamentos processados: {len(result['banco_equipamentos'])} tipos")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar equipamentos: {e}")
            import traceback
            traceback.print_exc()
    
    def _validate_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida estrutura básica dos dados"""
        errors = []
        
        # ✅ ATUALIZADO: Verificar seções obrigatórias com banco_equipamentos
        required_sections = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos']
        for section in required_sections:
            if section not in data:
                errors.append(f"Seção '{section}' não encontrada")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def json_to_excel(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converte JSON do sistema para arquivo Excel
        
        Args:
            system_data: Dados do sistema no formato JSON
            
        Returns:
            Dicionário com resultado da conversão
        """
        try:
            # ✅ ATUALIZADO: Validar dados com banco_equipamentos
            validation = self._validate_structure(system_data)
            if not validation["valid"]:
                return {
                    "success": False,
                    "error": f"Dados inválidos: {', '.join(validation['errors'])}"
                }
            
            # Criar arquivo Excel temporário
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
                temp_path = f.name
            
            try:
                with pd.ExcelWriter(temp_path, engine='openpyxl') as writer:
                    # Sheet Constants
                    if system_data.get("constants"):
                        constants_list = []
                        for key, value in system_data["constants"].items():
                            if isinstance(value, dict):
                                constants_list.append({
                                    "key": key,
                                    "value": value.get("value", ""),
                                    "description": value.get("description", "")
                                })
                            else:
                                constants_list.append({
                                    "key": key,
                                    "value": value,
                                    "description": ""
                                })
                        
                        if constants_list:
                            df_constants = pd.DataFrame(constants_list)
                            df_constants.to_excel(writer, sheet_name="Constants", index=False)
                            print(f"✅ Constants exportados: {len(constants_list)}")
                    
                    # Sheet Machines
                    if system_data.get("machines"):
                        machines_list = []
                        for machine in system_data["machines"]:
                            machine_type = machine.get("type", "")
                            base_values = machine.get("baseValues", {})
                            
                            for capacity, value in base_values.items():
                                machines_list.append({
                                    "type": machine_type,
                                    "capacity": capacity,
                                    "value": value,
                                    "PIS_COFINS": machine.get("impostos", {}).get("PIS_COFINS", ""),
                                    "IPI": machine.get("impostos", {}).get("IPI", ""),
                                    "ICMS": machine.get("impostos", {}).get("ICMS", ""),
                                    "PRAZO": machine.get("impostos", {}).get("PRAZO", ""),
                                    "FRETE": machine.get("impostos", {}).get("FRETE", "")
                                })
                        
                        if machines_list:
                            df_machines = pd.DataFrame(machines_list)
                            df_machines.to_excel(writer, sheet_name="Machines", index=False)
                            print(f"✅ Machines exportados: {len(machines_list)}")
                    
                    # Sheet Materials
                    if system_data.get("materials"):
                        materials_list = []
                        for key, value in system_data["materials"].items():
                            if isinstance(value, dict):
                                materials_list.append({
                                    "key": key,
                                    "value": value.get("value", ""),
                                    "unit": value.get("unit", ""),
                                    "description": value.get("description", "")
                                })
                            else:
                                materials_list.append({
                                    "key": key,
                                    "value": value,
                                    "unit": "",
                                    "description": ""
                                })
                        
                        if materials_list:
                            df_materials = pd.DataFrame(materials_list)
                            df_materials.to_excel(writer, sheet_name="Materials", index=False)
                            print(f"✅ Materials exportados: {len(materials_list)}")
                    
                    # Sheet Empresas (NO FORMATO CORRETO: 2 colunas)
                    if system_data.get("empresas"):
                        empresas_list = []
                        for empresa in system_data["empresas"]:
                            if isinstance(empresa, dict):
                                # Cada empresa é um dicionário com uma chave (sigla) e valor (nome)
                                for sigla, nome in empresa.items():
                                    empresas_list.append({
                                        "SIGLA": sigla,
                                        "EMPRESA": nome
                                    })
                        
                        if empresas_list:
                            # Ordena por sigla para facilitar visualização
                            df_empresas = pd.DataFrame(empresas_list)
                            df_empresas = df_empresas.sort_values("SIGLA")
                            df_empresas.to_excel(writer, sheet_name="Empresas", index=False)
                            print(f"✅ Empresas exportadas (formato 2 colunas): {len(empresas_list)}")
                    
                    # ✅ NOVO: Sheet Equipamentos
                    if system_data.get("banco_equipamentos"):
                        equipamentos_list = []
                        for tipo, dados in system_data["banco_equipamentos"].items():
                            descricao = dados.get("descricao", tipo)
                            valores = dados.get("valores_padrao", {})
                            
                            for dimensao, valor in valores.items():
                                equipamentos_list.append({
                                    "tipo": tipo,
                                    "descricao": descricao,
                                    "dimensao": dimensao,
                                    "valor": valor
                                })
                        
                        if equipamentos_list:
                            df_equipamentos = pd.DataFrame(equipamentos_list)
                            df_equipamentos.to_excel(writer, sheet_name="Equipamentos", index=False)
                            print(f"✅ Equipamentos exportados: {len(equipamentos_list)} registros")
                
                # Ler bytes do arquivo gerado
                with open(temp_path, 'rb') as f:
                    excel_bytes = f.read()
                
                return {
                    "success": True,
                    "data": base64.b64encode(excel_bytes).decode('utf-8'),
                    "filename": "sistema_export.xlsx",
                    "message": "Excel gerado com sucesso",
                    "metadata": {
                        "empresas_format": "SIGLA | EMPRESA (2 colunas)",
                        "equipamentos_incluidos": True
                    }
                }
                
            finally:
                # Limpar arquivo temporário
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    
        except Exception as e:
            print(f"❌ Erro ao converter JSON para Excel: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "message": "Erro na conversão para Excel"
            }

# Instância global do conversor
converter = SimpleExcelConverter()