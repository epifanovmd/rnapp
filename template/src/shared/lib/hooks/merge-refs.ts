import React from "react";

export function mergeRefs<T = any>(
  refs: Array<React.RefObject<T> | React.Ref<T>>,
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.RefObject<T | null>).current = value;
      }
    });
  };
}
