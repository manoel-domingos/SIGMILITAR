"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import type { FieldOption } from "@/lib/types";
import { validateColumnMappings } from "@/lib/validators";
import { FileUp, Table as TableIcon, AlertTriangle, X, ChevronRight, CheckCircle2, Wand2, RefreshCw, Cpu, CheckSquare, Menu, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Campos disponíveis para mapeamento
const FIELD_OPTIONS: FieldOption[] = [
  { value: "nome", label: "Nome*" },
  { value: "turma", label: "Turma*" },
  { value: "matricula", label: "Matrícula" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "data_nascimento", label: "Data de Nascimento" },
  { value: "endereco", label: "Endereço" },
  { value: "responsavel", label: "Responsável" },
];

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string>[]) => void;
}

export default function ImportWizard({ isOpen, onClose, onImport }: ImportWizardProps) {
  // Estado dos passos
  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  const [columnMapping, setColumnMapping] = useState<Record<number, FieldOption>>({});
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("upload");
        setFile(null);
        setWorkbook(null);
        setSheets([]);
        setActiveSheet("");
        setRawData([]);
        setHeaderRowIndex(0);
        setColumnMapping({});
        setError(null);
        setDragOver(false);
      }, 0);
    }
  }, [isOpen]);

  // Processa arquivo CSV ou Excel
  const processFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        const text = new TextDecoder().decode(data);
        const rows = text
          .split("\n")
          .filter(line => line.trim() !== "")
          .map(line => line.split(",").map(cell => cell.trim()));
        setRawData(rows);
        setSheets([]);
        setActiveSheet("");
        setWorkbook(null);
        setHeaderRowIndex(0);
        setStep("mapping");
      } else {
        const wb = XLSX.read(data, { type: "array" });
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        setSheets(sheetNames);
        const firstSheet = sheetNames[0];
        setActiveSheet(firstSheet);
        const ws = wb.Sheets[firstSheet];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setRawData(rows);
        setHeaderRowIndex(0);
        setStep("mapping");
      }
    } catch (e) {
      setError("Erro ao processar o arquivo. Verifique se é um CSV ou Excel válido.");
    }
  }, []);

  // Handlers do upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // Trocar de aba (sheet)
  const changeSheet = (sheetName: string) => {
    if (!workbook) return;
    setActiveSheet(sheetName);
    const ws = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    setRawData(rows);
    setHeaderRowIndex(0);
    setColumnMapping({});
  };

  // Cabeçalhos (linha selecionada)
  const headers = useMemo(() => {
    if (rawData.length > headerRowIndex) {
      return rawData[headerRowIndex].map((cell, idx) => cell || `Coluna ${idx + 1}`);
    }
    return [];
  }, [rawData, headerRowIndex]);

  // Dados já mapeados para pré‑visualização
  const mappedData = useMemo(() => {
    const dataRows = rawData.slice(headerRowIndex + 1);
    const result: Record<string, string>[] = [];
    for (const row of dataRows) {
      const obj: Record<string, string> = {};
      for (const [colIdx, field] of Object.entries(columnMapping)) {
        const col = Number(colIdx);
        if (field.value !== "ignorar" && row[col] !== undefined) {
          obj[field.value] = String(row[col]).trim();
        }
      }
      if (Object.keys(obj).length > 0) result.push(obj);
    }
    return result;
  }, [rawData, headerRowIndex, columnMapping]);

  // Atualiza mapeamento de uma coluna
  const handleMappingChange = (columnIndex: number, fieldValue: string) => {
    const selected =
      fieldValue === ""
        ? { value: "ignorar", label: "Ignorar" }
        : FIELD_OPTIONS.find(opt => opt.value === fieldValue);
    if (selected) {
      setColumnMapping(prev => ({ ...prev, [columnIndex]: selected }));
    }
  };

  // Valida e importa
  const handleConfirm = () => {
    const validation = validateColumnMappings(columnMapping);
    if (!validation.valid) {
      setError('Faltam campos obrigat\u00f3rios: ' + validation.missingRequired.join(', '));
      return;
    }
    onImport(mappedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center glass-overlay p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-modal w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {step === "upload" ? "Importar Alunos" : "Mapeamento de Colunas"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === "upload" ? "Selecione o arquivo para começar" : "Ajuste os campos detectados"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-2xl text-sm flex items-center gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Etapa 1: Upload (arrastar/soltar) */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer group flex flex-col items-center gap-6 ${
                  dragOver 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5" 
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-500/5"
                }`}
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileUp className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Arraste sua planilha ou clique aqui</h3>
                  <p className="text-sm text-slate-500 mt-2">Suporta .xlsx, .xls e .csv (Múltiplas abas suportadas)</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button className="bg-blue-500 text-white px-8 py-3 rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 font-bold">
                  Selecionar Arquivo
                </button>
              </div>
            </div>
          )}

          {/* Etapa 2: Mapeamento */}
          {step === "mapping" && (
            <div className="space-y-6">
              {/* Abas (Sheets) */}
              {sheets.length > 1 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Abas do Documento</label>
                  <div className="flex flex-wrap gap-2">
                    {sheets.map(sheet => (
                      <button
                        key={sheet}
                        onClick={() => changeSheet(sheet)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          activeSheet === sheet
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-600/20 scale-105"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500"
                        }`}
                      >
                        {sheet}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-blue-500" />
                    Visualização dos Dados
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Clique em uma linha para defini-la como cabeçalho (titles).
                  </p>
                </div>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-[10px] font-bold text-blue-600">
                  {rawData.length} LINHAS DETECTADAS
                </div>
              </div>

              {/* Tabela de pré‑visualização */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="min-w-full text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-16 text-center text-xs font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">LINHA</th>
                        {headers.map((header, idx) => (
                          <th key={idx} className="p-3 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 min-w-[150px]">
                            {header || `Col ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {rawData.slice(0, Math.min(15, rawData.length)).map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          onClick={() => setHeaderRowIndex(rowIdx)}
                          className={`cursor-pointer transition-all ${
                            rowIdx === headerRowIndex
                              ? "bg-blue-50/50 dark:bg-blue-500/10"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          }`}
                        >
                          <td className={`p-3 text-center font-bold text-xs ${
                             rowIdx === headerRowIndex ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                            {rowIdx === headerRowIndex ? '↓' : rowIdx}
                          </td>
                          {headers.map((_, colIdx) => (
                            <td key={colIdx} className={`p-3 whitespace-nowrap text-xs transition-colors ${
                               rowIdx === headerRowIndex ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500'
                            }`}>
                              <div className="truncate max-w-[200px]">
                                {row[colIdx] || <span className="text-slate-300 opacity-30">—</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mapeamento de colunas */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                    Mapeamento de Campos
                  </h3>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Obrigatório: Nome* e Turma*</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {headers.map((header, colIdx) => (
                    <div key={colIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group hover:border-blue-500 transition-colors">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 truncate" title={header}>
                        {header || `Coluna ${colIdx + 1}`}
                      </label>
                      <select
                        value={columnMapping[colIdx]?.value || ""}
                        onChange={(e) => handleMappingChange(colIdx, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Ignorar</option>
                        {FIELD_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold transition-colors"
          >
            Cancelar
          </button>
          {step === "mapping" && (
            <button
              onClick={handleConfirm}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 group active:scale-95"
            >
              Concluir Importação
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
