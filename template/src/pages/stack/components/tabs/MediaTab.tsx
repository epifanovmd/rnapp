import { Image, ImageViewing, Row, Text, Touchable } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";

const GALLERY = [1, 12, 25, 33, 41].map(
  seed => `https://picsum.photos/id/${seed}/600/400`,
);

const VIEWER_IMAGES = GALLERY.map(uri => ({ uri }));

export const MediaTab: FC = memo(() => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <DemoScreen>
      <DemoSection
        title={"Image"}
        description={"FastImage c FlexProps: размеры, radius, resizeMode"}
      >
        <Row gap={12}>
          <Image url={GALLERY[0]} width={96} height={96} radius={12} />
          <Image url={GALLERY[1]} width={96} height={96} radius={48} />
          <Image
            url={GALLERY[2]}
            width={96}
            height={96}
            radius={12}
            resizeMode={"contain"}
          />
        </Row>
      </DemoSection>

      <DemoSection
        title={"ImageViewing"}
        description={
          "Тап по превью — полноэкранный просмотр со свайпом и зумом"
        }
      >
        <Row gap={8}>
          {GALLERY.map((url, index) => (
            <Touchable key={url} onPress={() => setViewerIndex(index)}>
              <Image url={url} width={56} height={56} radius={8} />
            </Touchable>
          ))}
        </Row>
        <ImageViewing
          images={VIEWER_IMAGES}
          imageIndex={viewerIndex ?? 0}
          visible={viewerIndex !== null}
          onRequestClose={() => setViewerIndex(null)}
          onLongPress={(_image, index) =>
            console.log("ImageViewing long press:", index)
          }
          renderFooter={({ index, count }) => (
            <Text
              color={"white"}
              textAlign={"center"}
              pv={24}
            >{`Подпись к изображению ${index + 1} из ${count}`}</Text>
          )}
        />
      </DemoSection>
    </DemoScreen>
  );
});
