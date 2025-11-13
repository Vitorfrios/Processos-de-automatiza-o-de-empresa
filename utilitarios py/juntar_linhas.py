#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# =========================
# Configurações
# =========================
PASTA_CODIGO_DEFAULT = Path("codigo")
EXTENSOES_PERMITIDAS = {".js",".css",".py"}
SKIP_DIRS = {"node_modules", "dist", "build", "__pycache__", ".git", ".next", ".vercel", ".cache"}

# =========================
# Utilitários
# =========================
def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)

def listar_arquivos_recursivo(pasta: Path):
    if not pasta.exists() or not pasta.is_dir():
        return []
    encontrados = []
    for p in pasta.rglob("*"):
        if p.is_file() and p.suffix.lower() in EXTENSOES_PERMITIDAS:
            rel = p.relative_to(pasta)
            if not should_skip(rel):
                encontrados.append(p)
    # Ordena por nome e, em empate, pelo caminho relativo (estável p/ UI)
    return sorted(encontrados, key=lambda p: (p.name.lower(), str(p.relative_to(pasta)).lower()))

def ler_linhas(p: Path):
    try:
        with p.open("r", encoding="utf-8", errors="ignore") as f:
            return f.readlines()
    except Exception as e:
        return [f"/* ERRO ao ler {p.name}: {e} */\n"]

def normalize_eol(s: str) -> str:
    return s if s.endswith("\n") else (s + "\n")

