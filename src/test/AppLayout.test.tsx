import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
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
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

  it("renders the Ancestra logo", () => {
    renderAt("/");
    expect(screen.getByText("Ancestra")).toBeInTheDocument();
  });

  it("renders all nav links", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: /free tools/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /begin journey/i })).toBeInTheDocument();
  });

  it("Free Tools link points to /tools", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: /free tools/i })).toHaveAttribute("href", "/tools");
  });

  it("renders page content via Outlet", () => {
    renderAt("/");
    expect(screen.getByText("page content")).toBeInTheDocument();
  });
});

describe("AppLayout — back button", () => {
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

  it("hides back button on landing page /", () => {
    renderAt("/");
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("hides back button on /journey/1", () => {
    renderAt("/journey/1");
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
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
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

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

describe("AppLayout — entry portal", () => {
  beforeEach(() => sessionStorage.clear());

  it("shows portal when sessionStorage key is not set", () => {
    renderAt("/");
    expect(screen.getByText("Welcome to Ancestra")).toBeInTheDocument();
  });

  it("hides portal when sessionStorage key is already set", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.queryByText("Welcome to Ancestra")).not.toBeInTheDocument();
  });
});

describe("AppLayout — sound toggle", () => {
  it("shows sound toggle after portal is dismissed", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.getByLabelText("Toggle sound")).toBeInTheDocument();
  });

  it("hides sound toggle when portal is showing", () => {
    sessionStorage.clear();
    renderAt("/");
    expect(screen.queryByLabelText("Toggle sound")).not.toBeInTheDocument();
  });
});
