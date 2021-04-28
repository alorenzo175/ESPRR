import Results from "@/components/Results.vue";
import TimeseriesPlot from "@/components/data/Timeseries.vue";
import StatisticsTable from "@/components/data/StatisticsTable.vue";
import { $auth } from "./mockauth";
import { systems, tsTable, statisticsTable } from "@/api/__mocks__/systems";
import { getResult } from "@/api/systems";

import { createLocalVue, mount } from "@vue/test-utils";
import flushPromises from "flush-promises";

// use systems mock module
jest.mock("@/api/systems");

const localVue = createLocalVue();

const mocks = { $auth };
const stubs = {
  "system-map": true,
};

describe("Test Results component", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("Test results", async () => {
    const appTarget = document.createElement("div");
    appTarget.id = "app";
    document.body.appendChild(appTarget);

    const wrapper = mount(Results, {
      attachTo: "#app",
      localVue,
      mocks,
      stubs,
      propsData: {
        system: systems[0],
      },
    });

    await flushPromises();
    const plot = wrapper.findComponent(TimeseriesPlot);
    const statTable = wrapper.findComponent(StatisticsTable);
    expect(plot.exists()).toBe(true);
    expect(plot.props("timeseriesData")).toEqual(tsTable);
    expect(statTable.exists()).toBe(true);
    expect(statTable.props("tableData")).toEqual(statisticsTable);
  });
  it("Test result status error", async () => {
    // @ts-expect-error mocked fn
    getResult.mockImplementationOnce(async () => {
      return {
        status: "error",
        error: ["it's bad"],
      };
    });
    const appTarget = document.createElement("div");
    appTarget.id = "app";
    document.body.appendChild(appTarget);

    const wrapper = mount(Results, {
      attachTo: "#app",
      localVue,
      mocks,
      stubs,
      propsData: {
        system: systems[0],
      },
    });

    await flushPromises();
    expect(wrapper.find(".errors").text()).toBe(
      "Errors occurred during processing:\n    \n        it's bad"
    );
  });
  it("Test result status messages", async () => {
    // @ts-expect-error mocked fn
    getResult.mockImplementationOnce(async () => {
      return {
        status: "queued",
      };
    });
    const appTarget = document.createElement("div");
    appTarget.id = "app";
    document.body.appendChild(appTarget);

    const wrapper = mount(Results, {
      attachTo: "#app",
      localVue,
      mocks,
      stubs,
      propsData: {
        system: systems[0],
      },
    });

    await flushPromises();
    expect(wrapper.text()).toBe(
      "Performance calculation is queued and will be processed shortly."
    );

    // @ts-expect-error mocked fn
    getResult.mockImplementationOnce(async () => {
      return {
        status: "running",
      };
    });
    jest.runAllTimers();
    await flushPromises();
    expect(wrapper.text()).toBe(
      "Performance calculation is running and will be ready soon."
    );

    // @ts-expect-error mocked fn
    getResult.mockImplementationOnce(async () => {
      return {
        status: "statistics missing",
      };
    });
    jest.runAllTimers();
    await flushPromises();
    expect(wrapper.text()).toBe("Result statistics are missing.");

    // @ts-expect-error mocked fn
    getResult.mockImplementationOnce(async () => {
      return {
        status: "timeseries missing",
      };
    });
    jest.runAllTimers();
    await flushPromises();
    expect(wrapper.text()).toBe("Result timeseries are missing.");
  });
  it("Test results destroyed method", async () => {
    // @ts-expect-error mock queued state so timeout will be set
    getResult.mockImplementationOnce(async () => {
      return {
        status: "queued",
      };
    });
    const appTarget = document.createElement("div");
    appTarget.id = "app";
    document.body.appendChild(appTarget);

    const wrapper = mount(Results, {
      attachTo: "#app",
      localVue,
      mocks,
      stubs,
      propsData: {
        system: systems[0],
      },
    });

    await flushPromises();
    expect(wrapper.vm.$data.timeout).toBeTruthy();
    wrapper.destroy();

    expect(wrapper.vm.$data.active).toBe(false);
    expect(wrapper.vm.$data.status).toBe(null);
    expect(wrapper.vm.$data.errors).toBe(null);
  });
});