# =========================
# App
# =========================
class FileJoinerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Juntar Conteúdo de Arquivos (.js/.py)")
        self.geometry("900x650")
        self.minsize(820, 500)

        # Estado
        self.base_dir = tk.StringVar(value=PASTA_CODIGO_DEFAULT.as_posix())
        self.search_text = tk.StringVar(value="")
        self.show_paths = tk.BooleanVar(value=False)
        self.insert_separators = tk.BooleanVar(value=False)
        self.mode_radio = tk.BooleanVar(value=False)  # False = checkbox (multi), True = radio (single)
        self.files_all = []   # lista completa (Path)
        self.files_view = []  # lista filtrada/exibida (Path)

        # Seleção
        self.radio_selected_index = tk.IntVar(value=-1)  # índice em files_view
        self.checkbox_vars = []  # lista de IntVar por item visível

        self._build_ui()
        self._load_files()

    # ---------- UI ----------
    def _build_ui(self):
        # Top bar
        top = ttk.Frame(self, padding=(10, 10))
        top.pack(fill="x")

        ttk.Label(top, text="Pasta base:").grid(row=0, column=0, sticky="w")
        self.entry_dir = ttk.Entry(top, textvariable=self.base_dir)
        self.entry_dir.grid(row=0, column=1, sticky="we", padx=(6, 6))
        btn_browse = ttk.Button(top, text="Selecionar…", command=self._pick_base)
        btn_browse.grid(row=0, column=2, sticky="w")
        btn_reload = ttk.Button(top, text="Recarregar", command=self._load_files)
        btn_reload.grid(row=0, column=3, sticky="w", padx=(6, 0))

        top.columnconfigure(1, weight=1)

        # Controls bar
        ctr = ttk.Frame(self, padding=(10, 0))
        ctr.pack(fill="x", pady=(6, 0))

        ttk.Label(ctr, text="Filtro:").grid(row=0, column=0, sticky="w")
        ent_filter = ttk.Entry(ctr, textvariable=self.search_text)
        ent_filter.grid(row=0, column=1, sticky="we", padx=(6, 6))
        ent_filter.bind("<KeyRelease>", lambda e: self._apply_filter())

        chk_paths = ttk.Checkbutton(ctr, text="Exibir caminhos", variable=self.show_paths, command=self._redraw_list)
        chk_paths.grid(row=0, column=2, sticky="w", padx=(0, 10))

        self.mode_btn = ttk.Button(ctr, text="Modo: Checkbox (vários)", command=self._toggle_mode)
        self.mode_btn.grid(row=0, column=3, sticky="w")

        btn_select_all = ttk.Button(ctr, text="Selecionar todos", command=self._select_all)
        btn_select_all.grid(row=0, column=4, sticky="w", padx=(10, 0))
        btn_clear = ttk.Button(ctr, text="Limpar seleção", command=self._clear_selection)
        btn_clear.grid(row=0, column=5, sticky="w", padx=(6, 0))

        ctr.columnconfigure(1, weight=1)

        # List header
        head = ttk.Frame(self, padding=(10, 6))
        head.pack(fill="x")
        self.label_count = ttk.Label(head, text="0 arquivos • 0 selecionado(s)")
        self.label_count.pack(side="left")

        # Scrollable list
        body = ttk.Frame(self, padding=(10, 0))
        body.pack(fill="both", expand=True)

        self.canvas = tk.Canvas(body, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(body, orient="vertical", command=self.canvas.yview)
        self.list_frame = ttk.Frame(self.canvas)

        self.list_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        self.canvas_window = self.canvas.create_window((0, 0), window=self.list_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

        # Bottom bar
        bottom = ttk.Frame(self, padding=(10, 10))
        bottom.pack(fill="x")

        sep_chk = ttk.Checkbutton(bottom, text="Inserir separador com o nome do arquivo", variable=self.insert_separators)
        sep_chk.pack(side="left")

        btn_export = ttk.Button(bottom, text="Gerar TXT (concatenar conteúdo)", command=self._export)
        btn_export.pack(side="right")

        # Better mousewheel on Windows/Mac/Linux
        self._bind_mousewheel(self.canvas)

        self._apply_style()

    def _apply_style(self):
        # Estilinho leve
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except:
            pass
        style.configure("Header.TLabel", font=("Segoe UI", 10, "bold"))
        style.configure("Item.TFrame", padding=(6, 4))
        style.configure("ItemLabel.TLabel", font=("Consolas", 10))
        style.configure("Count.TLabel", font=("Segoe UI", 9))

    def _bind_mousewheel(self, widget):
        # Cross-platform scrolling
        def _on_mousewheel(event):
            if event.num == 5 or event.delta < 0:
                widget.yview_scroll(2, "units")
            elif event.num == 4 or event.delta > 0:
                widget.yview_scroll(-2, "units")
            return "break"

        widget.bind_all("<MouseWheel>", _on_mousewheel)      # Windows / most
        widget.bind_all("<Button-4>", _on_mousewheel)        # Linux
        widget.bind_all("<Button-5>", _on_mousewheel)        # Linux

    # ---------- Data ops ----------
    def _pick_base(self):
        d = filedialog.askdirectory(initialdir=self.base_dir.get() or ".", title="Escolher pasta base")
        if d:
            self.base_dir.set(d.replace("\\", "/"))
            self._load_files()

    def _load_files(self):
        base = Path(self.base_dir.get())
        self.files_all = listar_arquivos_recursivo(base)
        self.search_text.set("")
        self._apply_filter()

    def _apply_filter(self):
        txt = self.search_text.get().strip().lower()
        if not txt:
            self.files_view = self.files_all[:]
        else:
            self.files_view = [p for p in self.files_all if txt in p.name.lower() or txt in str(p.relative_to(Path(self.base_dir.get()))).lower()]
        self.radio_selected_index.set(-1)
        self._redraw_list()

    def _toggle_mode(self):
        # Alterna entre checkbox (multi) e rádio (single)
        self.mode_radio.set(not self.mode_radio.get())
        if self.mode_radio.get():
            self.mode_btn.configure(text="Modo: Rádio (um)")
        else:
            self.mode_btn.configure(text="Modo: Checkbox (vários)")
        self.radio_selected_index.set(-1)
        self._redraw_list()

    def _select_all(self):
        if self.mode_radio.get():
            messagebox.showinfo("Modo Rádio", "No modo rádio, só é possível selecionar um item.")
            return
        for var in self.checkbox_vars:
            var.set(1)
        self._update_count_label()

    def _clear_selection(self):
        if self.mode_radio.get():
            self.radio_selected_index.set(-1)
        else:
            for var in self.checkbox_vars:
                var.set(0)
        self._update_count_label()

    def _redraw_list(self):
        # Limpa itens
        for w in self.list_frame.winfo_children():
            w.destroy()
        self.checkbox_vars = []

        base = Path(self.base_dir.get())
        show_paths = self.show_paths.get()

        # Constrói itens
        for i, p in enumerate(self.files_view):
            row = ttk.Frame(self.list_frame, style="Item.TFrame")
            row.grid(row=i, column=0, sticky="we")
            row.columnconfigure(1, weight=1)

            # índice
            ttk.Label(row, text=f"{i+1:>4}", style="Count.TLabel", width=5, anchor="e").grid(row=0, column=0, sticky="w")

            display_text = str(p.relative_to(base)) if show_paths else p.name

            if self.mode_radio.get():
                rb = ttk.Radiobutton(
                    row,
                    text=display_text,
                    variable=self.radio_selected_index,
                    value=i
                )
                rb.grid(row=0, column=1, sticky="we", padx=(8, 0))
            else:
                v = tk.IntVar(value=0)
                self.checkbox_vars.append(v)
                cb = ttk.Checkbutton(row, text=display_text, variable=v)
                cb.grid(row=0, column=1, sticky="we", padx=(8, 0))

        self._update_count_label()
        # Ajusta largura do canvas window
        self.after(50, lambda: self.canvas.itemconfigure(self.canvas_window, width=self.canvas.winfo_width()))

    def _get_selected_files(self):
        if self.mode_radio.get():
            idx = self.radio_selected_index.get()
            if 0 <= idx < len(self.files_view):
                return [self.files_view[idx]]
            return []
        else:
            out = []
            for i, var in enumerate(self.checkbox_vars):
                if var.get() == 1:
                    out.append(self.files_view[i])
            return out

    def _update_count_label(self):
        n_total = len(self.files_view)
        n_sel = len(self._get_selected_files())
        self.label_count.configure(text=f"{n_total} arquivos • {n_sel} selecionado(s)")

    # ---------- Export ----------
    def _export(self):
        selecionados = self._get_selected_files()
        if not selecionados:
            messagebox.showwarning("Nada selecionado", "Selecione pelo menos um arquivo.")
            return

        fp = filedialog.asksaveasfilename(
            title="Salvar TXT concatenado",
            defaultextension=".txt",
            filetypes=[("Arquivo de texto", "*.txt"), ("Todos", "*.*")]
        )
        if not fp:
            return

        usar_sep = self.insert_separators.get()
        total_linhas = 0
        try:
            with open(fp, "w", encoding="utf-8", errors="ignore") as out:
                for p in selecionados:
                    if usar_sep:
                        rel_path = p.relative_to(Path(self.base_dir.get()))
                        out.write(f"\n/* ==== INÍCIO: {rel_path.as_posix()} ==== */\n")
                    for L in ler_linhas(p):
                        out.write(normalize_eol(L))
                        total_linhas += 1
                    if usar_sep:
                        rel_path = p.relative_to(Path(self.base_dir.get()))
                        out.write(f"/* ==== FIM: {rel_path.as_posix()} ==== */\n")

            messagebox.showinfo("Concluído", f"Gerado com sucesso!\n{total_linhas} linhas escritas em:\n{fp}")
        except Exception as e:
            messagebox.showerror("Erro ao salvar", str(e))


if __name__ == "__main__":
    app = FileJoinerApp()
    app.mainloop()
