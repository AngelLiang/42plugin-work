import { useState, useEffect, useRef } from 'react';
import {
  checkPluginAvailability,
  fetchInstalledPlugins,
  searchPlugins,
  fetchPlugins,
  installPlugin,
  uninstallPlugin,
} from '@/lib/42plugin/api';
import { Plugin } from '@/lib/42plugin/types';

export interface ActionResult {
  success: boolean;
  error?: string;
}

const markInstalled = (list: Plugin[], installed: Plugin[]): Plugin[] => {
  const installedIds = new Set(installed.map(p => p.name));
  return list.map(p => ({ ...p, installed: installedIds.has(p.id) }));
};

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const installedPluginsRef = useRef<Plugin[]>([]);
  const [listedPlugins, setListedPlugins] = useState<Plugin[]>([]);
  const [listedPage, setListedPage] = useState(1);
  const [hasMoreListed, setHasMoreListed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [pluginAvailable, setPluginAvailable] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSort, setFilterSort] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await checkPluginAvailability();
      setPluginAvailable(available);
    } catch {
      setPluginAvailable(false);
    }
    // Always try to load installed plugins regardless of availability check
    await loadInstalledPlugins();
    await loadPlugins();
  };

  const loadPlugins = async (type?: string, sort?: string) => {
    try {
      const { plugins, hasMore } = await fetchPlugins(1, 12, type, sort);
      setListedPlugins(markInstalled(plugins, installedPluginsRef.current));
      setListedPage(1);
      setHasMoreListed(hasMore);
    } catch (error) {
      console.error('Failed to load listed plugins:', error);
    }
  };

  const loadMorePlugins = async () => {
    if (loadingMore || !hasMoreListed) return;
    setLoadingMore(true);
    try {
      const nextPage = listedPage + 1;
      const { plugins: more, hasMore } = await fetchPlugins(nextPage, 12, filterType, filterSort);
      setListedPlugins(prev => [...prev, ...markInstalled(more, installedPluginsRef.current)]);
      setListedPage(nextPage);
      setHasMoreListed(hasMore);
    } catch (error) {
      console.error('Failed to load more plugins:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilter = async (type?: string, sort?: string) => {
    setFilterType(type);
    setFilterSort(sort);
    await loadPlugins(type, sort);
  };

  const loadInstalledPlugins = async (): Promise<Plugin[]> => {
    try {
      const result = await fetchInstalledPlugins();
      setInstalledPlugins(result);
      installedPluginsRef.current = result;
      return result;
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
      return [];
    }
  };

  const handleSearch = async (value: string): Promise<ActionResult> => {
    if (!value.trim()) {
      setSearchQuery('');
      return { success: false, error: '请输入搜索关键词' };
    }

    setSearchQuery(value);
    setLoading(true);
    try {
      const result = await searchPlugins(value);
      setPlugins(markInstalled(result, installedPluginsRef.current));
      return { success: true };
    } catch (error) {
      return { success: false, error: '搜索失败' };
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (pluginId: string, workDir?: string): Promise<ActionResult> => {
    setActionLoading(true);
    try {
      await installPlugin(pluginId, workDir);
      await loadInstalledPlugins();
      setPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, installed: true } : p
      ));
      setListedPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, installed: true } : p
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: '安装失败' };
    } finally {
      setActionLoading(false);
    }
  };

  const handleUninstall = async (pluginId: string, workDir?: string): Promise<ActionResult> => {
    setActionLoading(true);
    try {
      await uninstallPlugin(pluginId, workDir);
      await loadInstalledPlugins();
      setPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, installed: false } : p
      ));
      setListedPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, installed: false } : p
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: '卸载失败' };
    } finally {
      setActionLoading(false);
    }
  };

  return {
    plugins,
    installedPlugins,
    listedPlugins,
    searchQuery,
    loading,
    pluginAvailable,
    actionLoading,
    loadingMore,
    hasMoreListed,
    filterType,
    filterSort,
    handleSearch,
    handleInstall,
    handleUninstall,
    loadMorePlugins,
    handleFilter,
  };
}
