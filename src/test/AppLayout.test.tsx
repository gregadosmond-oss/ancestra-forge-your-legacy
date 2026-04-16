import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect } from "vitest";
import AppLayout from "@/components/AppLayout";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<div>page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("AppLayout — navbar", () => {
  it("renders the Ancestra logo", () => {
    renderAt("/home");
    expect(screen.getByText("Ancestra")).toBeInTheDocument();
  });

  it("renders all nav links", () => {
    renderAt("/home");
    expect(screen.getByRole("link", { name: /free tools/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /begin journey/i })).toBeInTheDocument();
  });

  it("Free Tools link points to /tools", () => {
    renderAt("/home");
    expect(screen.getByRole("link", { name: /free tools/i })).toHaveAttribute("href", "/tools");
  });

  it("renders page content via Outlet", () => {
    renderAt("/home");
    expect(screen.getByText("page content")).toBeInTheDocument();
  });
});

describe("AppLayout — back button", () => {
  it("hides back button on landing page /home", () => {
    renderAt("/home");
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("shows back button on /journey/1", () => {
    renderAt("/journey/1");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("shows back button on /tools/surname", () => {
    renderAt("/tools/surname");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("shows back button on /journey/2", () => {
    renderAt("/journey/2");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("shows back button on /shop", () => {
    renderAt("/shop");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });
});

describe("AppLayout — step counter", () => {
  it("hides step counter on non-journey pages", () => {
    renderAt("/tools/surname");
    expect(screen.queryByText(/\/ 06/)).not.toBeInTheDocument();
  });

  it("shows step counter on /journey/3", () => {
    renderAt("/journey/3");
    expect(screen.getByText("03 / 06")).toBeInTheDocument();
  });

  it("shows step counter on /journey/1", () => {
    renderAt("/journey/1");
    expect(screen.getByText("01 / 06")).toBeInTheDocument();
  });
});
