"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ReactFlow, Controls, Background, MarkerType, useNodesState, useEdgesState, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootMindMapPage() {
  const params = useParams();
  const router = useRouter();
  // URLのエンコード（%20など）を綺麗な文字列に戻す
  const decodedRoot = decodeURIComponent(params.root as string);

  const [words, setWords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // マインドマップの「点（Nodes）」と「線（Edges）」のState
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    async function fetchWords() {
      if (!decodedRoot) return;
      const { data } = await supabase
        .from("vocab")
        .select("id, word, language_code, translation, part_of_speech")
        .eq("root_word", decodedRoot);

      if (data) {
        setWords(data);
        generateMap(data);
      }
      setIsLoading(false);
    }
    fetchWords();
  }, [decodedRoot]);

  // 🌟 ここで単語データから「ツリー構造」を自動計算して作り出す
  const generateMap = (vocabData: any[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // ① 大元となる語源ノード（Root）
    newNodes.push({
      id: "root",
      position: { x: 0, y: 0 },
      data: { label: decodedRoot },
      style: {
        background: "#fff1f2", borderColor: "#fda4af", borderWidth: "2px",
        borderRadius: "1rem", padding: "1rem", fontWeight: "900", color: "#be123c",
        fontSize: "1.25rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", textAlign: "center"
      }
    });

    // 言語ごとに単語をグループ分け
    const langGroups = vocabData.reduce((acc, vocab) => {
      if (!acc[vocab.language_code]) acc[vocab.language_code] = [];
      acc[vocab.language_code].push(vocab);
      return acc;
    }, {} as Record<string, any[]>);

    const langs = Object.keys(langGroups);
    const langSpacing = 250; // 言語ノードの横幅の間隔

    langs.forEach((lang, langIndex) => {
      const langX = (langIndex - (langs.length - 1) / 2) * langSpacing;
      
      // ② 言語の分岐ノード（Language）
      const langNodeId = `lang-${lang}`;
      newNodes.push({
        id: langNodeId,
        position: { x: langX, y: 150 },
        data: { label: lang.toUpperCase() },
        style: {
          background: "#eff6ff", borderColor: "#bfdbfe", borderWidth: "2px",
          borderRadius: "0.75rem", padding: "0.5rem 1rem", fontWeight: "900", color: "#1d4ed8",
          fontSize: "1rem", boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.1)", textAlign: "center"
        }
      });

      // ルーツ → 言語ノードへの線
      newEdges.push({
        id: `edge-root-${lang}`, source: "root", target: langNodeId,
        type: "smoothstep", animated: true,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1" }
      });

      // ③ 実際の単語ノード（Words）
      const wordsInLang = langGroups[lang];
      const wordSpacing = 160;

      // 🌟 ここを修正: (vocab: any, wordIndex: number) と型を明記
      wordsInLang.forEach((vocab: any, wordIndex: number) => {
        const wordX = langX + (wordIndex - (wordsInLang.length - 1) / 2) * wordSpacing;
        const wordNodeId = `word-${vocab.id}`;

        newNodes.push({
          id: wordNodeId,
          position: { x: wordX, y: 300 },
          data: { 
            label: (
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-gray-900">{vocab.word}</span>
                <span className="text-[10px] font-bold text-gray-400 mt-1">{vocab.translation}</span>
              </div>
            ) 
          },
          style: {
            background: "#ffffff", borderColor: "#e5e7eb", borderWidth: "2px",
            borderRadius: "1rem", padding: "1rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", 
            textAlign: "center", width: "140px"
          }
        });

        // 言語ノード → 単語ノードへの線
        newEdges.push({
          id: `edge-${lang}-${vocab.id}`, source: langNodeId, target: wordNodeId,
          type: "smoothstep",
          style: { stroke: "#e2e8f0", strokeWidth: 2 }
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm shrink-0">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
            🌱 Etymology Map
          </span>
          <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            ← Back
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">
            Drawing Map...
          </div>
        ) : nodes.length > 0 ? (
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            fitView 
            fitViewOptions={{ padding: 0.2 }}
            className="bg-gray-50"
          >
            <Background color="#cbd5e1" gap={24} size={2} />
            <Controls className="bg-white border-2 border-gray-200 rounded-xl shadow-sm fill-gray-500" />
          </ReactFlow>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-400">
            No related words found.
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 px-6 py-4 rounded-2xl shadow-lg pointer-events-none text-center">
          <p className="text-sm font-black text-gray-800">Origin: <span className="text-rose-600 text-lg">{decodedRoot}</span></p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Scroll to zoom • Drag to move nodes</p>
        </div>
      </main>
    </div>
  );
}