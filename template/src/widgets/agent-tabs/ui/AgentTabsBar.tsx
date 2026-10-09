import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { HiddenBar, SegmentedTabBar } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useAgentTabs } from "../model/agent-tabs-context";

/** Больше вкладок не помещается в ширину — переключатель прокручивается. */
const SCROLLABLE_FROM = 3;

/**
 * Шапка экрана: навбар и карточка от экрана уезжают при скролле,
 * переключатель вкладок остаётся.
 */
export const AgentTabsBar: FC<MaterialTopTabBarProps> = observer(props => {
  const { header } = useAgentTabs();

  return (
    <HiddenBar safeArea>
      {header}
      {props.state.routes.length > 1 && (
        <HiddenBar.StickyContent>
          <SegmentedTabBar
            {...props}
            mh={16}
            mb={8}
            scrollable={props.state.routes.length > SCROLLABLE_FROM}
          />
        </HiddenBar.StickyContent>
      )}
    </HiddenBar>
  );
});
