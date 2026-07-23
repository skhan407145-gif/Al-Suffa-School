import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, Settings } from 'lucide-react';

interface CodeViewProps {
  pythonCode: string;
}

export const CodeView: React.FC<CodeViewProps> = ({ pythonCode }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([pythonCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "school_app.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("pip install customtkinter && python school_app.py");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-md text-white text-base">🐍</span>
            Python CustomTkinter Source Code
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Production-ready executable Python script using modern CustomTkinter, standard grid layouts, and a Firebase Firestore Cloud backend.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded-lg font-medium border border-gray-750 transition"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded-lg font-medium transition"
          >
            <Download size={14} />
            Download school_app.py
          </button>
        </div>
      </div>

      {/* Execution Instructions */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm">
        <div className="p-1 text-blue-400 mt-0.5">
          <Terminal size={18} />
        </div>
        <div className="space-y-1 text-gray-300">
          <p className="font-semibold text-white">How to execute locally:</p>
          <p className="text-xs text-gray-400">
            Ensure Python 3 is installed on your OS. Install the CustomTkinter GUI framework dependency and boot the script:
          </p>
          <div className="bg-gray-950 px-3.5 py-2.5 rounded-lg font-mono text-xs text-blue-400 mt-2 border border-gray-800 flex justify-between items-center">
            <span>pip install customtkinter && python school_app.py</span>
            <button 
              onClick={handleCopyCmd}
              className={`text-[10px] uppercase font-bold transition ${copiedCmd ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {copiedCmd ? 'Copied!' : 'Copy cmd'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            * Note: It will connect to your Cloud database using the <code className="bg-gray-900 px-1 py-0.5 rounded text-blue-400 text-[10px]">firebase-admin</code> SDK, seed initial records if empty, and run completely in sync!
          </p>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
        {/* Code Title Bar */}
        <div className="bg-gray-900 border-b border-gray-850 px-4 py-2.5 flex justify-between items-center text-xs font-mono text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>school_app.py</span>
          </div>
          <span>Python 3 (Firebase Admin SDK + CTk)</span>
        </div>

        {/* Code Content Scroll */}
        <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-300 select-all leading-relaxed custom-scrollbar">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </div>
  );
};
