import type {
  AccountType,
  MidenAccount,
  PrescriptionNote,
  FulfillmentAuthorizationNote,
  CreatePrescriptionRequest,
  ApprovePrescriptionRequest,
} from "@/types";

const RPC_ENDPOINT = "https://rpc.testnet.miden.io:443";
const TX_PROVER_ENDPOINT = "https://tx-prover.testnet.miden.io";

let _client: any = null;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRemoteProver() {
  const { TransactionProver } = await import("@miden-sdk/miden-sdk");
  return TransactionProver.newRemoteProver(TX_PROVER_ENDPOINT);
}

async function getStoredAccountId(role: AccountType) {
  const stored = getStoredAccountForRole(role);
  if (!stored) {
    throw new Error(`Missing stored ${role} account`);
  }

  const { AccountId } = await import("@miden-sdk/miden-sdk");
  return AccountId.fromBech32(stored.id);
}

async function submitTransactionRequest(
  accountId: any,
  transactionRequest: any,
): Promise<string> {
  const client = await getClient();
  const prover = await getRemoteProver();
  const transactionId = await client.submitNewTransactionWithProver(
    accountId,
    transactionRequest,
    prover,
  );
  return transactionId.toHex();
}

export async function getClient() {
  if (_client) return _client;
  const { WebClient } = await import("@miden-sdk/miden-sdk");
  _client = await WebClient.createClient(RPC_ENDPOINT);
  return _client;
}

export async function connectWallet(
  role: "pharmacist" | "doctor" | "patient",
): Promise<MidenAccount> {
  const storageKey = `medscript_${role}_account`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return JSON.parse(stored) as MidenAccount;
  }

  const { AccountStorageMode } = await import("@miden-sdk/miden-sdk");
  const client = await getClient();

  const account = await client.newWallet(AccountStorageMode.private(), true);
  const accountData: MidenAccount = {
    id: account.id().toBech32(),
    type: role,
    credentialHash: "0x" + "a".repeat(64),
    isVerified: true,
    network: "testnet",
  };

  localStorage.setItem(storageKey, JSON.stringify(accountData));
  return accountData;
}

export async function syncState() {
  const client = await getClient();
  await client.syncState();
}

async function submitWithRemoteProver(txResult: any): Promise<string> {
  const { TransactionProver } = await import("@miden-sdk/miden-sdk");
  const prover = TransactionProver.newRemoteProver(TX_PROVER_ENDPOINT);
  const client = await getClient();
  const transactionId = await client.submitTransaction(txResult, prover);
  return typeof transactionId === "string" ? transactionId : transactionId.toString();
}

async function terminateClient() {
  if (_client && typeof _client.terminate === "function") {
    await _client.terminate();
    _client = null;
  }
}

function getStoredAccountForRole(role: AccountType): MidenAccount | null {
  const stored = localStorage.getItem(`medscript_${role}_account`);
  return stored ? (JSON.parse(stored) as MidenAccount) : null;
}

type ApprovalResult = FulfillmentAuthorizationNote & { transactionId?: string };

