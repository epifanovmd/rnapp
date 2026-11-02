import React, { FC, memo, PropsWithChildren } from "react";

import { Button } from "../button";
import { EmptyState, IEmptyStateProps } from "../empty-state";
import { Col } from "../flex-view";
import { Spinner } from "../spinner";

export interface IScreenStateProps {
  isLoading?: boolean;
  /** Сообщение ошибки загрузки; показывается вместо контента. */
  error?: string | null;
  onRetry?: () => void;
  /** Пусто — показывается `empty` вместо контента. */
  isEmpty?: boolean;
  empty?: IEmptyStateProps;
}

/**
 * Состояние раздела: загрузка → ошибка (с повтором) → пусто → контент.
 * Загрузка показывается, только пока данных ещё нет.
 */
export const ScreenState: FC<PropsWithChildren<IScreenStateProps>> = memo(
  ({ isLoading, error, onRetry, isEmpty, empty, children }) => {
    if (error) {
      return (
        <EmptyState
          icon={"circleAlert"}
          title={"Не удалось загрузить"}
          description={error}
          action={
            onRetry ? (
              <Button
                size={"small"}
                appearance={"outline"}
                title={"Повторить"}
                onPress={onRetry}
              />
            ) : undefined
          }
        />
      );
    }

    if (isLoading && isEmpty !== false) {
      return (
        <Col pv={48} alignItems={"center"}>
          <Spinner size={32} />
        </Col>
      );
    }

    if (isEmpty && empty) {
      return <EmptyState {...empty} />;
    }

    return <>{children}</>;
  },
);
