import React, {FC, memo} from 'react';
import {
  ImageStyle,
  ImageProps as _ImageProps,
  Image as RNImage,
} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../flexView';

export interface ImageProps
  extends FlexComponentProps<_ImageProps, ImageStyle> {}

export const Image: FC<ImageProps> = memo(props => {
  const {style, ownProps} = useFlexProps(props);

  return <RNImage style={style as any} {...ownProps} />;
});
