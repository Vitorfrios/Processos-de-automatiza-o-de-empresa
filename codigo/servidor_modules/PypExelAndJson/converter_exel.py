import json
import pandas as pd
import base64
import tempfile
import os
from typing import Dict, Any

class ExcelConverter:
    """Conversor simplificado para Excel ↔ JSON - CORRIGIDO"""
    
    def excel_to_json(self, excel_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Converte arquivo Excel para JSON estruturado do sistema - CORRIGIDO COM CONTEXTO
        """
        try:
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
                f.write(excel_bytes)
                temp_path = f.name
            
            try:
                # ✅ CORREÇÃO CRÍTICA: Usar ExcelFile como contexto
                with pd.ExcelFile(temp_path) as xls:
                    result = {
                        "constants": {},
                        "machines": [],
                        "materials": {},
                        "empresas": [],
                        "banco_equipamentos": {},
                        "dutos": []  # Array direto
                    }
                    
                    print(f"📊 Processando Excel: {filename}")
                    
                    for sheet_name in xls.sheet_names:
                        try:
                            df = pd.read_excel(xls, sheet_name=sheet_name)
                            sheet_name_lower = sheet_name.lower()
                            
                            if 'constant' in sheet_name_lower or 'constante' in sheet_name_lower:
                                self._process_constants_sheet(df, result)
                            elif any(word in sheet_name_lower for word in ['machine', 'máquina', 'maquina']):
                                self._process_machines_sheet(df, result, sheet_name)
                            elif any(word in sheet_name_lower for word in ['material', 'materiais']):
                                self._process_materials_sheet(df, result)
                            elif any(word in sheet_name_lower for word in ['empresa', 'company']):
                                self._process_empresas_sheet(df, result)
                            elif any(word in sheet_name_lower for word in ['equipamento', 'equipment', 'banco_equipamentos']):
                                self._process_equipamentos_sheet(df, result)
                            elif any(word in sheet_name_lower for word in ['duto', 'duct', 'dutos']):
                                self._process_dutos_sheet(df, result)
                                
                        except Exception as sheet_error:
                            print(f"⚠️  Erro no sheet {sheet_name}: {sheet_error}")
                            continue
                    
                    validation = self._validate_structure(result)
                    if not validation["valid"]:
                        return {
                            "success": False,
                            "error": f"Estrutura inválida: {', '.join(validation['errors'])}"
                        }
                    
                    print(f"📊 Conversão completa:")
                    print(f"  ✅ Constants: {len(result['constants'])}")
                    print(f"  ✅ Machines: {len(result['machines'])}")
                    print(f"  ✅ Materials: {len(result['materials'])}")
                    print(f"  ✅ Empresas: {len(result['empresas'])}")
                    print(f"  ✅ Equipamentos: {len(result['banco_equipamentos'])}")
                    print(f"  ✅ Dutos: {len(result['dutos'])} tipos")
                    
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
                # Garantir remoção do arquivo temporário
                if os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                        print(f"🧹 Arquivo temporário removido: {temp_path}")
                    except Exception as e:
                        print(f"⚠️  Não foi possível remover temp file: {e}")
                        
        except Exception as e:
            print(f"❌ Erro ao converter Excel: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _process_constants_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de constantes"""
        try:
            for _, row in df.iterrows():
                if pd.isna(row.iloc[0]) or row.iloc[0] == '':
                    continue
                
                key = str(row.iloc[0]).strip()
                
                value = None
                for i in range(1, min(10, len(row))):
                    if pd.notna(row.iloc[i]) and row.iloc[i] != '':
                        value = row.iloc[i]
                        break
                
                if value is None:
                    continue
                
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
                first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
                
                if any(keyword in first_cell.lower() for keyword in ['type', 'tipo', 'máquina', 'machine']):
                    if current_machine:
                        result["machines"].append(current_machine)
                    
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
                
                elif current_machine is not None and len(row) >= 2:
                    capacity = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    value = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
                    
                    if capacity and value is not None:
                        try:
                            current_machine["baseValues"][capacity] = float(value)
                        except (ValueError, TypeError):
                            current_machine["baseValues"][capacity] = str(value)
            
            if current_machine:
                result["machines"].append(current_machine)
            
            print(f"✅ Máquinas processadas: {len(result['machines'])}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar machines: {e}")
    
    def _process_materials_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de materiais"""
        try:
            for _, row in df.iterrows():
                if pd.isna(row.iloc[0]) or row.iloc[0] == '':
                    continue
                
                key = str(row.iloc[0]).strip()
                
                value = None
                for i in range(1, min(10, len(row))):
                    if pd.notna(row.iloc[i]) and row.iloc[i] != '':
                        value = row.iloc[i]
                        break
                
                if value is None:
                    continue
                
                unit = "un"
                description = ""
                
                for i in range(2, min(15, len(row))):
                    cell_val = row.iloc[i] if i < len(row) else None
                    if pd.notna(cell_val) and cell_val != '':
                        cell_str = str(cell_val)
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
        """Processa sheet de empresas"""
        try:
            print(f"📑 Processando sheet de empresas: {df.shape[0]} linhas")
            
            if df.shape[1] < 2:
                print("⚠️  Sheet de empresas precisa ter pelo menos 2 colunas")
                return
            
            first_row_vals = [str(val).strip().lower() for val in df.iloc[0].values if pd.notna(val)]
            has_header_sigla = any(word in first_row_vals for word in ['sigla', 'código', 'code'])
            has_header_empresa = any(word in first_row_vals for word in ['empresa', 'nome', 'company'])
            
            start_row = 1 if (has_header_sigla or has_header_empresa) else 0
            
            empresas_count = 0
            for idx in range(start_row, len(df)):
                row = df.iloc[idx]
                
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                    continue
                
                sigla = str(row.iloc[0]).strip()
                
                empresa_nome = ""
                for i in range(1, min(5, len(row))):
                    if pd.notna(row.iloc[i]):
                        empresa_nome = str(row.iloc[i]).strip()
                        break
                
                if sigla and empresa_nome:
                    result["empresas"].append({sigla: empresa_nome})
                    empresas_count += 1
            
            print(f"✅ Empresas processadas: {empresas_count}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar empresas: {e}")
    
    def _process_equipamentos_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de equipamentos"""
        try:
            print(f"🔧 Processando sheet de equipamentos: {df.shape[0]} linhas")
            
            current_tipo = None
            current_equipamento = {}
            
            for idx, row in df.iterrows():
                first_cell = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
                
                if any(keyword in first_cell.lower() for keyword in ['tipo', 'type', 'equipamento', 'equipment']):
                    if current_tipo and current_equipamento:
                        result["banco_equipamentos"][current_tipo] = current_equipamento
                    
                    tipo = first_cell.replace('tipo:', '').replace('type:', '').strip()
                    if tipo:
                        current_tipo = tipo
                        current_equipamento = {
                            "descricao": tipo,
                            "valores_padrao": {}
                        }
                
                elif current_tipo and len(row) >= 2:
                    dimensao = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    valor = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
                    
                    if dimensao and valor is not None:
                        try:
                            current_equipamento["valores_padrao"][dimensao] = float(valor)
                        except (ValueError, TypeError):
                            current_equipamento["valores_padrao"][dimensao] = str(valor)
            
            if current_tipo and current_equipamento:
                result["banco_equipamentos"][current_tipo] = current_equipamento
            
            print(f"✅ Equipamentos processados: {len(result['banco_equipamentos'])} tipos")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar equipamentos: {e}")
    
    def _process_dutos_sheet(self, df: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Processa sheet de dutos - ATUALIZADO para novo formato"""
        try:
            print(f"🟦 Processando sheet de dutos: {df.shape[0]} linhas, {df.shape[1]} colunas")
            
            # Usar a nova função de parse
            from .excel_converter import excel_converter
            result["dutos"] = excel_converter._parse_dutos_novo(df, "Dutos")
            
            print(f"✅ Dutos processados: {len(result['dutos'])}")
            
        except Exception as e:
            print(f"⚠️  Erro ao processar dutos: {e}")
            import traceback
            traceback.print_exc()
            result["dutos"] = []  # Array vazio em caso de erro
            
    def _validate_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida estrutura básica dos dados"""
        errors = []
        
        required_sections = [
            'constants', 
            'machines', 
            'materials', 
            'empresas', 
            'banco_equipamentos',
            'dutos'  # Array
        ]
        
        for section in required_sections:
            if section not in data:
                errors.append(f"Seção '{section}' não encontrada")
        
        if 'dutos' in data and not isinstance(data['dutos'], list):
            errors.append("'dutos' deve ser um array")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def json_to_excel(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converte JSON do sistema para arquivo Excel
        """
        try:
            validation = self._validate_structure(system_data)
            if not validation["valid"]:
                return {
                    "success": False,
                    "error": f"Dados inválidos: {', '.join(validation['errors'])}"
                }
            
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
                temp_path = f.name
            
            try:
                # ✅ CORREÇÃO: Usar ExcelWriter como contexto
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
                        
                        if constants_list:
                            df_constants = pd.DataFrame(constants_list)
                            df_constants.to_excel(writer, sheet_name="Constants", index=False)
                    
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
                                    "value": value
                                })
                        
                        if machines_list:
                            df_machines = pd.DataFrame(machines_list)
                            df_machines.to_excel(writer, sheet_name="Machines", index=False)
                    
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
                        
                        if materials_list:
                            df_materials = pd.DataFrame(materials_list)
                            df_materials.to_excel(writer, sheet_name="Materials", index=False)
                    
                    # Sheet Empresas
                    if system_data.get("empresas"):
                        empresas_list = []
                        for empresa in system_data["empresas"]:
                            if isinstance(empresa, dict):
                                for sigla, nome in empresa.items():
                                    empresas_list.append({
                                        "SIGLA": sigla,
                                        "EMPRESA": nome
                                    })
                        
                        if empresas_list:
                            df_empresas = pd.DataFrame(empresas_list)
                            df_empresas = df_empresas.sort_values("SIGLA")
                            df_empresas.to_excel(writer, sheet_name="Empresas", index=False)
                    
                    # Sheet Equipamentos
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
                    
                    # ✅ Sheet Dutos (Array)
                    if system_data.get("dutos"):
                        dutos_list = []
                        
                        for duto in system_data["dutos"]:
                            # Linha do tipo de duto
                            dutos_list.append({
                                "Tipo": duto.get("type", ""),
                                "Valor": duto.get("valor", 0),
                                "Descrição": duto.get("descricao", ""),
                                "Categoria": "TIPO"
                            })
                            
                            # Linhas dos opcionais
                            for opcional in duto.get("opcionais", []):
                                dutos_list.append({
                                    "Tipo": duto.get("type", ""),
                                    "Valor": opcional.get("value", 0),
                                    "Descrição": opcional.get("descricao", ""),
                                    "Categoria": f"OPCIONAL: {opcional.get('nome', '')}",
                                    "ID Opcional": opcional.get("id", ""),
                                    "Nome Opcional": opcional.get("nome", "")
                                })
                            
                            # Linha em branco entre tipos
                            dutos_list.append({
                                "Tipo": "",
                                "Valor": "",
                                "Descrição": "",
                                "Categoria": ""
                            })
                        
                        if dutos_list:
                            df_dutos = pd.DataFrame(dutos_list)
                            df_dutos.to_excel(writer, sheet_name="Dutos", index=False)
                
                # Ler bytes do arquivo gerado
                with open(temp_path, 'rb') as f:
                    excel_bytes = f.read()
                
                return {
                    "success": True,
                    "data": base64.b64encode(excel_bytes).decode('utf-8'),
                    "filename": "sistema_completo_export.xlsx",
                    "message": "Excel gerado com sucesso"
                }
                
            finally:
                if os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                        print(f"🧹 Arquivo temporário removido: {temp_path}")
                    except Exception as e:
                        print(f"⚠️  Não foi possível remover temp file: {e}")
                        
        except Exception as e:
            print(f"❌ Erro ao converter JSON para Excel: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Instância global do conversor
converter = ExcelConverter()