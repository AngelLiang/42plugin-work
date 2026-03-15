import { useState, useEffect } from 'react';
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

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
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
      setListedPlugins(plugins);
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
      setListedPlugins(prev => [...prev, ...more]);
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

  const loadInstalledPlugins = async () => {
    try {
      const result = await fetchInstalledPlugins();
      setInstalledPlugins(result);
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
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
      setPlugins(result);
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
      setPlugins(plugins.map(p =>
        p.id === pluginId ? { ...p, installed: true } : p
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: '安装失败' };
    } finally {
      setActionLoading(false);
    }
  };

  const handleUninstall = async (pluginId: string): Promise<ActionResult> => {
    setActionLoading(true);
    try {
      await uninstallPlugin(pluginId);
      await loadInstalledPlugins();
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
