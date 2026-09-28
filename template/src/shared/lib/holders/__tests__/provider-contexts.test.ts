import "./react-test-setup";

import { type ComponentType, createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { CollectionProvider } from "../collection/CollectionProvider";
import { useCollectionContext } from "../collection/use-collection-context";
import { EntityProvider } from "../entity/EntityProvider";
import { useEntityContext } from "../entity/use-entity-context";
import { InfiniteProvider } from "../infinite/InfiniteProvider";
import { useInfiniteContext } from "../infinite/use-infinite-context";
import { MutationProvider } from "../mutation/MutationProvider";
import { useMutationContext } from "../mutation/use-mutation-context";
import { PagedProvider } from "../paged/PagedProvider";
import { usePagedContext } from "../paged/use-paged-context";
import { PollingProvider } from "../polling/PollingProvider";
import { usePollingContext } from "../polling/use-polling-context";
import { ErrorBoundary } from "./error-boundary";
import { HookProbe } from "./hook-probe";

describe("providers and contexts", () => {
  const specs = [
    [CollectionProvider, useCollectionContext],
    [EntityProvider, useEntityContext],
    [InfiniteProvider, useInfiniteContext],
    [MutationProvider, useMutationContext],
    [PagedProvider, usePagedContext],
    [PollingProvider, usePollingContext],
  ] as const;

  it.each(specs)(
    "provides an external value through %p",
    async (Provider, useContextValue) => {
      const value = { marker: true };
      let received: unknown;

      await act(async () => {
        TestRenderer.create(
          createElement(
            Provider as unknown as ComponentType<Record<string, unknown>>,
            { value },
            createElement(HookProbe, {
              useValue: useContextValue,
              onValue: result => {
                received = result;
              },
            }),
          ),
        );
      });

      expect(received).toBe(value);
    },
  );

  it.each(specs)(
    "creates an internal value in %p",
    async (Provider, useContextValue) => {
      let received: unknown;

      await act(async () => {
        TestRenderer.create(
          createElement(
            Provider as unknown as ComponentType<Record<string, unknown>>,
            null,
            createElement(HookProbe, {
              useValue: useContextValue,
              onValue: result => {
                received = result;
              },
            }),
          ),
        );
      });

      expect(received).toHaveProperty("holder");
    },
  );

  it("reports context usage outside its provider", async () => {
    let received: Error | null = null;

    await act(async () => {
      TestRenderer.create(
        createElement(
          ErrorBoundary,
          {
            onError: error => {
              received = error;
            },
          },
          createElement(HookProbe, {
            useValue: useEntityContext,
            onValue: () => undefined,
          }),
        ),
      );
    });

    expect((received as Error | null)?.message).toBe(
      "useEntityContext must be used within EntityProvider",
    );
  });
});
