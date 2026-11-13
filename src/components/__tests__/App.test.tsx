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

  it("opens dedicated Live Animation menu, steps through operands, and reaches Final Ranking", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    // Open Live Animation sidebar menu item
    fireEvent.click(screen.getByRole("button", { name: /Live Animation/i }));
    expect(
      screen.getByText(/Live CODAS Calculation Animation/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Frame 1 \/ 90/i)).toBeInTheDocument();

    // Advance one frame and verify operand/result spotlight updates
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText(/Frame 2 \/ 90/i)).toBeInTheDocument();
    expect(screen.getByText(/Normalize S1 .* on C2/i)).toBeInTheDocument();

    // Jump to Weighted stage (a x b: w_j x n_ij) and Final Ranking stage
    fireEvent.click(screen.getByRole("button", { name: /2\. Weighted/i }));
    expect(screen.getByText(/Weighted Value S1 on C1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /7\. Ranking/i }));
    expect(screen.getByText(/Assign Rank #1: S1/i)).toBeInTheDocument();

    // Toggle Play / Pause state cleanly
    fireEvent.click(screen.getByRole("button", { name: /^Play$/i }));
    expect(screen.getByText(/PLAYING/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Pause$/i }));
    expect(screen.getByText(/PAUSED/i)).toBeInTheDocument();
  });
});

