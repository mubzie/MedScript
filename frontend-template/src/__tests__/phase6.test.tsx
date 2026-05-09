import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useWalletStore } from "@/store/walletStore";

const {
  mockConnectWallet,
  mockDisconnectWallet,
  mockSyncState,
  mockGetIncomingNotes,
} = vi.hoisted(() => ({
  mockConnectWallet: vi.fn(),
  mockDisconnectWallet: vi.fn(),
  mockSyncState: vi.fn(),
  mockGetIncomingNotes: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/miden/midenClient", () => ({
  connectWallet: (...args: unknown[]) => mockConnectWallet(...args),
  midenClient: {
    disconnectWallet: () => mockDisconnectWallet(),
    syncState: () => mockSyncState(),
    getIncomingNotes: (...args: unknown[]) => mockGetIncomingNotes(...args),
  },
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
    mockConnectWallet.mockReset();
    mockDisconnectWallet.mockReset();
    mockSyncState.mockReset();
    mockGetIncomingNotes.mockReset().mockResolvedValue([]);
    mockConnectWallet.mockImplementation(async (role: string) => ({
      id: `0x${role}_account`,
      type: role,
      credentialHash: "0x" + "a".repeat(64),
      isVerified: true,
      network: "testnet",
    }));
    vi.clearAllMocks();
  });

  describe("Wallet Connection Flow", () => {
    it("should render /connect page with role buttons", () => {
      render(<App />);
      expect(
        screen.getByRole("button", { name: /connect as pharmacist/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /connect as doctor/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /connect as patient/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("MedScript")).toBeInTheDocument();
    });

    it.each([
      ["pharmacist", /connect as pharmacist/i],
      ["doctor", /connect as doctor/i],
      ["patient", /connect as patient/i],
    ] as const)(
      "calls connectWallet with %s when the role button is clicked",
      async (role, buttonName) => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: buttonName }));

        await waitFor(() => {
          expect(mockConnectWallet).toHaveBeenCalledWith(role);
        });
      },
    );

    it("shows the two-stage loading state while connecting", async () => {
      const user = userEvent.setup();
      let resolveConnect: ((value: unknown) => void) | undefined;

      mockConnectWallet.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConnect = resolve;
          }),
      );

      render(<App />);

      await user.click(
        screen.getByRole("button", { name: /connect as pharmacist/i }),
      );

      expect(screen.getByText("Initializing Miden client...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Creating your account on testnet...")).toBeInTheDocument();
      });

      resolveConnect?.({
        id: "0x962c393e4be8b7002d78783908a73e",
        type: "pharmacist",
        credentialHash: "0x" + "a".repeat(64),
        isVerified: true,
        network: "testnet",
      });

      await waitFor(() => {
        expect(screen.getByText("Today's Queue")).toBeInTheDocument();
      });
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

    it("should redirect to pharmacist dashboard via dev shortcut", async () => {
      const user = userEvent.setup();
      render(<App />);

      const pharmacistBtn = screen.getByRole("button", {
        name: /login as pharmacist/i,
      });
      await user.click(pharmacistBtn);

      await waitFor(() => {
        expect(screen.getByText("Today's Queue")).toBeInTheDocument();
      });
    });

    it("should redirect to doctor dashboard via dev shortcut", async () => {
      const user = userEvent.setup();
      render(<App />);

      const doctorBtn = screen.getByRole("button", {
        name: /login as doctor/i,
      });
      await user.click(doctorBtn);

      await waitFor(() => {
        expect(screen.getByText("Doctor Portal")).toBeInTheDocument();
      });
    });

    it("should redirect to patient dashboard via dev shortcut", async () => {
      const user = userEvent.setup();
      render(<App />);

      const patientBtn = screen.getByRole("button", {
        name: /login as patient/i,
      });
      await user.click(patientBtn);

      await waitFor(() => {
        expect(screen.getByText("Patient Portal")).toBeInTheDocument();
      });
    });

    it("should redirect to dashboard when real wallet connects", async () => {
      // Manually trigger the wallet store update (simulating useWalletConnection hook)
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Today's Queue")).toBeInTheDocument();
      });
    });
  });

  describe("Protected Routes", () => {
    it("should redirect unauthenticated user to /connect", async () => {
      render(<App />);
      expect(
        screen.getByRole("button", { name: /connect as pharmacist/i }),
      ).toBeInTheDocument();
    });

    it("should show TopBar with account info on authenticated pages", async () => {
      // Simulate wallet connection
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Testnet")).toBeInTheDocument();
        expect(screen.getByText("Pharmacist")).toBeInTheDocument();
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });
    });

    it("should disconnect and redirect to /connect", async () => {
      const user = userEvent.setup();

      // Start as connected
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Pharmacist")).toBeInTheDocument();
      });

      const disconnectBtn = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectBtn);

      // Should call wallet.disconnectWallet()
      expect(mockDisconnectWallet).toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /connect as pharmacist/i }),
        ).toBeInTheDocument();
      });
    });

    it("should show role-specific badge for doctor", async () => {
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0xce9a185139464d0077efb96d6dfaa3",
          type: "doctor",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Doctor")).toBeInTheDocument();
      });
    });

    it("should show role-specific badge for patient", async () => {
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x3a1b2c5d8e9f4a6b7c8d9e0f1a2b3c4d",
          type: "patient",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Patient")).toBeInTheDocument();
      });
    });
  });

  describe("TopBar Display", () => {
    it("should show network badge on authenticated pages", async () => {
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Testnet")).toBeInTheDocument();
      });
    });

    it("should show truncated account ID", async () => {
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("0x962c...a73e")).toBeInTheDocument();
      });
    });

    it("should show verification status indicator", async () => {
      useWalletStore.setState({
        connected: true,
        account: {
          id: "0x962c393e4be8b7002d78783908a73e",
          type: "pharmacist",
          credentialHash: "0x" + "a".repeat(64),
          isVerified: true,
          network: "testnet",
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });
    });
  });
});
