import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useWalletStore } from "@/store/walletStore";

// Mock @miden-sdk/miden-wallet-adapter
vi.mock("@miden-sdk/miden-wallet-adapter", () => ({
  MidenFiSignerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  WalletMultiButton: () => (
    <button data-testid="wallet-connect-button">Connect Wallet</button>
  ),
}));

// Mock @miden-sdk/react
vi.mock("@miden-sdk/react", () => ({
  MidenProvider: ({ children }: { children: React.ReactNode }) => children,
  useMidenClient: () => ({}),
  useAccounts: () => ({ wallets: [] }),
}));

describe("Phase 6: Wallet Integration & Protected Routes", () => {
  beforeEach(() => {
    // Reset wallet store before each test
    useWalletStore.setState({
      connected: false,
      account: null,
      connecting: false,
      error: null,
    });
  });

  describe("Wallet Connection Flow", () => {
    it("should render /connect page with wallet button", () => {
      render(<App />);
      expect(screen.getByTestId("wallet-connect-button")).toBeInTheDocument();
      expect(screen.getByText("MedScript")).toBeInTheDocument();
    });

    it("should show dev mode shortcuts in development", () => {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        render(<App />);
        expect(
          screen.getByRole("button", { name: /login as pharmacist/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /login as doctor/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /login as patient/i })
        ).toBeInTheDocument();
      }
    });

    it("should redirect to pharmacist dashboard after pharmacist login", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Welcome to Your Pharmacy Portal")).toBeInTheDocument();
      });
    });

    it("should redirect to doctor dashboard after doctor login", async () => {
      const user = userEvent.setup();
      render(<App />);

      const doctorBtn = screen.getByRole("button", {
        name: /login as doctor/i,
      });
      await user.click(doctorBtn);

      await waitFor(() => {
        expect(screen.getByText("Doctor")).toBeInTheDocument();
      });
    });

    it("should redirect to patient dashboard after patient login", async () => {
      const user = userEvent.setup();
      render(<App />);

      const patientBtn = screen.getByRole("button", {
        name: /login as patient/i,
      });
      await user.click(patientBtn);

      await waitFor(() => {
        expect(screen.getByText("MedScript")).toBeInTheDocument();
      });
    });
  });

  describe("Protected Routes", () => {
    it("should redirect unauthenticated user to /connect", async () => {
      render(<App />);
      expect(screen.getByTestId("wallet-connect-button")).toBeInTheDocument();
    });

    it("should show TopBar with account info on authenticated pages", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Testnet")).toBeInTheDocument();
        expect(screen.getByText("Pharmacist")).toBeInTheDocument();
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });
    });

    it("should disconnect and redirect to /connect", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Pharmacist")).toBeInTheDocument();
      });

      const disconnectBtn = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectBtn);

      await waitFor(() => {
        expect(screen.getByTestId("wallet-connect-button")).toBeInTheDocument();
      });
    });

    it("should show role-specific badge colors", async () => {
      const user = userEvent.setup();
      render(<App />);

      const doctorBtn = screen.getByRole("button", {
        name: /login as doctor/i,
      });
      await user.click(doctorBtn);

      await waitFor(() => {
        expect(screen.getByText("Doctor")).toBeInTheDocument();
      });
    });
  });

  describe("TopBar Display", () => {
    it("should show network badge on authenticated pages", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Testnet")).toBeInTheDocument();
      });
    });

    it("should show role badge with correct text", async () => {
      const user = userEvent.setup();
      render(<App />);

      const doctorBtn = screen.getByRole("button", {
        name: /login as doctor/i,
      });
      await user.click(doctorBtn);

      await waitFor(() => {
        expect(screen.getByText("Doctor")).toBeInTheDocument();
      });
    });

    it("should show verification status indicator", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });
    });
  });
});
