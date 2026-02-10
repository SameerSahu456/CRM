import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { DashboardPreferences, WidgetPlacement } from '../types';
import { WIDGET_REGISTRY, getDefaultPreferences } from '../config/widgetRegistry';
import { dashboardApi } from '../services/api';

export const useDashboardLayout = () => {
  const { user } = useAuth();
  const { currentView } = useView();
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Try to load from backend
        const prefs = await dashboardApi.getPreferences();

        // If backend returns empty preferences, use defaults
        if (!prefs || !prefs.widgets || prefs.widgets.length === 0) {
          const defaults = getDefaultPreferences();
          setPreferences(defaults);
          // Save defaults to backend
          await dashboardApi.updatePreferences(defaults);
        } else {
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Failed to load dashboard preferences:', error);
        // Fallback to defaults
        setPreferences(getDefaultPreferences());
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to backend
  const savePreferences = useCallback(async (newPrefs: DashboardPreferences) => {
    if (!user) return;

    setPreferences(newPrefs);
    setIsSaving(true);

    try {
      await dashboardApi.updatePreferences(newPrefs);
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error);
      // TODO: Show error toast to user
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Get widgets accessible to current user based on role and view
  const getAccessibleWidgets = useCallback(() => {
    if (!preferences || !user) return [];

    return preferences.widgets
      .filter(w => {
        const meta = WIDGET_REGISTRY[w.id];
        if (!meta) return false;

        // Check view access
        if (meta.requiredView && meta.requiredView !== 'both') {
          // If currentView is 'both', show all widgets
          if (currentView !== 'both' && meta.requiredView !== currentView) {
            return false;
          }
        }

        // Check role access (if specified)
        if (meta.requiredRoles && !meta.requiredRoles.includes(user.role)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [preferences, user, currentView]);

  // Toggle widget visibility
  const toggleVisibility = useCallback((widgetId: string) => {
    if (!preferences) return;

    const newWidgets = preferences.widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );

    savePreferences({
      widgets: newWidgets,
      lastModified: new Date().toISOString(),
    });
  }, [preferences, savePreferences]);

  // Reorder widgets
  const reorderWidgets = useCallback((reorderedIds: string[]) => {
    if (!preferences) return;

    const newWidgets = reorderedIds.map((id, index) => {
      const existing = preferences.widgets.find(w => w.id === id);
      return existing ? { ...existing, order: index } : { id, visible: true, order: index };
    });

    savePreferences({
      widgets: newWidgets,
      lastModified: new Date().toISOString(),
    });
  }, [preferences, savePreferences]);

  // Reset to default preferences
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultPreferences();
    savePreferences(defaults);
  }, [savePreferences]);

  // Check if a specific widget is visible
  const isWidgetVisible = useCallback((widgetId: string) => {
    if (!preferences) return true;
    const widget = preferences.widgets.find(w => w.id === widgetId);
    return widget ? widget.visible : true;
  }, [preferences]);

  return {
    preferences,
    accessibleWidgets: getAccessibleWidgets(),
    isLoading,
    isSaving,
    toggleVisibility,
    reorderWidgets,
    resetToDefaults,
    isWidgetVisible,
  };
};
