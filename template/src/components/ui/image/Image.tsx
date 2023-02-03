import React, {FC, memo} from 'react';
import {
  Image as RNImage,
  ImageProps as _ImageProps,
  ImageStyle,
} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';

export interface ImageProps
  extends FlexComponentProps<_ImageProps, ImageStyle> {}

export const Image: FC<ImageProps> = memo(({children, ...rest}) => {
  const {style, ownProps} = useFlexProps(rest);

  return (
    <RNImage style={style as any} {...ownProps}>
      {children}
    </RNImage>
  );
});
