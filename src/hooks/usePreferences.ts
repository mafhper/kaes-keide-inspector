import { useEffect, useMemo, useState } from 'react';
import type { UserPreferencesV1, SectionLayoutState } from '../types/preferences';
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY } from '../types/preferences';

function sanitizeSectionLayout(value: unknown): SectionLayoutState {
  const raw = (value ?? {}) as Partial<SectionLayoutState>;
  return {
    order: Array.isArray(raw.order) ? raw.order.filter((v): v is string => typeof v === 'string') : [],
    hidden: Array.isArray(raw.hidden) ? raw.hidden.filter((v): v is string => typeof v === 'string') : [],
    collapsed: Array.isArray(raw.collapsed) ? raw.collapsed.filter((v): v is string => typeof v === 'string') : [],
  };
}

function sanitizePrefs(value: unknown): UserPreferencesV1 {
  const raw = (value ?? {}) as Partial<UserPreferencesV1>;
  const sectionLayouts = Object.fromEntries(
    Object.entries(raw.sectionLayouts ?? {}).map(([k, v]) => [k, sanitizeSectionLayout(v)]),
  );

  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    version: 1,
    sectionLayouts,
    stackCategoryOrder: Array.isArray(raw.stackCategoryOrder) ? raw.stackCategoryOrder.filter((v): v is string => typeof v === 'string') : [],
    hiddenStackCategories: Array.isArray(raw.hiddenStackCategories) ? raw.hiddenStackCategories.filter((v): v is string => typeof v === 'string') : [],
  };
}

function loadLegacyPrefs(): Promise<Partial<UserPreferencesV1>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve({});
      return;
    }

    chrome.storage.local.get(['isDark', 'activeTab', 'exportFormat'], (legacy) => {
      resolve({
        isDark: legacy.isDark,
        activeTab: legacy.activeTab,
        exportFormat: legacy.exportFormat,
      } as Partial<UserPreferencesV1>);
    });
  });
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferencesV1>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        setReady(true);
        return;
      }

      const [legacy] = await Promise.all([loadLegacyPrefs()]);

      chrome.storage.local.get([PREFERENCES_STORAGE_KEY], (res) => {
        if (canceled) return;

        const merged = sanitizePrefs({
          ...legacy,
          ...(res[PREFERENCES_STORAGE_KEY] ?? {}),
        });

        setPrefs(merged);
        setReady(true);
      });
    };

    void load();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

    chrome.storage.local.set({ [PREFERENCES_STORAGE_KEY]: prefs });
  }, [prefs, ready]);

  const api = useMemo(() => {
    return {
      prefs,
      ready,
      setPrefs,
      patchPreferences: (patch: Partial<UserPreferencesV1>) => {
        setPrefs((prev) => sanitizePrefs({ ...prev, ...patch }));
      },
      setSectionLayout: (key: string, layout: SectionLayoutState) => {
        setPrefs((prev) => ({
          ...prev,
          sectionLayouts: {
            ...prev.sectionLayouts,
            [key]: sanitizeSectionLayout(layout),
          },
        }));
      },
      getSectionLayout: (key: string): SectionLayoutState => {
        return sanitizeSectionLayout(prefs.sectionLayouts[key]);
      },
    };
  }, [prefs, ready]);

  return api;
}