export const midenClient = {
  getClient,
  connectWallet,
  syncState,

  async getWalletStatus(): Promise<{
    connected: boolean;
    account: MidenAccount | null;
  }> {
    const account =
      getStoredAccountForRole("pharmacist") ??
      getStoredAccountForRole("doctor") ??
      getStoredAccountForRole("patient");
    return { connected: Boolean(account), account };
  },

  async disconnectWallet(): Promise<void> {
    await terminateClient();
  },

  async getCredentialStatus(_accountId: string): Promise<boolean> {
    return true;
  },

  async createPrescriptionNote(
    payload: CreatePrescriptionRequest,
  ): Promise<PrescriptionNote> {
    await sleep(1200);
    return {
      id: `prescription_${Date.now()}`,
      patientId: payload.patientId,
      pharmacistId: getStoredAccountForRole("pharmacist")?.id ?? "unknown",
      doctorId: undefined,
      testResultsHash: payload.testResultsHash,
      medication: payload.medication,
      dosage: payload.dosage,
      frequency: payload.frequency,
      duration: payload.duration,
      pharmacistNotes: payload.notes,
      status: "in_transit",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + payload.expiryDays * 24 * 60 * 60 * 1000),
    };
  },

  async sendNoteToDoctor(
    _note: PrescriptionNote,
    doctorAccountId: string,
  ): Promise<string> {
    const senderAccountId = await getStoredAccountId("pharmacist");
    const { AccountId, NoteType } = await import("@miden-sdk/miden-sdk");
    const targetAccountId = AccountId.fromBech32(doctorAccountId);
    const client = await getClient();
    const senderAccount = await client.getAccount(senderAccountId);
    const faucetId = senderAccount.vault().fungibleAssets()[0]?.faucetId() ?? senderAccountId;
    const transactionRequest = client.newSendTransactionRequest(
      senderAccountId,
      targetAccountId,
      faucetId,
      NoteType.Private,
      0n,
    );

    return submitTransactionRequest(senderAccountId, transactionRequest);
  },

  async getIncomingNotes(_accountId?: string): Promise<PrescriptionNote[]> {
    await syncState();
    return [];
  },

  async consumeNote(_noteId: string): Promise<string> {
    const accountId = await getStoredAccountId("doctor");
    const client = await getClient();
    const consumableNotes = await client.getConsumableNotes(accountId);
    const noteToConsume = consumableNotes.find(
      (note: any) => note.inputNoteRecord().toNote().id().toHex() === _noteId,
    )?.inputNoteRecord().toNote();

    if (!noteToConsume) {
      throw new Error("Consumable note not found");
    }

    const transactionRequest = client.newConsumeTransactionRequest([noteToConsume]);
    return submitTransactionRequest(accountId, transactionRequest);
  },

  async approvePrescription(
    payload: ApprovePrescriptionRequest,
  ): Promise<ApprovalResult> {
    const senderAccountId = await getStoredAccountId("doctor");
    const { AccountId, NoteType } = await import("@miden-sdk/miden-sdk");
    const pharmacistAccount = getStoredAccountForRole("pharmacist");
    if (!pharmacistAccount) {
      throw new Error("Missing stored pharmacist account");
    }

    const targetAccountId = AccountId.fromBech32(pharmacistAccount.id);
    const client = await getClient();
    const senderAccount = await client.getAccount(senderAccountId);
    const faucetId = senderAccount.vault().fungibleAssets()[0]?.faucetId() ?? senderAccountId;
    const transactionRequest = client.newSendTransactionRequest(
      senderAccountId,
      targetAccountId,
      faucetId,
      NoteType.Private,
      0n,
    );
    const transactionId = await submitTransactionRequest(senderAccountId, transactionRequest);

    return {
      id: `fulfillment_${Date.now()}`,
      prescriptionNoteId: payload.prescriptionNoteId,
      doctorId: getStoredAccountForRole("doctor")?.id ?? "unknown",
      pharmacistId: getStoredAccountForRole("pharmacist")?.id ?? "unknown",
      approvedMedication: payload.medication,
      approvedDosage: payload.dosage,
      doctorNotes: payload.doctorNotes,
      isModified: payload.isModified,
      status: "approved",
      createdAt: new Date(),
      transactionId,
    };
  },

  async rejectNote(_noteId: string, _reason: string): Promise<string> {
    await sleep(600);
    return `tx_reject_${Date.now()}`;
  },

  async createFulfillmentNote(payload: {
    pharmacistId: string;
    medication: string;
    doctorNotes: string;
  }): Promise<string> {
    const senderAccountId = await getStoredAccountId("doctor");
    const { AccountId, NoteType } = await import("@miden-sdk/miden-sdk");
    const targetAccountId = AccountId.fromBech32(payload.pharmacistId);
    const client = await getClient();
    const senderAccount = await client.getAccount(senderAccountId);
    const faucetId = senderAccount.vault().fungibleAssets()[0]?.faucetId() ?? senderAccountId;
    const transactionRequest = client.newSendTransactionRequest(
      senderAccountId,
      targetAccountId,
      faucetId,
      NoteType.Private,
      0n,
    );

    return submitTransactionRequest(senderAccountId, transactionRequest);
  },

  async markFulfilled(_prescriptionNoteId: string): Promise<string> {
    await sleep(1000);
    return `tx_fulfilled_${Date.now()}`;
  },

  async syncAccountState(): Promise<void> {
    await syncState();
  },

  async submitTransactionWithRemoteProver(txResult: any): Promise<string> {
    return submitWithRemoteProver(txResult);
  },
};
