import { useCallback, useState } from "react";
import { panelStateStorage, PanelId } from "@app/store/panelStateStorage";

type PanelStateSetter = boolean | ((prev: boolean) => boolean);

export const usePanelCollapse = (panelId: PanelId, defaultValue = false) => {
  const [collapsed, setCollapsedState] = useState(() =>
    panelStateStorage.getPanelState(panelId, defaultValue)
  );

  const setCollapsed = useCallback(
    (value: PanelStateSetter) => {
      setCollapsedState((prev) => {
        const next = typeof value === "function" ? (value as (prev: boolean) => boolean)(prev) : value;
        panelStateStorage.setPanelState(panelId, next);
        return next;
      });
    },
    [panelId]
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  return { collapsed, setCollapsed, toggle };
};
