import React from "react";
import { createBetterStore } from "../src/lib/createBetterStore";
import { render, act } from "@testing-library/react";

test("should rerender component on subscribed state change", () => {
  let renderCount = 0;
  const store = createBetterStore({
    val: 0,
  });
  const RenderTester = () => {
    const val = store.use("val");
    renderCount += 1;
    return <></>;
  };
  render(<RenderTester />);
  act(() => {
    store.set("val", store.get("val") + 1);
  });
  expect(renderCount).toEqual(2);
});
test("should not rerender if state changes for other variable", () => {
  let renderCount = 0;
  const store = createBetterStore({
    val1: 0,
    val2: 0,
  });
  const RenderTester = () => {
    const val = store.use("val1");
    renderCount += 1;
    return <></>;
  };
  render(<RenderTester />);
  act(() => {
    store.set("val2", store.get("val2") + 1);
  });
  expect(renderCount).toEqual(1);
});

test("Should be able to subscribe to specific changes", () => {
  let updated = false;
  const store = createBetterStore({
    val: 0,
  });

  store.subscribe("val", () => {
    updated = true;
  });

  store.set("val", 1);

  expect(updated).toBe(true);
});

test("Subscribe should not trigger for different value changes", () => {
  let val1Updates = 0;
  const store = createBetterStore({
    val1: 0,
    val2: 0,
  });

  store.subscribe("val1", () => {
    val1Updates++;
  });

  store.set("val2", 1);

  expect(val1Updates).toBe(0);
});

test("should expose underlying zustand store", () => {
  const store = createBetterStore({
    val: 0,
  });

  expect(store.useStore).toBeDefined();
  expect(typeof store.useStore.getState).toBe("function");
  expect(typeof store.useStore.setState).toBe("function");
  expect(typeof store.useStore.subscribe).toBe("function");
});
