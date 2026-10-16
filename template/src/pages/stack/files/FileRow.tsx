import type { IFileDto } from "@shared/api/gen/main/model";
import { formatter } from "@shared/lib/utils";
import { Avatar, Button, Col, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

export interface IFileRowProps {
  file: IFileDto;
  /** Удаление; без обработчика кнопки нет. */
  onDelete?: (file: IFileDto) => void;
}

/** Строка файла: превью, имя, тип, размер, статус и удаление. */
export const FileRow: FC<IFileRowProps> = memo(({ file, onDelete }) => (
  <Row bg={"surface"} radius={12} pa={12} gap={12} alignItems={"center"}>
    <Avatar
      size={48}
      borderRadius={8}
      url={file.thumbnailUrl ?? undefined}
      name={file.name}
    />
    <Col flex={1} gap={2}>
      <Text textStyle={"Body_M1"} numberOfLines={1}>
        {file.name}
      </Text>
      <Text textStyle={"Caption_M1"} color={"textSecondary"}>
        {[file.type, formatter.bytes(file.size), file.status].join(" · ")}
      </Text>
    </Col>
    {onDelete && (
      <Button
        size={"small"}
        variant={"danger"}
        appearance={"ghost"}
        onPress={() => onDelete(file)}
      >
        {"Удалить"}
      </Button>
    )}
  </Row>
));
