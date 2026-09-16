import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRatings } from "./useRatings";

describe("useRatings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps exercise ratings isolated between groups", () => {
    const { result, rerender } = renderHook(
      ({ groupId }) => useRatings(groupId),
      {
        initialProps: {
          groupId: "u8",
        },
      },
    );

    act(() => {
      result.current.rate("exercise-x", 3);
    });

    expect(result.current.stats("exercise-x")).toEqual({
      average: 3,
      count: 1,
    });

    rerender({
      groupId: "u10",
    });

    expect(result.current.stats("exercise-x")).toEqual({
      average: null,
      count: 0,
    });

    rerender({
      groupId: "u8",
    });

    expect(result.current.stats("exercise-x")).toEqual({
      average: 3,
      count: 1,
    });
  });
});
