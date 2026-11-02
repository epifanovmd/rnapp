import React, { FC, memo } from "react";

import { IEmptyStateProps } from "../empty-state";
import { Col } from "../flex-view";
import { Navbar } from "../navbar";
import { ScreenState } from "./ScreenState";

export interface IScreenFallbackProps {
  /** Заголовок навбара. */
  title?: string;
  isLoading?: boolean;
  /** Ошибка загрузки — показывается с кнопкой «Повторить» (при `onRetry`). */
  error?: string | null;
  onRetry?: () => void;
  /** Не загружается и без ошибки — «не найдено». */
  notFound?: Partial<IEmptyStateProps>;
  /** Отступ навбара под статус-бар. По умолчанию `true`. */
  safeArea?: boolean;
  /** Своё действие «назад»; по умолчанию — `goBack` навигации. */
  onBack?: () => void;
}

/**
 * Экран-заглушка деталей без шапки стека: навбар с «назад» и состояние —
 * загрузка, ошибка с повтором или «не найдено».
 *
 * @example
 * if (!project) return <ScreenFallback title={"Проект"} isLoading={vm.isLoading} notFound={{ title: "Проект не найден" }} />;
 */
export const ScreenFallback: FC<IScreenFallbackProps> = memo(
  ({ title, isLoading, error, onRetry, notFound, safeArea = true, onBack }) => (
    <Col flex={1}>
      <Navbar safeArea={safeArea} title={title}>
        <Navbar.BackButton onPress={onBack} />
      </Navbar>
      <ScreenState
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty
        empty={{ icon: "circleAlert", title: "Не найдено", ...notFound }}
      />
    </Col>
  ),
);
