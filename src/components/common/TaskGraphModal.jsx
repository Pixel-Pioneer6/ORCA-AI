import React, { useState, useEffect } from 'react';

export default function TaskGraphModal({ isOpen, onClose, query = 'Is it safe to go out tomorrow morning?' }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'json'
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/v1/query/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
    })
      .then((res) => res.json())
      .then((data) => {
        setPlan(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch task graph plan:', err);
        setLoading(false);
      });
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-on-surface">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-pad-md py-3 bg-[#001026] text-white border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[22px]">account_tree</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-sm font-bold">ORCA Supervisor Task Graph (DAG)</h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-mono font-bold">
                  PRD §6.3 · 9 Nodes · 4 Branches
                </span>
              </div>
              <p className="text-[10px] text-white/70 font-mono truncate max-w-lg">
                Query: "{query}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-2.5 py-1 rounded ${activeTab === 'visual' ? 'bg-secondary text-white shadow-xs' : 'text-white/70'}`}
              >
                Visual DAG
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-2.5 py-1 rounded ${activeTab === 'json' ? 'bg-secondary text-white shadow-xs' : 'text-white/70'}`}
              >
                Typed JSON
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-grow overflow-y-auto p-pad-md bg-surface">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-xs text-on-surface-variant font-bold">
                Decomposing query into DAG Task Graph across 8 Specialist Agents...
              </span>
            </div>
          ) : activeTab === 'json' ? (
            <pre className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs font-mono text-on-surface overflow-x-auto">
              {JSON.stringify(plan, null, 2)}
            </pre>
          ) : (
            <div className="flex flex-col gap-pad-md">
              {/* Critical Path Execution Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Total DAG Nodes</span>
                  <div className="font-mono text-base font-bold text-on-surface">{plan?.total_nodes || 9}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Parallel Branches</span>
                  <div className="font-mono text-base font-bold text-secondary">{plan?.parallel_branches || 4} Parallel</div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Critical Path Latency</span>
                  <div className="font-mono text-base font-bold text-emerald-700">{plan?.estimated_latency_ms || 590} ms</div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Evidence Leaf Citations</span>
                  <div className="font-mono text-base font-bold text-on-surface">{plan?.evidence_leaf_count || 6} Grounded</div>
                </div>
              </div>

              {/* Interactive Node Deck */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
                {/* Left Column: Interactive Node List (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                  {plan?.nodes?.map((node, i) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isGuardrail = node.id.includes('guardrail');
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-surface-container-lowest border-secondary shadow-md ring-2 ring-secondary/20'
                            : isGuardrail
                            ? 'bg-amber-500/5 border-amber-400 hover:bg-amber-500/10'
                            : 'bg-surface-container-lowest border-surface-container-high hover:border-surface-container-highest'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-secondary-container text-primary font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-on-surface">{node.agent}</span>
                              <span className="font-mono text-[10px] text-secondary font-bold">.{node.tool}()</span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                              {node.description}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-800 font-bold mt-1">
                              Source: {node.retrieved_source}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 font-mono text-[9px] font-bold">
                            {node.status}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant mt-1">
                            {node.latency_ms} ms
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Node Inspector Drawer (5 cols) */}
                <div className="lg:col-span-5 p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col justify-between">
                  {selectedNode ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-surface-container pb-2">
                        <span className="font-bold text-xs text-on-surface uppercase tracking-wider">
                          Node Inspector
                        </span>
                        <span className="font-mono text-[10px] text-secondary font-bold">
                          {selectedNode.id}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Executing Agent</span>
                        <div className="font-bold text-sm text-on-surface">{selectedNode.agent}</div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Invoked Tool</span>
                        <div className="font-mono text-xs font-bold text-secondary">
                          {selectedNode.tool}()
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Operational Purpose</span>
                        <p className="text-xs text-on-surface leading-relaxed mt-0.5">
                          {selectedNode.description}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Bound Arguments</span>
                        <pre className="p-2 rounded bg-surface-container-low text-[10px] font-mono text-on-surface overflow-x-auto mt-0.5">
                          {JSON.stringify(selectedNode.args, null, 2)}
                        </pre>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col gap-0.5 text-xs">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase">Evidence Leaf Citation</span>
                        <span className="font-bold text-emerald-950">{selectedNode.retrieved_source}</span>
                        <span className="font-mono text-[9px] text-emerald-800">{selectedNode.timestamp}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-on-surface-variant">
                      Select any DAG node to view arguments and data provenance.
                    </div>
                  )}

                  <div className="pt-3 border-t border-surface-container text-center">
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Governed by PRD §6.3 Zero-Hallucination Execution Semantics
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
