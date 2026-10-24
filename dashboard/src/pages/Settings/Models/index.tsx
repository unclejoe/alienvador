/**
 * Models — admin-only provider management page.
 *
 * Admins can create, edit, enable/disable, test, and delete providers.
 * All providers are globally available to every agent.
 *
 * Layout:
 *  1. Local preset providers (from /providers/presets) — Ollama / ONNX
 *     service cards.
 *  2. Custom providers — any configured provider whose name doesn't match a
 *     local preset (includes previously configured cloud providers).
 */
import { useMemo, useState } from "react";
import { Button, Divider, Empty, Space, Tabs, Typography } from "antd";
import {
  Images,
  MessageSquareText,
  Mic2,
  Plus,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import PageShell from "../../../layouts/PageShell";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { userCan } from "../../../utils/permissions";
import { useProviders, type ProviderRow } from "./useProviders";
import {
  findConfiguredProvider,
  isLocalPreset,
  isPresetProvider,
} from "./presetUtils";
import type { ProviderPreset } from "./useProviders";
import {
  CustomProviderModal,
  ActiveModelPool,
  LoadingState,
  LocalServiceCard,
  ProviderCard,
} from "./components";
import styles from "./index.module.less";
import { MediaGenerationSettingsPanel } from "../MediaGeneration";
import { VoiceSettingsPanel } from "../Voice";
import { SearchSettingsPanel } from "../SearchConfig";
import { DecisionSettingsPanel } from "./components/DecisionSettingsPanel";

type ModelCategory = "chat" | "generation" | "voice" | "search" | "decision";

function resolveModelCategory(
  requestedTab: string | null,
  canChat: boolean,
  canProviders: boolean,
  canVoice: boolean,
  canSearch: boolean,
): ModelCategory {
  if (requestedTab === "generation" && canProviders) return "generation";
  if (requestedTab === "decision" && canProviders) return "decision";
  if (requestedTab === "voice" && canVoice) return "voice";
  if (requestedTab === "search" && canSearch) return "search";
  if ((requestedTab === "chat" || requestedTab === null) && canChat) {
    return "chat";
  }
  if (canChat) return "chat";
  if (canVoice) return "voice";
  if (canSearch) return "search";
  if (canProviders) return "generation";
  return "chat";
}

const { Title } = Typography;

export default function ModelsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const canProviders = userCan(user, "providers");
  const canOllama = userCan(user, "ollama_models");
  const canOnnx = userCan(user, "onnx_models");
  const canVoice = userCan(user, "voice");
  const canSearch = userCan(user, "search");
  const canChat = canProviders || canOllama || canOnnx;
  const {
    providers,
    presets,
    resolvedModels,
    activeModel,
    modelReasoning,
    loading,
    error,
    fetchAll,
  } = useProviders();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const modelCategory = resolveModelCategory(
    searchParams.get("tab"),
    canChat,
    canProviders,
    canVoice,
    canSearch,
  );
  const setModelCategory = (next: string) => {
    const updated = new URLSearchParams(searchParams);
    if (
      next === "generation" ||
      next === "voice" ||
      next === "search" ||
      next === "decision"
    ) {
      updated.set("tab", next);
    } else updated.delete("tab");
    setSearchParams(updated, { replace: true });
  };

  const localPresets = useMemo(
    () =>
      presets.filter((p) => {
        if (!isLocalPreset(p)) return false;
        if (p.id === "onnx") return canOnnx;
        if (p.id === "ollama") return canOllama;
        return canOllama || canOnnx;
      }),
    [presets, canOllama, canOnnx],
  );
  const showPresetSection = (canOllama || canOnnx) && localPresets.length > 0;

  const renderPresetCards = (presets: ProviderPreset[]) => (
    <div className={styles.providerCards}>
      {presets.map((preset) => (
        <LocalServiceCard
          key={preset.id}
          preset={preset}
          provider={findConfiguredProvider(preset, providers) ?? null}
          onSaved={fetchAll}
          isHover={hoveredCard === `preset-${preset.id}`}
          onMouseEnter={() => setHoveredCard(`preset-${preset.id}`)}
          onMouseLeave={() => setHoveredCard(null)}
        />
      ))}
    </div>
  );

  // Custom providers: configured rows not already shown under a preset card
  const customProviders = useMemo<ProviderRow[]>(() => {
    return providers
      .filter((p) => !isPresetProvider(p, presets))
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.id - b.id;
      });
  }, [providers, presets]);

  const hasContent = presets.length > 0 || providers.length > 0;

  return (
    <PageShell
      title={t("pageShell.models.title")}
      subtitle={t("pageShell.models.subtitle")}
      actions={
        modelCategory === "chat" ? (
          <Space>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => void fetchAll()}
            >
              {t("common.refresh")}
            </Button>
          </Space>
        ) : null
      }
    >
      <Tabs
        activeKey={modelCategory}
        onChange={setModelCategory}
        items={[
          ...(canChat
            ? [
                {
                  key: "chat",
                  label: (
                    <Space className={styles.modelTabLabel} size={6}>
                      <MessageSquareText size={15} />
                      {t("models.chatModelsTab")}
                    </Space>
                  ),
                },
              ]
            : []),
          ...(canProviders
            ? [
                {
                  key: "generation",
                  label: (
                    <Space className={styles.modelTabLabel} size={6}>
                      <Images size={15} />
                      {t("models.generationModelsTab")}
                    </Space>
                  ),
                },
              ]
            : []),
          ...(canVoice
            ? [
                {
                  key: "voice",
                  label: (
                    <Space className={styles.modelTabLabel} size={6}>
                      <Mic2 size={15} />
                      {t("models.voiceModelsTab")}
                    </Space>
                  ),
                },
              ]
            : []),
          ...(canProviders
            ? [
                {
                  key: "decision",
                  label: (
                    <Space className={styles.modelTabLabel} size={6}>
                      <Scale size={15} />
                      {t("models.decisionModelsTab")}
                    </Space>
                  ),
                },
              ]
            : []),
          ...(canSearch
            ? [
                {
                  key: "search",
                  label: (
                    <Space className={styles.modelTabLabel} size={6}>
                      <Search size={15} />
                      {t("models.searchModelsTab")}
                    </Space>
                  ),
                },
              ]
            : []),
        ]}
      />
      {modelCategory === "generation" ? (
        <MediaGenerationSettingsPanel />
      ) : modelCategory === "voice" ? (
        <VoiceSettingsPanel />
      ) : modelCategory === "search" ? (
        <SearchSettingsPanel />
      ) : modelCategory === "decision" ? (
        <DecisionSettingsPanel
          openRouterKey={
            providers.find(
              (provider) =>
                provider.api_key &&
                (provider.name === "openrouter" ||
                  (provider.base_url ?? "").includes("openrouter.ai")),
            )?.api_key
          }
        />
      ) : loading ? (
        <LoadingState message={t("models.loadingProviders")} />
      ) : error ? (
        <LoadingState message={error} error onRetry={() => void fetchAll()} />
      ) : !hasContent ? (
        <Empty description={t("models.noProvidersHint")} />
      ) : (
        <>
          <ActiveModelPool
            resolvedModels={resolvedModels}
            activeModel={activeModel}
            modelReasoning={modelReasoning}
            providers={providers}
            onSaved={fetchAll}
          />

          <Divider style={{ margin: "24px 0" }} />

          {showPresetSection && (
            <>
              <Title level={5} style={{ marginBottom: 12 }}>
                {t("models.presetProviders")}
              </Title>
              {renderPresetCards(localPresets)}
            </>
          )}

          {canProviders && (
            <>
              {(presets.length > 0 || customProviders.length > 0) && (
                <Divider style={{ margin: "20px 0" }} />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  {t("models.customProviders")}
                </Title>
                <Button
                  type="primary"
                  size="small"
                  icon={<Plus size={13} />}
                  onClick={() => setAddOpen(true)}
                >
                  {t("models.addCustomProvider")}
                </Button>
              </div>
              {customProviders.length > 0 ? (
                <div className={styles.providerCards}>
                  {customProviders.map((p) => (
                    <ProviderCard
                      key={p.id}
                      provider={p}
                      onSaved={fetchAll}
                      isHover={hoveredCard === String(p.id)}
                      onMouseEnter={() => setHoveredCard(String(p.id))}
                      onMouseLeave={() => setHoveredCard(null)}
                      apiPrefix="/admin/providers"
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("models.noCustomProvidersHint")}
                />
              )}
            </>
          )}
        </>
      )}

      {modelCategory === "chat" && (
        <CustomProviderModal
          open={addOpen && canProviders}
          onClose={() => setAddOpen(false)}
          onSaved={fetchAll}
          apiPrefix="/admin/providers"
        />
      )}
    </PageShell>
  );
}
