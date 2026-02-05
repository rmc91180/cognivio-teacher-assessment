import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/LayoutShell";
import { frameworkApi } from "@/lib/api";
import { toast } from "sonner";

const FRAMEWORK_LABELS = {
  danielson: "Danielson Framework",
  marshall: "Marshall Rubrics",
  custom: "Custom (Mix of Both)",
};

export function FrameworksPage() {
  const queryClient = useQueryClient();
  const { data: frameworksRes } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => frameworkApi.list().then((res) => res.data),
  });

  const { data: selectionRes } = useQuery({
    queryKey: ["framework-selection"],
    queryFn: () => frameworkApi.currentSelection().then((res) => res.data),
  });

  const [frameworkType, setFrameworkType] = useState("danielson");

  const { data: frameworkDetailRes, isLoading: frameworkLoading } = useQuery({
    queryKey: ["framework-detail", frameworkType],
    queryFn: () => frameworkApi.get(frameworkType).then((res) => res.data),
    enabled: Boolean(frameworkType),
  });

  const { data: customDomainsRes } = useQuery({
    queryKey: ["custom-domains"],
    queryFn: () => frameworkApi.listCustomDomains().then((res) => res.data),
  });

  const [selectedElements, setSelectedElements] = useState([]);
  const [customDomainName, setCustomDomainName] = useState("");
  const [customElementsInput, setCustomElementsInput] = useState("");

  useEffect(() => {
    if (selectionRes?.framework_type) {
      setFrameworkType(selectionRes.framework_type);
    }
    if (selectionRes?.selected_elements) {
      setSelectedElements(selectionRes.selected_elements);
    }
  }, [selectionRes]);

  useEffect(() => {
    if (frameworkType !== "custom") {
      return;
    }
    if (selectedElements.length) {
      return;
    }
    if (!customDomains.length) {
      return;
    }
    const allElements = customDomains.flatMap((domain) =>
      (domain.elements || []).map((el) => el.id)
    );
    setSelectedElements(allElements);
  }, [frameworkType, customDomains, selectedElements.length]);

  const saveSelectionMutation = useMutation({
    mutationFn: () =>
      frameworkApi.saveSelection({
        framework_type: frameworkType,
        selected_elements: selectedElements,
      }),
    onSuccess: () => {
      toast.success("Framework selection saved");
      queryClient.invalidateQueries({ queryKey: ["framework-selection"] });
      queryClient.invalidateQueries({ queryKey: ["roster"] });
    },
    onError: () => {
      toast.error("Failed to save selection");
    },
  });

  const createCustomDomainMutation = useMutation({
    mutationFn: () =>
      frameworkApi.createCustomDomain({
        name: customDomainName.trim(),
        elements: customElementsInput
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      }),
    onSuccess: () => {
      toast.success("Custom domain created");
      setCustomDomainName("");
      setCustomElementsInput("");
      queryClient.invalidateQueries({ queryKey: ["custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["framework-detail", "custom"] });
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
    onError: () => {
      toast.error("Failed to create custom domain");
    },
  });

  const deleteCustomDomainMutation = useMutation({
    mutationFn: (domainId) => frameworkApi.deleteCustomDomain(domainId),
    onSuccess: () => {
      toast.success("Custom domain deleted");
      queryClient.invalidateQueries({ queryKey: ["custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["framework-detail", "custom"] });
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
    onError: () => {
      toast.error("Failed to delete custom domain");
    },
  });

  const domains = useMemo(
    () => frameworkDetailRes?.domains || [],
    [frameworkDetailRes]
  );
  const customDomains = useMemo(
    () => customDomainsRes?.domains || [],
    [customDomainsRes]
  );

  const domainStats = useMemo(() => {
    return domains.map((domain) => {
      const total = domain.elements?.length || 0;
      const selected = domain.elements?.filter((el) =>
        selectedElements.includes(el.id)
      ).length;
      return { id: domain.id, selected, total };
    });
  }, [domains, selectedElements]);

  const toggleElement = (elementId) => {
    setSelectedElements((prev) => {
      if (prev.includes(elementId)) {
        return prev.filter((id) => id !== elementId);
      }
      return [...prev, elementId];
    });
  };

  const toggleDomain = (domain) => {
    const elementIds = domain.elements?.map((el) => el.id) || [];
    setSelectedElements((prev) => {
      const allSelected = elementIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !elementIds.includes(id));
      }
      const merged = new Set([...prev, ...elementIds]);
      return Array.from(merged);
    });
  };

  const handleFrameworkChange = (type) => {
    setFrameworkType(type);
    setSelectedElements([]);
  };

  const selectedCount = selectedElements.length;

  return (
    <LayoutShell>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold text-slate-50">
            Rubric Frameworks
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Choose the rubric framework and focus domains that drive scoring and
            dashboard insights.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Framework selection
          </h2>
          <div className="flex flex-wrap gap-2">
            {(frameworksRes?.frameworks || []).map((f) => (
              <button
                key={f.type}
                type="button"
                onClick={() => handleFrameworkChange(f.type)}
                className={[
                  "rounded-md border px-3 py-2 text-xs transition-colors",
                  frameworkType === f.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800",
                ].join(" ")}
              >
                {FRAMEWORK_LABELS[f.type] || f.name}
                <span className="ml-2 text-[10px] text-slate-400">
                  {f.domain_count} domains
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Focus domains
              </h2>
              <p className="text-xs text-slate-400">
                Selected elements: {selectedCount}
              </p>
            </div>
            <button
              type="button"
              onClick={() => saveSelectionMutation.mutate()}
              disabled={saveSelectionMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saveSelectionMutation.isPending ? "Saving..." : "Save selection"}
            </button>
          </div>

          {frameworkLoading ? (
            <div className="text-sm text-slate-400">Loading framework...</div>
          ) : (
            <div className="space-y-4">
              {frameworkType === "custom" && (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Create custom domain
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Add your own focus domains and elements. Elements are
                    comma-separated.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      type="text"
                      value={customDomainName}
                      onChange={(e) => setCustomDomainName(e.target.value)}
                      placeholder="Domain name"
                      className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                    />
                    <input
                      type="text"
                      value={customElementsInput}
                      onChange={(e) => setCustomElementsInput(e.target.value)}
                      placeholder="Element 1, Element 2, Element 3"
                      className="md:col-span-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => createCustomDomainMutation.mutate()}
                      disabled={
                        createCustomDomainMutation.isPending ||
                        !customDomainName.trim() ||
                        !customElementsInput.trim()
                      }
                      className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500/90 disabled:opacity-60"
                    >
                      {createCustomDomainMutation.isPending
                        ? "Creating..."
                        : "Add custom domain"}
                    </button>
                  </div>
                  {customDomains.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {customDomains.map((domain) => (
                        <div
                          key={domain.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                        >
                          <div>
                            <div className="font-semibold">{domain.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {(domain.elements || [])
                                .map((el) => el.name)
                                .join(", ")}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              deleteCustomDomainMutation.mutate(domain.id)
                            }
                            className="rounded-md border border-rose-500/50 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {domains.map((domain) => {
                const stats = domainStats.find((d) => d.id === domain.id);
                const allSelected = stats?.selected === stats?.total && stats?.total > 0;
                return (
                  <div
                    key={domain.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                          {domain.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {stats?.selected || 0} of {stats?.total || 0} selected
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className="rounded-md border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                      >
                        {allSelected ? "Clear domain" : "Select domain"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(domain.elements || []).map((el) => {
                        const isSelected = selectedElements.includes(el.id);
                        return (
                          <label
                            key={el.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-800 bg-slate-950/70 p-2 text-xs text-slate-300 hover:border-primary/50"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleElement(el.id)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary/40"
                            />
                            <div>
                              <div className="text-slate-100">{el.id.toUpperCase()}</div>
                              <div className="text-[11px] text-slate-400">
                                {el.name}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </LayoutShell>
  );
}
