import { formatter } from "@shared/lib/utils";
import {
  Col,
  Divider,
  IconButton,
  Row,
  Skeleton,
  Tag,
  Text,
  type TTagVariant,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, Fragment } from "react";

import type { EnrollAgentVM } from "../model/useEnrollAgentVM";
import {
  enrollmentTokenState,
  type TEnrollmentTokenState,
} from "../model/validation";

interface IEnrollmentTokenListProps {
  vm: EnrollAgentVM;
}

const STATE: Record<
  TEnrollmentTokenState,
  { label: string; variant: TTagVariant }
> = {
  active: { label: "действует", variant: "success" },
  revoked: { label: "отозван", variant: "destructive" },
  expired: { label: "истёк", variant: "muted" },
  used: { label: "использован", variant: "muted" },
};

/** Выпущенные токены: состояние, использования, срок; действующие можно отозвать. */
export const EnrollmentTokenList: FC<IEnrollmentTokenListProps> = observer(
  ({ vm }) => {
    if (vm.isTokensLoading && vm.tokens.length === 0) {
      return <Skeleton height={64} borderRadius={12} />;
    }
    if (vm.tokens.length === 0) {
      return (
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {"Токенов пока нет — выпустите первый."}
        </Text>
      );
    }

    return (
      <Col bg={"onSurface"} radius={12} ph={12}>
        {vm.tokens.map((token, index) => {
          const state = STATE[enrollmentTokenState(token)];

          return (
            <Fragment key={token.id}>
              {index > 0 && <Divider />}
              <Row alignItems={"center"} gap={8} pv={10}>
                <Col flex={1} gap={2}>
                  <Row alignItems={"center"} gap={6}>
                    <Text
                      textStyle={"Title_S2"}
                      numberOfLines={1}
                      flexShrink={1}
                    >
                      {token.name}
                    </Text>
                    <Tag variant={state.variant}>{state.label}</Tag>
                  </Row>
                  <Text
                    textStyle={"Caption_M3"}
                    color={"textSecondary"}
                    numberOfLines={2}
                  >
                    {[
                      `${token.prefix}…`,
                      `агентов ${token.uses}${token.maxUses === null ? "" : ` из ${token.maxUses}`}`,
                      token.expiresAt
                        ? `до ${formatter.date.format(token.expiresAt)}`
                        : "бессрочный",
                    ].join(" · ")}
                  </Text>
                </Col>
                {enrollmentTokenState(token) === "active" && (
                  <IconButton
                    name={"ban"}
                    color={"danger"}
                    accessibilityLabel={`Отозвать токен ${token.name}`}
                    onPress={() => vm.revokeToken(token)}
                  />
                )}
              </Row>
            </Fragment>
          );
        })}
      </Col>
    );
  },
);
