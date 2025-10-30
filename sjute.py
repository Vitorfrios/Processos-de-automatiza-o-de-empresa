from pathlib import Path

ROOT = Path(".").resolve()
PAGE1 = ROOT / "codigo" / "public" / "scripts" / "page1"

# arquivos que vamos tocar diretamente
UI_PROJECT_MANAGER = PAGE1 / "ui" / "intr-files" / "project-manager.js"
CALCULOS_MANAGER = PAGE1 / "features" / "calculos" / "calculos-manager.js"
HELPERS_CALC = PAGE1 / "features" / "calculos" / "utils" / "helpers.js"
GLOBALS = PAGE1 / "globals.js"

# 1. remover imports proibidos (data -> ui)
PROHIBITED_IMPORT = 'from "../ui/interface.js"'
PROHIBITED_IMPORT2 = 'from "../../ui/interface.js"'
PROHIBITED_IMPORT3 = 'import { showSystemStatus, updateObraButtonAfterSave } from "../ui/interface.js";'

def strip_ui_imports_in_data():
    data_dir = PAGE1 / "data"
    for js in data_dir.rglob("*.js"):
        text = js.read_text(encoding="utf-8")
        original = text
        # genérico: qualquer linha que tenha ../ui/interface.js
        lines = []
        for line in text.splitlines():
            if "../ui/interface.js" in line or "../../ui/interface.js" in line:
                # vamos comentar pra você ver depois
                lines.append("// REMOVIDO NA REFACTOR: " + line)
            else:
                lines.append(line)
        new_text = "\n".join(lines)
        if new_text != original:
            js.write_text(new_text, encoding="utf-8")
            print(f"[data→ui] removi import UI em {js}")

def fix_ui_project_manager():
    if not UI_PROJECT_MANAGER.exists():
        print("[aviso] ui/intr-files/project-manager.js não encontrado")
        return
    text = UI_PROJECT_MANAGER.read_text(encoding="utf-8")
    original = text

    # troca o nome da função exportada
    text = text.replace("export function deleteProject(", "export function deleteProjectFromDOM(")
    text = text.replace("export { deleteProject", "export { deleteProjectFromDOM")

    if text != original:
        UI_PROJECT_MANAGER.write_text(text, encoding="utf-8")
        print("[ok] renomeado deleteProject -> deleteProjectFromDOM em project-manager.js")

    # agora vamos procurar quem importa esse arquivo e ajustar
    for js in PAGE1.rglob("*.js"):
        if js == UI_PROJECT_MANAGER:
            continue
        t = js.read_text(encoding="utf-8")
        o = t
        # casos comuns:
        t = t.replace(
            'import { deleteProject } from "./intr-files/project-manager.js";',
            'import { deleteProjectFromDOM } from "./intr-files/project-manager.js";'
        )
        t = t.replace(
            'import { deleteProject } from "../ui/intr-files/project-manager.js";',
            'import { deleteProjectFromDOM } from "../ui/intr-files/project-manager.js";'
        )
        if t != o:
            js.write_text(t, encoding="utf-8")
            print(f"[ok] ajustei import de deleteProject em {js}")

def fix_calculos_manager():
    if not CALCULOS_MANAGER.exists():
        print("[aviso] calculos-manager.js não encontrado")
        return
    text = CALCULOS_MANAGER.read_text(encoding="utf-8")
    original = text

    # 1) garantir que está importando do lugar certo
    if "airFlow/airFlowCalculations.js" not in text:
        text = text.replace(
            'from "./airFlowCalculations.js"',
            'from "./airFlow/airFlowCalculations.js"'
        )

    # 2) remover reexport da função duplicada
    # estratégia simples: se tiver uma linha exportando calculateVazaoArAndThermalGains, comenta
    lines = []
    for line in text.splitlines():
        if "calculateVazaoArAndThermalGains" in line and line.strip().startswith("export"):
            lines.append("// REMOVIDO DUPLICATA: " + line)
        else:
            lines.append(line)
    text = "\n".join(lines)

    if text != original:
        CALCULOS_MANAGER.write_text(text, encoding="utf-8")
        print("[ok] ajustei calculos-manager.js para não exportar duplicata")

def fix_calc_helpers():
    if not HELPERS_CALC.exists():
        print("[aviso] features/calculos/utils/helpers.js não encontrado")
        return
    text = HELPERS_CALC.read_text(encoding="utf-8")
    original = text

    # remover displays daqui
    bads = [
        "export function updateAirFlowDisplay",
        "export function updateThermalGainsDisplay",
    ]
    lines = []
    skip = False
    for line in text.splitlines():
        if any(b in line for b in bads):
            # começar a pular até fechar função
            skip = True
            lines.append("// REMOVIDO: função de display deve ficar no display correspondente")
            continue
        if skip:
            # detecta fim da função
            if line.strip().startswith("}"):
                skip = False
            continue
        lines.append(line)

    new_text = "\n".join(lines)
    if new_text != original:
        HELPERS_CALC.write_text(new_text, encoding="utf-8")
        print("[ok] removi displays duplicados de helpers.js")

def clean_globals():
    if not GLOBALS.exists():
        print("[aviso] globals.js não encontrado")
        return
    text = GLOBALS.read_text(encoding="utf-8")
    original = text

    # ideia: manter só const e comentar exports de função
    lines = []
    for line in text.splitlines():
        if "export {" in line or "export {" in line:
            lines.append("// REMOVIDO: não reexportar funções aqui")
        elif "export const" in line or "export let" in line:
            lines.append(line)
        else:
            lines.append(line)
    new_text = "\n".join(lines)

    if new_text != original:
        GLOBALS.write_text(new_text, encoding="utf-8")
        print("[ok] limpei exports de função em globals.js")

def main():
    print("[*] limpando imports proibidos (data -> ui)")
    strip_ui_imports_in_data()

    print("[*] renomeando deleteProject de UI")
    fix_ui_project_manager()

    print("[*] consertando calculos-manager.js")
    fix_calculos_manager()

    print("[*] limpando helpers de cálculos")
    fix_calc_helpers()

    print("[*] limpando globals.js")
    clean_globals()

    print("[OK] ajustes aplicados. Agora rode seu bundler ou abra no navegador pra testar.")

if __name__ == "__main__":
    main()
