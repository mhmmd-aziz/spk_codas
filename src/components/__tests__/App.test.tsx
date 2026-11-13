import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";

describe("CODAS DSS UI", () => {
  it("loads the journal preset on Dashboard and supports bilingual switching", () => {
    render(<App />);
    expect(
      screen.getByText(/Ringkasan Sistem Pendukung Keputusan CODAS/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/S1: Tripoli/i)).toBeInTheDocument();

    // Switch to English
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(
      screen.getByText(/CODAS Decision Support System Overview/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Model Builder/i }),
    ).toBeInTheDocument();
  });

  it("navigates through all 8 walkthrough steps and updates on model edits", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    // Open Calculation Process
    fireEvent.click(screen.getByRole("button", { name: /Calculation Process/i }));
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: /Next/i });
    for (let s = 2; s <= 8; s++) {
      fireEvent.click(nextBtn);
      expect(screen.getByText(new RegExp(`Step ${s} of 8`, "i"))).toBeInTheDocument();
    }

    // Step back with Previous
    fireEvent.click(screen.getByRole("button", { name: /Previous/i }));
    expect(screen.getByText(/Step 7 of 8/i)).toBeInTheDocument();

    // Navigate to Model Builder, modify tau, and verify preset reset confirmation
    fireEvent.click(screen.getByRole("button", { name: /Model Builder/i }));
    const tauInput = screen.getByLabelText(/Threshold Parameter/i);
    fireEvent.change(tauInput, { target: { value: "0.04" } });
    fireEvent.blur(tauInput);

    // Reset button is now enabled
    const resetBtn = screen.getByRole("button", {
      name: /Restore Journal Preset/i,
    });
    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));
    expect(
      (screen.getByLabelText(/Threshold Parameter/i) as HTMLInputElement).value,
    ).toBe("0.02");
  });
});

