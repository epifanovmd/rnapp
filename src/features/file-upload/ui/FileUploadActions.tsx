import { ActionSheet, Button, Col, ProgressBar, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { describeUpload } from "../model/upload-status";
import { useFileUploadVM } from "../model/useFileUploadVM";

/** Кнопка добавления файлов, шторка источников и прогресс загрузки. */
export const FileUploadActions: FC = observer(() => {
  const {
    sheetRef,
    sources,
    open,
    selectSource,
    isUploading,
    uploadProgress,
    uploadQueue,
  } = useFileUploadVM();

  const status = describeUpload({
    progress: uploadProgress ?? 0,
    queue: uploadQueue,
  });

  return (
    <Col gap={8}>
      <Button size={"small"} loading={isUploading} onPress={open}>
        {"Добавить файлы"}
      </Button>

      {isUploading && (
        <Col gap={4}>
          <ProgressBar
            progress={uploadProgress ?? 0}
            indeterminate={status.indeterminate}
          />
          <Text textStyle={"Caption_M1"} color={"textSecondary"}>
            {status.text}
          </Text>
        </Col>
      )}

      <ActionSheet
        ref={sheetRef}
        title={"Добавить файлы"}
        items={sources}
        onSelect={selectSource}
      />
    </Col>
  );
});
