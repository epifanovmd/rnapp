import React, {FC, memo} from 'react';
import {ImageStyle} from 'react-native';
import {FlexProps, useFlexProps} from '@force-dev/react-mobile';
import FastImage, {FastImageProps} from 'react-native-fast-image';

export interface ImageProps
  extends FlexProps<ImageStyle>,
    Omit<FastImageProps, 'style'> {}

export const Image: FC<ImageProps> = memo(props => {
  const {style, ownProps} = useFlexProps(props);

  const {} = ownProps;

  return <FastImage style={style as any} {...ownProps} />;
});
